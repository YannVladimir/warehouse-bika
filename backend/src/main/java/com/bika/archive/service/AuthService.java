package com.bika.archive.service;

import com.bika.archive.config.CookieProperties;
import com.bika.archive.config.JwtProperties;
import com.bika.archive.domain.entity.Company;
import com.bika.archive.domain.entity.PasswordResetToken;
import com.bika.archive.domain.entity.RefreshToken;
import com.bika.archive.domain.entity.User;
import com.bika.archive.dto.request.ChangePasswordRequest;
import com.bika.archive.dto.request.ForgotPasswordRequest;
import com.bika.archive.dto.request.LoginRequest;
import com.bika.archive.dto.request.ResetPasswordRequest;
import com.bika.archive.dto.request.UpdateProfileRequest;
import com.bika.archive.dto.response.AuthResponse;
import com.bika.archive.dto.response.HandoffResponse;
import com.bika.archive.dto.response.UserResponse;
import com.bika.archive.exception.DuplicateResourceException;
import com.bika.archive.exception.InvalidCredentialsException;
import com.bika.archive.exception.ResourceNotFoundException;
import com.bika.archive.mapper.UserMapper;
import com.bika.archive.repository.CompanyRepository;
import com.bika.archive.repository.PasswordResetTokenRepository;
import com.bika.archive.repository.RefreshTokenRepository;
import com.bika.archive.repository.UserRepository;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.security.ClientIpResolver;
import com.bika.archive.security.RateLimitService;
import com.bika.archive.security.jwt.ArchiveHandoffTokenService;
import com.bika.archive.security.jwt.HandoffClaims;
import com.bika.archive.security.jwt.JwtService;
import com.bika.archive.security.jwt.TokenHasher;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final int MAX_LOGIN_ATTEMPTS_PER_EMAIL = 5;
    private static final int MAX_LOGIN_ATTEMPTS_PER_IP = 20;
    private static final Duration LOGIN_RATE_LIMIT_WINDOW = Duration.ofMinutes(15);

    private static final int MAX_FORGOT_PASSWORD_ATTEMPTS_PER_IP = 5;
    private static final Duration FORGOT_PASSWORD_RATE_LIMIT_WINDOW = Duration.ofHours(1);

    private static final Duration PASSWORD_RESET_TOKEN_VALIDITY = Duration.ofMinutes(30);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final CookieProperties cookieProperties;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final EmailService emailService;
    private final RateLimitService rateLimitService;
    private final ClientIpResolver clientIpResolver;
    private final CompanyRepository companyRepository;
    private final ArchiveHandoffTokenService archiveHandoffTokenService;
    private final HandoffUserProvisioningService handoffUserProvisioningService;

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        String ip = clientIpResolver.resolveIp();
        rateLimitService.checkAndRecord("login:ip:" + ip, MAX_LOGIN_ATTEMPTS_PER_IP, LOGIN_RATE_LIMIT_WINDOW);
        rateLimitService.checkAndRecord("login:email:" + request.email().toLowerCase(), MAX_LOGIN_ATTEMPTS_PER_EMAIL, LOGIN_RATE_LIMIT_WINDOW);

        User user = userRepository.findByEmailIgnoreCase(request.email()).orElse(null);

        if (user == null) {
            auditService.record(null, null, "AUTH", request.email(), "LOGIN_FAILURE", null, "unknown email");
            throw new InvalidCredentialsException("Invalid email or password");
        }

        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;

        if (!user.isActive()) {
            auditService.record(user.getId(), companyId, "AUTH", user.getId().toString(), "LOGIN_FAILURE", null, "account deactivated");
            throw new InvalidCredentialsException("This account has been deactivated");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditService.record(user.getId(), companyId, "AUTH", user.getId().toString(), "LOGIN_FAILURE", null, "bad password");
            throw new InvalidCredentialsException("Invalid email or password");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        auditService.record(user.getId(), companyId, "AUTH", user.getId().toString(), "LOGIN_SUCCESS", null, null);

        return issueTokens(user, response);
    }

    /**
     * Refresh tokens rotate: every use revokes the presented token and issues a brand new one.
     * If a token is presented that's already revoked, that's a rotated-out (or logged-out) token
     * coming back -- the working theory is theft/replay, so every session for that user is killed
     * rather than just rejecting this one request.
     */
    /**
     * noRollbackFor is required here: the reuse-detection branch below calls revokeAllForUser
     * and then throws InvalidCredentialsException on purpose (to reject this request), but Spring's
     * default rollback-on-unchecked-exception would otherwise undo that revocation before it's
     * ever persisted, silently defeating the theft-response.
     */
    @Transactional(noRollbackFor = InvalidCredentialsException.class)
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawToken = extractRefreshCookie(request)
                .orElseThrow(() -> new InvalidCredentialsException("Refresh token missing"));

        String hash = TokenHasher.sha256(rawToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid refresh token"));

        if (stored.isRevoked()) {
            User compromisedUser = stored.getUser();
            refreshTokenRepository.revokeAllForUser(compromisedUser.getId());
            UUID companyId = compromisedUser.getCompany() != null ? compromisedUser.getCompany().getId() : null;
            auditService.record(
                    compromisedUser.getId(), companyId, "AUTH", compromisedUser.getId().toString(),
                    "REFRESH_TOKEN_REUSE_DETECTED", null, null
            );
            throw new InvalidCredentialsException("Refresh token expired or revoked");
        }
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidCredentialsException("Refresh token expired or revoked");
        }

        User user = stored.getUser();
        if (!user.isActive()) {
            throw new InvalidCredentialsException("This account has been deactivated");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(user, response);
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        extractRefreshCookie(request).ifPresent(rawToken -> {
            String hash = TokenHasher.sha256(rawToken);
            refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        });
        clearRefreshCookie(response);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(AuthenticatedPrincipal principal) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.userId()));
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(AuthenticatedPrincipal principal, UpdateProfileRequest request) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.userId()));

        if (!user.getEmail().equalsIgnoreCase(request.email()) && userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new DuplicateResourceException("A user with email '" + request.email() + "' already exists");
        }

        String oldEmail = user.getEmail();
        user.setFullName(request.fullName());
        user.setEmail(request.email());

        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        auditService.record(user.getId(), companyId, "USER", user.getId().toString(), "UPDATE_PROFILE", oldEmail, request.email());

        return userMapper.toResponse(user);
    }

    @Transactional
    public void changePassword(AuthenticatedPrincipal principal, ChangePasswordRequest request) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + principal.userId()));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));

        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        auditService.record(user.getId(), companyId, "USER", user.getId().toString(), "CHANGE_PASSWORD", null, null);
    }

    /**
     * Always behaves the same regardless of whether the email is registered -- the caller can't
     * distinguish "no such account" from "email sent" (or from "email send failed", since
     * EmailService swallows send errors). That's deliberate: it's what stops this endpoint from
     * being usable to enumerate registered addresses.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String ip = clientIpResolver.resolveIp();
        rateLimitService.checkAndRecord("forgot-password:ip:" + ip, MAX_FORGOT_PASSWORD_ATTEMPTS_PER_IP, FORGOT_PASSWORD_RATE_LIMIT_WINDOW);

        User user = userRepository.findByEmailIgnoreCase(request.email()).orElse(null);
        if (user == null || !user.isActive()) {
            return;
        }

        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(TokenHasher.sha256(rawToken));
        resetToken.setExpiresAt(Instant.now().plus(PASSWORD_RESET_TOKEN_VALIDITY));
        passwordResetTokenRepository.save(resetToken);

        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        auditService.record(user.getId(), companyId, "AUTH", user.getId().toString(), "PASSWORD_RESET_REQUESTED", null, null);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), rawToken);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String hash = TokenHasher.sha256(request.token());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid or expired reset link"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidCredentialsException("Invalid or expired reset link");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        resetToken.setUsed(true);

        // A password reset means every existing session should end, not just future ones.
        refreshTokenRepository.revokeAllForUser(user.getId());

        UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        auditService.record(user.getId(), companyId, "AUTH", user.getId().toString(), "PASSWORD_RESET_COMPLETED", null, null);
    }

    /**
     * Consumes a short-lived signed token minted by the bika DMS when a user there clicks
     * "File in Archive". Verifies the signature/expiry, resolves the already-synced company by
     * its source-system id, and finds-or-provisions a matching local user -- this is a trusted
     * federation handoff (the token is cryptographically signed by a system we've shared a
     * secret with), the same trust model as JIT provisioning in real SSO/OIDC setups.
     */
    @Transactional
    public HandoffResponse exchangeHandoff(String rawToken, HttpServletResponse response) {
        HandoffClaims claims = archiveHandoffTokenService.verify(rawToken);

        Company company = companyRepository.findBySourceSystemId(claims.sourceCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "This company hasn't synced from the source system yet -- try again shortly"));

        User user = userRepository.findByEmailIgnoreCase(claims.email()).orElse(null);
        if (user == null) {
            user = handoffUserProvisioningService.createHandoffUser(
                    company, claims.email(), deriveFullNameFromEmail(claims.email()));
        } else if (user.getCompany() == null || !user.getCompany().getId().equals(company.getId())) {
            throw new InvalidCredentialsException("This account doesn't belong to the handed-off company");
        } else if (!user.isActive()) {
            throw new InvalidCredentialsException("This account has been deactivated");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        auditService.record(user.getId(), company.getId(), "AUTH", user.getId().toString(), "ARCHIVE_HANDOFF_LOGIN", null, null);

        AuthResponse auth = issueTokens(user, response);
        return HandoffResponse.from(auth, claims);
    }

    private String deriveFullNameFromEmail(String email) {
        String localPart = email.substring(0, email.indexOf('@'));
        String[] words = localPart.split("[._-]+");
        StringBuilder name = new StringBuilder();
        for (String word : words) {
            if (word.isBlank()) continue;
            if (!name.isEmpty()) name.append(' ');
            name.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
        }
        return name.isEmpty() ? email : name.toString();
    }

    private AuthResponse issueTokens(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user);

        byte[] randomBytes = new byte[32];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawRefreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(TokenHasher.sha256(rawRefreshToken));
        refreshToken.setExpiresAt(Instant.now().plus(jwtProperties.getRefreshTokenExpirationDays(), ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshToken);

        setRefreshCookie(response, rawRefreshToken);

        return new AuthResponse(accessToken, "Bearer", jwtService.getAccessTokenExpirySeconds(), userMapper.toResponse(user));
    }

    private void setRefreshCookie(HttpServletResponse response, String rawToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .path("/api/auth")
                .maxAge(Duration.ofDays(jwtProperties.getRefreshTokenExpirationDays()))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private Optional<String> extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}
