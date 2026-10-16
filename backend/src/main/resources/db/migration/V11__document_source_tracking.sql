ALTER TABLE documents
    ADD COLUMN source_system VARCHAR(50),
    ADD COLUMN external_reference VARCHAR(255),
    ADD COLUMN external_filer_name VARCHAR(255),
    ADD COLUMN external_filer_email VARCHAR(255);
