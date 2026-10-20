const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture() {
  const db = {
    trains: [{ id: 't1', name: 'Same', route: 'A-B', standard_seats: 5, vip_seats: 3, available_standard_seats: 5, available_vip_seats: 3, standard_price: 12.75, vip_price: 42.5 }, { id: 't2', name: 'Same', route: 'C-D', standard_seats: 5, vip_seats: 3, available_standard_seats: 5, available_vip_seats: 3, standard_price: 20.5, vip_price: 60.25 }],
    passengers: [{ id: 'p1', name: 'Same' }, { id: 'p2', name: 'Same' }], reservations: [], history: []
  };
  const failures = []; let next = 0;
  const client = { from(table) {
    let operation = 'select', payload; const filters = [];
    const q = { select() { return q; }, eq(k,v) { filters.push([k,v]); return q; }, update(data) { operation='update'; payload=data; return q; }, insert(data) { operation='insert'; payload=data; return q; },
      async execute(single) {
        const fault = failures.findIndex(f => f.table===table && f.operation===operation);
        if (fault>=0) return { data:null,error:{ message: failures.splice(fault,1)[0].message } };
        let rows = db[table].filter(r => filters.every(([k,v]) => r[k]===v));
        if (operation==='insert') { const row={ id:'new-'+(++next),...payload }; db[table].push(row); rows=[row]; }
        if (operation==='update') rows.forEach(r=>Object.assign(r,payload));
        if (single && rows.length!==1) return {data:null,error:{message:'No matching row'}};
        return {data:JSON.parse(JSON.stringify(single?rows[0]:rows)),error:null};
      }, single() {return q.execute(true);}, then(resolve,reject) {return q.execute(false).then(resolve,reject);} };
    return q;
  } };
  const context={supabaseClient:client}; vm.runInNewContext(fs.readFileSync('data-operations.js','utf8'),context);
  return {db,context,failures};
}
const booking = {passenger_id:'p2',train_id:'t2',ticket_type:'VIP',reservation_date:'2026-10-20'};
test('booking uses IDs and decimal fares with existing table writes',async()=>{
  const {db,context:c}=fixture(); await c.saveExistingReservation(null,booking);
  assert.equal(db.reservations.length,1); assert.equal(db.reservations[0].passenger_id,'p2');
  assert.equal(db.reservations[0].price,60.25); assert.equal(db.trains[0].available_vip_seats,3); assert.equal(db.trains[1].available_vip_seats,2);
  assert.equal(db.history[0].reservation_id,db.reservations[0].id);
});
test('reservation edit preserves ID, quantity and history identity while moving seats',async()=>{
  const {db,context:c}=fixture(); await c.saveExistingReservation(null,booking);
  const id=db.reservations[0].id,historyId=db.history[0].id;
  await c.saveExistingReservation(id,{...booking,train_id:'t1',ticket_type:'Standard'});
  assert.equal(db.reservations.length,1); assert.equal(db.reservations[0].id,id); assert.equal(db.reservations[0].price,12.75);
  assert.equal(db.trains[1].available_vip_seats,3); assert.equal(db.trains[0].available_standard_seats,4); assert.equal(db.history[0].id,historyId);
});
test('date/passenger edit retains sold fare and inventory after train price change',async()=>{
  const {db,context:c}=fixture(); await c.saveExistingReservation(null,booking); db.trains[1].vip_price=999;
  await c.saveExistingReservation(db.reservations[0].id,{...booking,passenger_id:'p1',reservation_date:'2026-10-21'});
  assert.equal(db.reservations[0].price,60.25); assert.equal(db.trains[1].available_vip_seats,2);
});
test('train edit preserves occupied seats and times; rejects capacity below bookings',async()=>{
  const {db,context:c}=fixture(); await c.saveExistingReservation(null,booking);
  await c.saveExistingTrain('t2',{standard_seats:6,vip_seats:4,departure_time:'10:30',arrival_time:'12:00'});
  assert.equal(db.trains[1].available_vip_seats,3); assert.equal(db.trains[1].available_standard_seats,6); assert.equal(db.trains[1].departure_time,'10:30');
  await assert.rejects(c.saveExistingTrain('t2',{standard_seats:6,vip_seats:0}),/smaller than booked/);
});
test('multi-seat cancellation refunds full quantity once',async()=>{
  const {db,context:c}=fixture(); await c.saveExistingReservation(null,booking);
  db.reservations[0].seats=2; db.trains[1].available_vip_seats=1;
  await c.cancelExistingReservation(db.reservations[0].id); await c.cancelExistingReservation(db.reservations[0].id);
  assert.equal(db.trains[1].available_vip_seats,3); assert.equal(db.reservations[0].status,'Canceled'); assert.equal(db.history[0].status,'Canceled');
});
test('history failure after a saved booking is a partial-success warning, not a retryable save error',async()=>{
  const {db,context:c,failures}=fixture(); failures.push({table:'history',operation:'insert',message:'denied'});
  const result=await c.saveExistingReservation(null,booking); assert.equal(db.reservations.length,1); assert.match(result.warning,/Reservation saved, but history/);
});
test('failed reservation write reports inventory side effect explicitly',async()=>{
  const {db,context:c,failures}=fixture(); failures.push({table:'reservations',operation:'insert',message:'denied'});
  await assert.rejects(c.saveExistingReservation(null,booking),/Inventory was updated first/); assert.equal(db.reservations.length,0);
});
test('no seats causes no reservation or history write',async()=>{
  const {db,context:c}=fixture(); db.trains[1].available_vip_seats=0;
  await assert.rejects(c.saveExistingReservation(null,booking),/Not enough seats/); assert.equal(db.reservations.length,0); assert.equal(db.history.length,0);
});
