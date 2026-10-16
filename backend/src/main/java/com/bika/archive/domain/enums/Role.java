package com.bika.archive.domain.enums;

public enum Role {
    SUPER_ADMIN,
    COMPANY_ADMIN,
    USER,
    /**
     * Auto-provisioned for a user handed off from an external system (e.g. the bika DMS's
     * "File in Archive" button) -- scoped to exactly: read their own company's warehouses/
     * locations/document-types, and create documents. No user/warehouse/category management.
     */
    EXTERNAL_FILER
}
