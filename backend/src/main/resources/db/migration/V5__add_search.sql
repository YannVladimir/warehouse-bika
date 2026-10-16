ALTER TABLE documents
    ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(custodian, '')), 'B')
    ) STORED;

CREATE INDEX idx_documents_search_vector ON documents USING GIN (search_vector);

CREATE TABLE search_history (
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id     UUID REFERENCES companies(id) ON DELETE CASCADE,
    query          VARCHAR(500) NOT NULL,
    result_count   INTEGER NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at);

CREATE TABLE recently_accessed (
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id    UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    accessed_at    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_recently_accessed_user_document UNIQUE (user_id, document_id)
);

CREATE INDEX idx_recently_accessed_user_id ON recently_accessed(user_id);
