import nodemailer from "nodemailer";
import { IEmailService, NotificationData } from "../../ports/services/IEmailService.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const templates = {
  shortlisted: (data: NotificationData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Congratulations!</h1></div>
        <div class="content">
          <p>Hi ${data.recipientName},</p>
          <p>Great news! Your profile has been <strong>shortlisted</strong> for the position:</p>
          <h2 style="color: #059669;">${data.openingTitle}</h2>
          <p>Our hiring team has reviewed your application and believes you could be a great fit for this role.</p>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/vendor/openings" class="button">View Opening</a>
        </div>
        <div class="footer"><p>This is an automated notification from Zelosify Recruitment Platform.</p></div>
      </div>
    </body></html>`,
  rejected: (data: NotificationData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6b7280, #4b5563); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Application Update</h1></div>
        <div class="content">
          <p>Hi ${data.recipientName},</p>
          <p>Thank you for your interest in the position:</p>
          <h2>${data.openingTitle}</h2>
          <p>After careful review, we have decided to move forward with other candidates whose experience more closely matches our current requirements.</p>
          <p>We encourage you to apply for future openings that match your skills and experience.</p>
        </div>
        <div class="footer"><p>This is an automated notification from Zelosify Recruitment Platform.</p></div>
      </div>
    </body></html>`,
  new_profile: (data: NotificationData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>New Profile Submitted</h1></div>
        <div class="content">
          <p>Hi ${data.recipientName},</p>
          <p>A new candidate profile has been submitted for the opening:</p>
          <h2 style="color: #2563eb;">${data.openingTitle}</h2>
          ${data.additionalInfo ? `<p>${data.additionalInfo}</p>` : ""}
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/hiring-manager/openings" class="button">View Profiles</a>
        </div>
        <div class="footer"><p>This is an automated notification from Zelosify Recruitment Platform.</p></div>
      </div>
    </body></html>`,
};

export class NodemailerEmailService implements IEmailService {
  async sendNotification(data: NotificationData): Promise<boolean> {
    let subject: string;
    let html: string;

    switch (data.action) {
      case "shortlisted":
        subject = `Your profile has been shortlisted for ${data.openingTitle}`;
        html = templates.shortlisted(data);
        break;
      case "rejected":
        subject = `Application update for ${data.openingTitle}`;
        html = templates.rejected(data);
        break;
      case "new_profile":
        subject = `New profile submitted for ${data.openingTitle}`;
        html = templates.new_profile(data);
        break;
      default:
        return false;
    }

    if (!process.env.SMTP_USER) {
      console.log(`[Email] SMTP not configured, would send to: ${data.recipientEmail}`);
      return true;
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.recipientEmail,
        subject,
        html,
      });
      return true;
    } catch (error) {
      console.error("[Email] Failed to send:", error);
      return false;
    }
  }

  async notifyVendorStatusChange(
    vendorEmail: string,
    vendorName: string,
    openingTitle: string,
    status: "shortlisted" | "rejected"
  ): Promise<void> {
    await this.sendNotification({
      recipientEmail: vendorEmail,
      recipientName: vendorName,
      openingTitle,
      action: status,
    });
  }

  async notifyHiringManagerNewProfile(
    managerEmail: string,
    managerName: string,
    openingTitle: string,
    vendorName?: string
  ): Promise<void> {
    await this.sendNotification({
      recipientEmail: managerEmail,
      recipientName: managerName,
      openingTitle,
      action: "new_profile",
      additionalInfo: vendorName ? `Submitted by: ${vendorName}` : undefined,
    });
  }
}
