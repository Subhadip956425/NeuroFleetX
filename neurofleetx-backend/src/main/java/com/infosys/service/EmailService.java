package com.infosys.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.name}")
    private String appName;

    @Value("${app.support.email}")
    private String supportEmail;

    @Value("${app.noreply.email:no-reply@neurofleetx.com}")
    private String noReplyEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendWelcomeEmail(String to, String fullName) {
        try {
            String subject = "Welcome to " + appName + "! 🚀";
            String body = buildWelcomeEmail(fullName);
            sendHtmlEmail(to, subject, body);
            System.out.println("✅ Welcome email sent to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send welcome email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendPasswordResetEmail(String to, String fullName, String resetToken, String resetUrl) {
        try {
            String subject = "Password Reset Request - " + appName;
            String body = buildPasswordResetEmail(fullName, resetToken, resetUrl);
            sendHtmlEmail(to, subject, body);
            System.out.println("✅ Password reset email sent to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send password reset email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendPasswordChangedEmail(String to, String fullName) {
        try {
            String subject = "Password Changed Successfully - " + appName;
            String body = buildPasswordChangedEmail(fullName);
            sendHtmlEmail(to, subject, body);
            System.out.println("✅ Password changed email sent to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send password changed email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ✅ UPDATED: Custom sender display with reply-to
    private void sendHtmlEmail(String to, String subject, String htmlBody) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        // Set custom sender name (Gmail will still show your email, but with this name)
        helper.setFrom(fromEmail, appName + " Team");
        helper.setReplyTo(noReplyEmail); // Replies go to no-reply address
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);

        mailSender.send(message);
    }

    // Email templates remain the same...
    private String buildWelcomeEmail(String fullName) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }" +
                "        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <div class='header'>" +
                "            <h1>🚀 Welcome to " + appName + "!</h1>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <h2>Hello " + fullName + "! 👋</h2>" +
                "            <p>Thank you for registering with <strong>" + appName + "</strong>!</p>" +
                "            <p>Your account has been successfully created. You can now:</p>" +
                "            <ul>" +
                "                <li>📅 Book vehicle rides</li>" +
                "                <li>🚗 Track your trips in real-time</li>" +
                "                <li>💳 Make secure payments</li>" +
                "                <li>📊 View your booking history</li>" +
                "            </ul>" +
                "            <p>If you have any questions, feel free to contact our support team at <a href='mailto:" + supportEmail + "'>" + supportEmail + "</a>.</p>" +
                "            <p>Happy riding! 🎉</p>" +
                "        </div>" +
                "        <div class='footer'>" +
                "            <p>&copy; 2025 " + appName + ". All rights reserved.</p>" +
                "            <p>This is an automated email. Please do not reply to this message.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    private String buildPasswordResetEmail(String fullName, String resetToken, String resetUrl) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                "        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }" +
                "        .token-box { background: white; border: 2px dashed #f5576c; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }" +
                "        .token { font-size: 24px; font-weight: bold; color: #f5576c; letter-spacing: 2px; }" +
                "        .button { display: inline-block; padding: 15px 40px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }" +
                "        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }" +
                "        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <div class='header'>" +
                "            <h1>🔐 Password Reset Request</h1>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <h2>Hello " + fullName + ",</h2>" +
                "            <p>We received a request to reset your password for your <strong>" + appName + "</strong> account.</p>" +
                "            <div class='token-box'>" +
                "                <p>Your password reset code:</p>" +
                "                <div class='token'>" + resetToken + "</div>" +
                "                <p style='font-size: 12px; color: #666; margin-top: 10px;'>Valid for 1 hour</p>" +
                "            </div>" +
                "            <p style='text-align: center;'>" +
                "                <a href='" + resetUrl + "' class='button'>Reset Password</a>" +
                "            </p>" +
                "            <div class='warning'>" +
                "                <strong>⚠️ Security Notice:</strong>" +
                "                <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>" +
                "            </div>" +
                "            <p>This reset link will expire in <strong>1 hour</strong>.</p>" +
                "            <p>For security, never share this code with anyone.</p>" +
                "        </div>" +
                "        <div class='footer'>" +
                "            <p>&copy; 2025 " + appName + ". All rights reserved.</p>" +
                "            <p>This is an automated email. Please do not reply to this message.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    private String buildPasswordChangedEmail(String fullName) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }" +
                "        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }" +
                "        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }" +
                "        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <div class='header'>" +
                "            <h1>✅ Password Changed Successfully</h1>" +
                "        </div>" +
                "        <div class='content'>" +
                "            <h2>Hello " + fullName + ",</h2>" +
                "            <div class='success'>" +
                "                <p><strong>Your password has been changed successfully!</strong></p>" +
                "            </div>" +
                "            <p>This is a confirmation that your <strong>" + appName + "</strong> account password was recently changed.</p>" +
                "            <p>If you made this change, you can safely ignore this email.</p>" +
                "            <p>If you did NOT make this change, please contact our support team immediately at <a href='mailto:" + supportEmail + "'>" + supportEmail + "</a>.</p>" +
                "        </div>" +
                "        <div class='footer'>" +
                "            <p>&copy; 2025 " + appName + ". All rights reserved.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }
}
