const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const admin = fs.readFileSync('admin.html', 'utf8');
function section(start, end) { const i = admin.indexOf(start); const j = admin.indexOf(end, i); assert.ok(i >= 0 && j > i); return admin.slice(i, j); }
function run(code, context) { return vm.runInNewContext(code, context); }
test('every local JS and inline HTML script parses', () => {
  for (const file of fs.readdirSync('.')) {
    if (file.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
    if (file.endsWith('.html')) for (const match of fs.readFileSync(file, 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(match[1], { filename: file });
  }
});
const save = section('        document.getElementById("saveBtn").onclick', '        // --- HELPER FUNCTIONS');
function saveContext(type, error = null) {
  const values = { input1: 'Same name', input2: type === 'Passenger' ? 'a@example.com' : 'A - B', inputPhone: '+966512345678', inputStandardSeats: '10', inputVipSeats: '2', inputStandardPrice: '12.75', inputVipPrice: '42.50', inputDep: '10:00', inputArr: '11:00', passengerSelect: 'passenger-id', trainSelect: 'train-id', ticketType: 'VIP', input3: '2026-10-20' };
  const els = Object.fromEntries(Object.entries(values).map(([k, value]) => [k, { value }])); els.saveBtn = {};
  const calls = []; const alerts = [];
  const chain = { update: data => { calls.push(['update', data]); return chain; }, insert: data => { calls.push(['insert', data]); return chain; }, eq: (...args) => { calls.push(['eq', ...args]); return chain; }, select: () => chain, single: async () => ({ error }) };
  const context = { document: { getElementById: id => els[id] }, currentTable: type, editingRow: { dataset: { dbId: 'existing-id' } }, supabaseClient: { from: table => { calls.push(['from', table]); return chain; }, rpc: async (...args) => { calls.push(['rpc', ...args]); return { error }; } }, closeModal: () => calls.push(['close']), loadAllData: async () => calls.push(['reload']), finishSave: () => calls.push(['finish']), alert: m => alerts.push(m) };
  context.saveExistingReservation = async (id, payload) => { calls.push(['reservation', id, payload]); if (error) throw error; return {}; };
  context.window = { currentUserRole: 'ADMIN' };
  context.saveExistingTrain = async (id, payload) => { calls.push(['train', id, payload]); if (error) throw error; return {}; };
  run(save, context);
  return { context, calls, alerts, els, invoke: () => els.saveBtn.onclick.call(els.saveBtn) };
}
test('passenger edit updates existing ID without insert', async () => {
  const c = saveContext('Passenger'); await c.invoke();
  assert.ok(c.calls.some(x => x[0] === 'update')); assert.ok(!c.calls.some(x => x[0] === 'insert'));
  assert.deepEqual(c.calls.find(x => x[0] === 'eq'), ['eq', 'id', 'existing-id']);
});
test('reservation edit preserves existing ID and foreign keys', async () => {
  const c = saveContext('Reservation'); await c.invoke(); const call = c.calls.find(x => x[0] === 'reservation');
  assert.equal(call[1], 'existing-id');
  assert.equal(call[2].passenger_id, 'passenger-id'); assert.equal(call[2].train_id, 'train-id');
  assert.ok(!c.calls.some(x => x[0] === 'from'));
});
test('new reservation sends null ID', async () => {
  const c = saveContext('Reservation'); c.context.editingRow = null; await c.invoke();
  assert.equal(c.calls.find(x => x[0] === 'reservation')[1], null);
});
test('reservation edit modal prefills IDs, date and class', () => {
  const elements = Object.fromEntries(['modalTitle','passengerSelect','trainSelect','ticketType','input3'].map(id => [id, {}]));
  const row = { parentElement: { id: 'reservationTable' }, dataset: { passengerId: 'p-id', trainId: 't-id' }, cells: Array.from({ length: 7 }, (_, i) => ({ innerText: i === 3 ? 'VIP' : i === 5 ? '2026-10-20' : '' })) };
  const c = { document: { getElementById: id => elements[id] }, openModal(type) { c.currentTable = type; } };
  run(section('        function editRow', '        function populateDropdowns'), c);
  c.editRow({ parentElement: { parentElement: row } });
  assert.equal(elements.passengerSelect.value, 'p-id'); assert.equal(elements.trainSelect.value, 't-id');
  assert.equal(elements.ticketType.value, 'VIP'); assert.equal(elements.input3.value, '2026-10-20');
});
test('train edit sends times and decimal fares without resetting inventory', async () => {
  const c = saveContext('Train'); await c.invoke(); const call = c.calls.find(x => x[0] === 'train');
  assert.equal(call[1], 'existing-id'); assert.equal(call[2].standard_price, 12.75);
  assert.equal(call[2].departure_time, '10:00'); assert.equal(call[2].arrival_time, '11:00');
});
test('database error does not close, refresh, or report success', async () => {
  const c = saveContext('Reservation', { message: 'Not enough seats' }); await c.invoke();
  assert.match(c.alerts[0], /Not enough seats/); assert.ok(!c.calls.some(x => ['close', 'reload', 'finish'].includes(x[0]))); assert.equal(c.els.saveBtn.disabled, false);
});
test('fractional capacity is rejected before a database call', async () => {
  const c = saveContext('Train'); c.els.inputStandardSeats.value = '1.5'; await c.invoke();
  assert.equal(c.calls.length, 0); assert.match(c.alerts[0], /integers/);
});
test('reload failure is distinguished from failed persistence', async () => {
  const c = saveContext('Passenger'); c.context.loadAllData = async () => { throw Error('offline'); }; await c.invoke();
  assert.match(c.alerts[0], /Saved, but refresh failed/);
});
test('report periods reject invalid and future weekly dates', () => {
  const c = {}; run(section('        function matchesReportPeriod', '        function getReportMetrics'), c);
  const now = new Date('2026-10-20T12:00:00');
  assert.equal(c.matchesReportPeriod(new Date('2026-10-21'), 'weekly', now), false);
  assert.equal(c.matchesReportPeriod(new Date('invalid'), null, now), false);
  assert.equal(c.matchesReportPeriod(new Date('2026-10-19'), 'weekly', now), true);
  assert.equal(c.matchesReportPeriod(new Date('2026-09-20'), 'monthly', now), false);
});
test('reports use confirmed seats and decimal saved fares; route names cannot poison counts', () => {
  const row = (status, seats, fare) => ({ cells: ['id','2026-10-20','Name','Train','VIP','__proto__',String(seats),String(fare),status].map(innerText => ({ innerText })), style: {} });
  const c = { document: { querySelectorAll: () => [row('Confirmed', 3, 12.75), row('Canceled', 10, 99)] } };
  run(section('        function matchesReportPeriod', '        function updateReportAnalytics'), c);
  const m = c.getReportMetrics(null); assert.equal(m.totalRevenue, 38.25); assert.equal(m.seatsSold, 3); assert.equal(m.topRoute, '__proto__'); assert.equal(m.topRouteCount, 1);
});
test('HTML interpolation escapes quotes and markup', () => {
  const c = {}; run(section('        function escapeHtml', '        function updateTrainTracking'), c);
  assert.equal(c.escapeHtml('<img src=x onerror="alert(1)">&\''), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
});
test('shared dashboard skips missing elements and does not override admin statistics', async () => {
  for (const adminPage of [false, true]) {
    const listeners = []; let queries = 0;
    const c = { document: { getElementById: id => adminPage && id === 'trainTable' ? {} : null }, window: { addEventListener: (_, fn) => listeners.push(fn), location: {} }, supabaseClient: { auth: { getSession: async () => ({ data: { session: { user: { email_confirmed_at: 'confirmed' } } } }) }, from: () => { queries++; throw Error('Unexpected query'); } } };
    run(fs.readFileSync('dashboard.js', 'utf8'), c); for (const fn of listeners) await fn(); assert.equal(queries, 0);
  }
});
test('shared dashboard computes occupancy from seats, not record counts', async () => {
  const target = {}; const c = { document: { getElementById: id => id === 'occupancyRate' ? target : null }, window: { addEventListener() {}, location: {} }, supabaseClient: { auth: { getSession: async () => ({ data: { session: { user: { email_confirmed_at: 'yes' } } } }) }, from: () => ({ select: async () => ({ data: [{ standard_seats: 80, vip_seats: 20, available_standard_seats: 40, available_vip_seats: 10 }] }) }) } };
  run(fs.readFileSync('dashboard.js','utf8'), c); await c.calculateOccupancy(); assert.equal(target.innerText, '50%');
});
test('load error preserves existing table and includes database message', async () => {
  const table = { innerHTML: 'existing rows' }; const c = { document: { getElementById: id => id === 'trainTable' ? table : null }, supabaseClient: { from: () => ({ select: () => ({ order: async () => ({ error: { message: 'permission denied' } }) }) }) } };
  run(fs.readFileSync('storage.js','utf8'), c); await assert.rejects(c.loadAllData(), /permission denied/); assert.equal(table.innerHTML, 'existing rows');
});
test('login accepts an existing Supabase session without extra confirmation requirements', async () => {
  const index = fs.readFileSync('index.html','utf8'); const script = [...index.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].find(x => x[1].includes('signInWithPassword'))[1];
  let handler, signedOut = false, password;
  const els = { username: { value: ' a@example.com ' }, password: { value: ' Pass123! ' }, error: {}, loginForm: { addEventListener: (_, fn) => { handler = fn; } } };
  const c = { document: { addEventListener: (_, fn) => fn(), getElementById: id => els[id] }, window: { location: {} }, supabaseClient: { auth: { signInWithPassword: async payload => { password = payload.password; return { data: { user: {} } }; }, signOut: async () => { signedOut = true; return {}; } } } };
  c.supabaseClient.auth.signInWithPassword = async payload => { password = payload.password; return { data: { session: { user: {} } } }; };
  run(script,c); const button = {}; await els.loginForm.onsubmit({ preventDefault() {}, submitter: button });
  assert.equal(password, ' Pass123! '); assert.equal(signedOut, false); assert.equal(c.window.location.href, 'admin.html'); assert.equal(button.disabled, false);
});
test('cancellation failure does not change rows or refresh inventory', async () => {
  let refreshed = false; const messages = [];
  const row = { parentElement: { id: 'reservationTable' }, cells: Array.from({ length: 7 }, () => ({ innerText: 'Confirmed' })), dataset: { dbId: 'reservation-id' } };
  const c = { confirm: () => true, alert: m => messages.push(m), supabaseClient: { rpc: async (name, args) => { assert.equal(name,'cancel_reservation'); assert.equal(args.p_id,'reservation-id'); return { error: { message: 'permission denied' } }; } }, loadAllData: async () => { refreshed = true; } };
  c.cancelExistingReservation = async () => { throw Error('permission denied'); };
  run(section('        async function deleteRow', '        function editRow'), c); await c.deleteRow({ parentElement: { parentElement: row } });
  assert.equal(refreshed,false); assert.match(messages[0],/permission denied/); assert.equal(row.cells[6].innerText,'Confirmed');
});
test('bulk wipe failure reports error without reloading', async () => {
  const messages = []; let reloaded = false;
  const c = { confirm: () => true, alert: m => messages.push(m), location: { reload: () => { reloaded = true; } }, supabaseClient: { rpc: async name => { assert.equal(name,'clear_system_data'); return { error: { message: 'denied' } }; } } };
  c.supabaseClient.from = () => ({ delete: () => ({ neq: async () => ({ error: { message: 'denied' } }) }) });
  run(fs.readFileSync('storage.js','utf8'), c); await c.clearAllSystemData(); assert.equal(reloaded,false); assert.match(messages[0],/denied/);
});
test('rapid repeated Save clicks invoke one reservation operation', async () => {
  const c=saveContext('Reservation'); let release, count=0;
  c.context.saveExistingReservation=async()=>{ count++; return new Promise(resolve=>{release=resolve;}); };
  const first=c.invoke(); await c.invoke(); assert.equal(count,1); release({}); await first; assert.equal(c.els.saveBtn.disabled,false);
});
test('signup preserves selected role and prevents overlapping keyboard submissions',async()=>{
  const values={newUsername:'Test',newEmail:'test@example.com',newPassword:'Password1!',privacyCheck:true};
  const els=Object.fromEntries(Object.entries(values).map(([id,value])=>[id,id==='privacyCheck'?{checked:value}:{value}])); els.signupForm={}; els.signupError={};
  let resolveSignup, calls=0, role;
  const c={document:{getElementById:id=>els[id],querySelector:()=>({value:'admin'})},supabaseClient:{auth:{signUp:async payload=>{calls++;role=payload.options.data.role;return new Promise(resolve=>{resolveSignup=resolve;});}}},alert(){},showLogin(){},window:{location:{href:'https://example.invalid/index.html'}}};
  run(fs.readFileSync('auth.js','utf8'),c);
  const event={preventDefault(){}}; const first=els.signupForm.onsubmit(event); await els.signupForm.onsubmit(event);
  assert.equal(calls,1); assert.equal(role,'ADMIN'); resolveSignup({data:{session:null},error:null}); await first;
});
test('failed train load does not prevent passenger loading or change active modal type',async()=>{
  const train={innerHTML:'existing train'},passengers={innerHTML:'old'}; const inserted=[];
  const c={currentTable:'Train',document:{getElementById:id=>id==='trainTable'?train:id==='passengerTable'?passengers:null},supabaseClient:{from:table=>({select:()=>({order:async()=>table==='trains'?{error:{message:'denied'}}:{data:[{id:'p1',name:'A',email:'a@example.com',phone:'1'}]}})})},insertNewRow:(data,id,type)=>inserted.push({data,id,type})};
  run(fs.readFileSync('storage.js','utf8'),c); await assert.rejects(c.loadAllData(),/denied/);
  assert.equal(inserted.length,1); assert.equal(inserted[0].type,'Passenger'); assert.equal(c.currentTable,'Train'); assert.equal(train.innerHTML,'existing train');
});
test('production JavaScript/HTML contains no RPC dependencies',()=>{
  for(const file of fs.readdirSync('.').filter(f=>/\.(js|html)$/.test(f))) assert.doesNotMatch(fs.readFileSync(file,'utf8'),/\.rpc\s*\(/,file);
});
