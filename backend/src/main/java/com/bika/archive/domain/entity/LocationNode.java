package com.bika.archive.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "location_nodes")
public class LocationNode extends BaseEntity {

    /** Mirrors the owning warehouse's company -- null for a node inside a shared warehouse. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private LocationNode parent;

    /** Free-text label chosen by whoever built the tree (e.g. "Building", "Wing", "Cabinet") -- not a fixed enum. */
    @Column(name = "node_type", nullable = false, length = 50)
    private String nodeType;

    @Column(nullable = false)
    private String name;

    private String description;

    private Integer capacity;

    /** True if a document can be assigned directly to this node -- the tree's actual leaves. */
    @Column(name = "is_storage_unit", nullable = false)
    private boolean storageUnit;
}
