-- A warehouse (and its location tree) created by a SUPER_ADMIN has no owning company at all --
-- it's a shared facility usable by any company. One created by a COMPANY_ADMIN keeps a company_id
-- and stays exclusive to that tenant. Postgres unique constraints already treat NULL as distinct
-- from any other value, so the existing uq_warehouses_company_name constraint doesn't block
-- duplicate-named shared warehouses -- that case is instead checked at the application layer.
ALTER TABLE warehouses ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE location_nodes ALTER COLUMN company_id DROP NOT NULL;
