-- The location hierarchy is no longer a fixed 6-level enum (Building/Floor/Room/Rack/Shelf/Box).
-- Each company can define its own levels, in whatever order and depth it wants, with whatever
-- names it wants -- node_type becomes a free-text label instead of a constrained enum value, and
-- a node is only assignable to documents if it's explicitly marked is_storage_unit, regardless of
-- what it's called or how deep it sits.

ALTER TABLE location_nodes DROP CONSTRAINT chk_location_nodes_type;
ALTER TABLE location_nodes DROP CONSTRAINT chk_location_nodes_building_root;
ALTER TABLE location_nodes ALTER COLUMN node_type TYPE VARCHAR(50);

ALTER TABLE location_nodes ADD COLUMN is_storage_unit BOOLEAN NOT NULL DEFAULT FALSE;

-- Preserve existing behavior for data created under the old fixed hierarchy: every BOX was
-- implicitly the storage unit.
UPDATE location_nodes SET is_storage_unit = TRUE WHERE node_type = 'BOX';
