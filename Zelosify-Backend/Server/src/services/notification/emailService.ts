import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface NotificationData {
  recipientEmail: string;
  recipientName: string;
  openingTitle: string;
  action: "shortlisted" | "rejected" | "new_profile";
  additionalInfo?: string;
}

// Create transporter (configure for your SMTP provider)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
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
        <div class="header">
          <h1>🎉 Congratulations!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipientName},</p>
          <p>Great news! Your profile has been <strong>shortlisted</strong> for the position:</p>
          <h2 style="color: #059669;">${data.openingTitle}</h2>
          <p>Our hiring team has reviewed your application and believes you could be a great fit for this role.</p>
          <p>A hiring manager will be in touch with you soon regarding the next steps.</p>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/vendor/openings" class="button">View Opening</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from Zelosify Recruitment Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `,

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
        <div class="header">
          <h1>Application Update</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipientName},</p>
          <p>Thank you for your interest in the position:</p>
          <h2>${data.openingTitle}</h2>
          <p>After careful review, we have decided to move forward with other candidates whose experience more closely matches our current requirements.</p>
          <p>We encourage you to apply for future openings that match your skills and experience.</p>
          <p>Best of luck in your job search!</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from Zelosify Recruitment Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `,

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
        <div class="header">
          <h1>📋 New Profile Submitted</h1>
        </div>
        <div class="content">
          <p>Hi ${data.recipientName},</p>
          <p>A new candidate profile has been submitted for the opening:</p>
          <h2 style="color: #2563eb;">${data.openingTitle}</h2>
          ${data.additionalInfo ? `<p>${data.additionalInfo}</p>` : ""}
          <p>Please review the profile at your earliest convenience.</p>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/hiring-manager/openings" class="button">View Profiles</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from Zelosify Recruitment Platform.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

/**
 * Send an email
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // If no SMTP configured, just log and return
    if (!process.env.SMTP_USER) {
      console.log("[Email] SMTP not configured, skipping email send");
      console.log(`[Email] Would send to: ${options.to}`);
      console.log(`[Email] Subject: ${options.subject}`);
      return true;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

/**
 * Send notification based on action
 */
export async function sendNotification(
  data: NotificationData
): Promise<boolean> {
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
      console.error("[Email] Unknown action:", data.action);
      return false;
  }

  return sendEmail({
    to: data.recipientEmail,
    subject,
    html,
  });
}

/**
 * Notify vendor when profile status changes
 */
export async function notifyVendorStatusChange(
  vendorEmail: string,
  vendorName: string,
  openingTitle: string,
  status: "shortlisted" | "rejected"
): Promise<void> {
  await sendNotification({
    recipientEmail: vendorEmail,
    recipientName: vendorName,
    openingTitle,
    action: status,
  });
}

/**
 * Notify hiring manager when new profile is submitted
 */
export async function notifyHiringManagerNewProfile(
  managerEmail: string,
  managerName: string,
  openingTitle: string,
  vendorName?: string
): Promise<void> {
  await sendNotification({
    recipientEmail: managerEmail,
    recipientName: managerName,
    openingTitle,
    action: "new_profile",
    additionalInfo: vendorName ? `Submitted by: ${vendorName}` : undefined,
  });
}
