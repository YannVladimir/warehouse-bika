ALTER TABLE companies
    ADD COLUMN source_system_id BIGINT,
    ADD COLUMN source_system_synced_at TIMESTAMP;

CREATE UNIQUE INDEX uq_companies_source_system_id ON companies(source_system_id) WHERE source_system_id IS NOT NULL;
