CREATE TABLE companies (
    id            UUID PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    industry      VARCHAR(100),
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_companies_name UNIQUE (name)
);

CREATE TABLE users (
    id               UUID PRIMARY KEY,
    company_id       UUID REFERENCES companies(id) ON DELETE CASCADE,
    email            VARCHAR(255) NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    full_name        VARCHAR(255) NOT NULL,
    role             VARCHAR(30) NOT NULL,
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at    TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'USER')),
    CONSTRAINT chk_users_role_company CHECK (
        (role = 'SUPER_ADMIN' AND company_id IS NULL) OR
        (role <> 'SUPER_ADMIN' AND company_id IS NOT NULL)
    )
);

CREATE INDEX idx_users_company_id ON users(company_id);

CREATE TABLE refresh_tokens (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(255) NOT NULL,
    expires_at    TIMESTAMP NOT NULL,
    revoked       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
