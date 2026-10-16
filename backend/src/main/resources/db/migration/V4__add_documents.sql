CREATE TABLE document_types (
    id            UUID PRIMARY KEY,
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    description   VARCHAR(500),
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_types_company_name UNIQUE (company_id, name)
);

CREATE INDEX idx_document_types_company_id ON document_types(company_id);

CREATE TABLE documents (
    id                UUID PRIMARY KEY,
    company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_number   VARCHAR(50) NOT NULL,
    title             VARCHAR(255) NOT NULL,
    type_id           UUID REFERENCES document_types(id) ON DELETE SET NULL,
    box_location_id   UUID REFERENCES location_nodes(id) ON DELETE SET NULL,
    custodian         VARCHAR(255),
    pages             INTEGER,
    status            VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    archived_date     DATE,
    notes             VARCHAR(2000),
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_documents_company_number UNIQUE (company_id, document_number),
    CONSTRAINT chk_documents_status CHECK (status IN ('AVAILABLE','CHECKED_OUT','MISSING'))
);

CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_documents_type_id ON documents(type_id);
CREATE INDEX idx_documents_box_location_id ON documents(box_location_id);
CREATE INDEX idx_documents_document_number ON documents(document_number);
