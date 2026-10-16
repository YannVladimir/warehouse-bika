package com.bika.archive.repository;

import com.bika.archive.domain.entity.RefreshToken;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Used both after a password reset (invalidate every existing session) and when refresh
     * token reuse is detected (a rotated-out token being presented again is a signal of theft --
     * the safe response is to kill every session for that user, not just the one token).
     */
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId AND r.revoked = false")
    void revokeAllForUser(@Param("userId") UUID userId);
}
