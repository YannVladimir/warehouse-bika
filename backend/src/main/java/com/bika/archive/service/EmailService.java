package com.bika.archive.service;

import com.bika.archive.config.FrontendProperties;
import com.bika.archive.config.MailProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Mail failures never propagate to the caller -- forgot-password always returns the same response
 * regardless of whether the address exists or the send succeeds (both to avoid leaking which
 * emails are registered, and so a transient SMTP hiccup doesn't turn into a 500 for the user).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;
    private final FrontendProperties frontendProperties;

    public void sendPasswordResetEmail(String toEmail, String fullName, String rawToken) {
        String resetLink = frontendProperties.getUrl() + "/reset-password?token=" + rawToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailProperties.getFrom());
        message.setTo(toEmail);
        message.setSubject("Reset your Bika Archive password");
        message.setText("""
                Hi %s,

                We received a request to reset your Bika Archive password. Click the link below to choose a new one:

                %s

                This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.

                -- Bika Archive
                """.formatted(fullName, resetLink));

        try {
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}", toEmail, ex);
        }
    }
}
