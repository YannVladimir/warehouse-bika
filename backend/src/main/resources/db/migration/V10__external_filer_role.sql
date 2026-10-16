-- chk_users_role_company already reads "role <> 'SUPER_ADMIN' => company_id required", which
-- already covers EXTERNAL_FILER correctly without changes -- only the role-name whitelist needs updating.
ALTER TABLE users DROP CONSTRAINT chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role
    CHECK (role IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'USER', 'EXTERNAL_FILER'));
