-- READ ONLY. Run each numbered SELECT separately in Supabase SQL Editor.
-- Share result grids/CSV (and errors), not credentials or any row-level personal data.
-- If a function definition embeds credentials, redact those values before sharing.

-- 1. Server, tables, owners and RLS (missing tables are apparent here).
select version() as server_version;
select n.nspname as schema_name,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,
  pg_get_userbyid(c.relowner) as owner
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('trains','passengers','reservations','history','profiles')
order by c.relname;

-- 2. Exact column types, nullability, defaults, identity and generated columns.
select table_schema,table_name,column_name,ordinal_position,data_type,udt_schema,udt_name,
  numeric_precision,numeric_scale,is_nullable,column_default,is_identity,is_generated,generation_expression
from information_schema.columns
where (table_schema='public' and table_name in ('trains','passengers','reservations','history','profiles'))
   or (table_schema='auth' and table_name='users' and column_name in ('id','email_confirmed_at'))
order by table_schema,table_name,ordinal_position;

-- 3. Constraints and indexes, including foreign-key targets/delete rules.
select n.nspname as schema_name,c.relname as table_name,k.conname,k.contype,k.convalidated,
  k.condeferrable,k.condeferred,pg_get_constraintdef(k.oid,true) as definition
from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('trains','passengers','reservations','history','profiles')
order by c.relname,k.conname;
select tablename,indexname,indexdef from pg_indexes
where schemaname='public' and tablename in ('trains','passengers','reservations','history','profiles')
order by tablename,indexname;

-- 4. Enum labels used by these tables.
select distinct tn.nspname as type_schema,t.typname,e.enumsortorder,e.enumlabel
from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
join pg_type t on t.oid=a.atttypid join pg_namespace tn on tn.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid
where n.nspname='public' and c.relname in ('trains','passengers','reservations','history','profiles')
order by tn.nspname,t.typname,e.enumsortorder;

-- 5. Triggers, including auth signup/profile provisioning. No auth user rows.
select n.nspname as schema_name,c.relname as table_name,t.tgname,t.tgenabled,
  pg_get_triggerdef(t.oid,true) as trigger_definition,
  pg_get_functiondef(t.tgfoid) as trigger_function_definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal and ((n.nspname='public' and c.relname in ('trains','passengers','reservations','history','profiles'))
  or (n.nspname='auth' and c.relname='users')) order by n.nspname,c.relname,t.tgname;

-- 6. RLS policies and explicit table/column ACLs, including PUBLIC grants.
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies
where schemaname='public' order by tablename,policyname;
select c.relname as table_name,case when g.grantee=0 then 'PUBLIC' else pg_get_userbyid(g.grantee) end as grantee,
  g.privilege_type,g.is_grantable
from pg_class c join pg_namespace n on n.oid=c.relnamespace
cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) g
where n.nspname='public' and c.relname in ('trains','passengers','reservations','history','profiles')
order by c.relname,grantee,g.privilege_type;
select c.relname as table_name,a.attname as column_name,
  case when g.grantee=0 then 'PUBLIC' else pg_get_userbyid(g.grantee) end as grantee,g.privilege_type
from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid
cross join lateral aclexplode(a.attacl) g
where n.nspname='public' and c.relname in ('trains','passengers','reservations','history','profiles')
order by c.relname,a.attname,grantee;

-- 7. Inherited role access and effective privileges (no password hashes).
select pg_get_userbyid(m.member) as member,pg_get_userbyid(m.roleid) as granted_role,m.admin_option
from pg_auth_members m order by member,granted_role;
select r.rolname,c.relname as table_name,
  has_table_privilege(r.oid,c.oid,'SELECT') as can_select,
  has_any_column_privilege(r.oid,c.oid,'INSERT') as can_insert_any_column,
  has_any_column_privilege(r.oid,c.oid,'UPDATE') as can_update_any_column,
  has_table_privilege(r.oid,c.oid,'DELETE') as can_delete,
  has_table_privilege(r.oid,c.oid,'TRUNCATE') as can_truncate
from pg_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
where r.rolname in ('anon','authenticated') and n.nspname='public'
  and c.relname in ('trains','passengers','reservations','history','profiles') order by r.rolname,c.relname;

-- 8. RPC collisions/overloads and alternative public write paths.
select p.oid::regprocedure as signature,pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result,p.prosecdef as security_definer,
  pg_get_userbyid(p.proowner) as owner,p.proconfig,p.proacl,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
  pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind in ('f','p') order by p.oid::regprocedure::text;
select schemaname,viewname,definition from pg_views where schemaname='public' order by viewname;
-- Defaults may explain why newly created functions/tables receive extra grants.
select pg_get_userbyid(d.defaclrole) as owner,n.nspname,d.defaclobjtype,d.defaclacl
from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace;
