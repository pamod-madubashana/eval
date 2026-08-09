export interface IEmailService {
  sendNotification(data: NotificationData): Promise<boolean>;
  notifyVendorStatusChange(
    vendorEmail: string,
    vendorName: string,
    openingTitle: string,
    status: "shortlisted" | "rejected"
  ): Promise<void>;
  notifyHiringManagerNewProfile(
    managerEmail: string,
    managerName: string,
    openingTitle: string,
    vendorName?: string
  ): Promise<void>;
}

export interface NotificationData {
  recipientEmail: string;
  recipientName: string;
  openingTitle: string;
  action: "shortlisted" | "rejected" | "new_profile";
  additionalInfo?: string;
}
