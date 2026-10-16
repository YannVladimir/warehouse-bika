CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY,
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    company_id    UUID REFERENCES companies(id) ON DELETE SET NULL,
    entity_type   VARCHAR(50) NOT NULL,
    entity_id     VARCHAR(100),
    action        VARCHAR(50) NOT NULL,
    old_value     TEXT,
    new_value     TEXT,
    ip_address    VARCHAR(64),
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
