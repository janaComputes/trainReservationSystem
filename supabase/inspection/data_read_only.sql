-- READ ONLY, aggregate counts only. Run AFTER metadata confirms these columns exist
-- and seat columns are integers. Run each SELECT separately. Share counts/errors.
-- Every issue count should be zero; fare_basis is a human confirmation, not inferable here.

-- 1. Inventory disagrees with confirmed reservations, invalid capacities, nulls.
select count(*) as invalid_or_mismatched_trains
from public.trains t left join (
  select train_id,sum(case when ticket_type='Standard' then seats else 0 end) as std,
    sum(case when ticket_type='VIP' then seats else 0 end) as vip
  from public.reservations where status='Confirmed' group by train_id
) r on r.train_id=t.id
where t.standard_seats is null or t.vip_seats is null or t.standard_seats<0 or t.vip_seats<0
  or t.available_standard_seats is null or t.available_vip_seats is null
  or t.available_standard_seats not between 0 and t.standard_seats
  or t.available_vip_seats not between 0 and t.vip_seats
  or t.available_standard_seats is distinct from t.standard_seats-coalesce(r.std,0)
  or t.available_vip_seats is distinct from t.vip_seats-coalesce(r.vip,0);

-- 2. Fare compatibility. Values, names, emails and IDs are not returned.
with fares as (
  select 'trains.standard_price' as source,standard_price::text as value from public.trains
  union all select 'trains.vip_price',vip_price::text from public.trains
  union all select 'reservations.price',price::text from public.reservations
  union all select 'history.price',price::text from public.history
), checked as (
  select source,case when value ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$'
    then value::numeric<0 or value::numeric>9999999999.99 or value::numeric<>round(value::numeric,2)
    else true end as invalid from fares
)
select source,count(*) as total,count(*) filter(where invalid) as incompatible_fares
from checked group by source order by source;

-- 3. Invalid reservations and orphan references.
select count(*) filter(where r.seats is null or r.seats<=0 or r.ticket_type is null
    or r.ticket_type not in ('Standard','VIP') or r.status is null or r.status not in ('Confirmed','Canceled')
    or r.reservation_date is null) as invalid_reservations,
  count(*) filter(where p.id is null) as missing_passenger,
  count(*) filter(where t.id is null) as missing_train,
  count(*) filter(where r.seats>1) as multi_seat_rows_confirm_per_seat_fare_basis
from public.reservations r left join public.passengers p on p.id=r.passenger_id
left join public.trains t on t.id=r.train_id;

-- 4. History must be a single current snapshot per reservation, not an audit log.
select count(*) as duplicate_reservation_snapshot_groups from (
  select reservation_id from public.history where reservation_id is not null group by reservation_id having count(*)>1
) duplicates;
select count(*) as reservations_without_history from public.reservations r
where not exists(select 1 from public.history h where h.reservation_id=r.id);
select count(*) as orphan_history_references from public.history h
where h.reservation_id is not null and not exists(select 1 from public.reservations r where r.id=h.reservation_id);
select count(*) as inconsistent_history_snapshots from public.history h join public.reservations r on r.id=h.reservation_id
where h.status is distinct from r.status or h.seats is distinct from r.seats
  or h.price::text is distinct from r.price::text or h.ticket_type is distinct from r.ticket_type
  or h.reservation_date is distinct from r.reservation_date;

-- 5. Value distributions (no user-identifying fields).
select role,count(*) from public.profiles group by role order by role;
select status,ticket_type,count(*) from public.reservations group by status,ticket_type order by status,ticket_type;
