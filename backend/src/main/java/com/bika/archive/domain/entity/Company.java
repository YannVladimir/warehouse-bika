package com.bika.archive.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "companies")
public class Company extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String email;

    private String phone;

    private String industry;

    @Column(nullable = false)
    private boolean active = true;

    /**
     * Non-null only for companies mirrored from the external bika DMS -- its own Company.id
     * (a Long there, not a UUID), used to match on re-sync. Null means natively created here.
     */
    @Column(name = "source_system_id")
    private Long sourceSystemId;

    /**
     * The source system's own updatedAt for this company (its plain, offset-less LocalDateTime,
     * stored as-is) -- used as the next sync poll's updatedSince, not our own local sync clock.
     */
    @Column(name = "source_system_synced_at")
    private LocalDateTime sourceSystemSyncedAt;
}
