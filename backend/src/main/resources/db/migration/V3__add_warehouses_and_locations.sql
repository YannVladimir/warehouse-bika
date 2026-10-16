CREATE TABLE warehouses (
    id             UUID PRIMARY KEY,
    company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    address        VARCHAR(255),
    city           VARCHAR(100),
    manager_name   VARCHAR(255),
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_warehouses_company_name UNIQUE (company_id, name)
);

CREATE INDEX idx_warehouses_company_id ON warehouses(company_id);

CREATE TABLE location_nodes (
    id             UUID PRIMARY KEY,
    company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id   UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    parent_id      UUID REFERENCES location_nodes(id) ON DELETE CASCADE,
    node_type      VARCHAR(20) NOT NULL,
    name           VARCHAR(255) NOT NULL,
    description    VARCHAR(500),
    capacity       INTEGER,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_location_nodes_type CHECK (node_type IN ('BUILDING','FLOOR','ROOM','RACK','SHELF','BOX')),
    CONSTRAINT chk_location_nodes_building_root CHECK (
        (node_type = 'BUILDING' AND parent_id IS NULL) OR
        (node_type <> 'BUILDING' AND parent_id IS NOT NULL)
    )
);

CREATE INDEX idx_location_nodes_company_id ON location_nodes(company_id);
CREATE INDEX idx_location_nodes_warehouse_id ON location_nodes(warehouse_id);
CREATE INDEX idx_location_nodes_parent_id ON location_nodes(parent_id);
