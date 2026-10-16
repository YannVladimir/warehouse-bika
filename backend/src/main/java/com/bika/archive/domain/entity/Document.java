package com.bika.archive.domain.entity;

import com.bika.archive.domain.enums.DocumentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "documents")
public class Document extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "document_number", nullable = false)
    private String documentNumber;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    private DocumentType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "box_location_id")
    private LocationNode boxLocation;

    private String custodian;

    private Integer pages;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentStatus status = DocumentStatus.AVAILABLE;

    @Column(name = "archived_date")
    private LocalDate archivedDate;

    @Column(length = 2000)
    private String notes;

    /**
     * Set only when this document was filed via an external system's handoff (e.g. "BIKA_FILING_SYSTEM")
     * -- null means it was created natively inside Bika Archive. Stamped server-side from the
     * authenticated principal's role, never client-settable.
     */
    @Column(name = "source_system")
    private String sourceSystem;

    @Column(name = "external_reference")
    private String externalReference;

    @Column(name = "external_filer_name")
    private String externalFilerName;

    @Column(name = "external_filer_email")
    private String externalFilerEmail;
}
