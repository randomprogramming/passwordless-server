import type { Transporter } from "nodemailer";
import { FailedToSendMail } from "../../exceptions";

export interface MailerTransporterData {
  auth: {
    user: string;
    pass: string;
  };
}

export interface MailData {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
}

class Mailer {
  protected transporter: Transporter;

  constructor(transporter: Transporter) {
    this.transporter = transporter;
  }

  public send = async (mail: MailData) => {
    const info = await this.transporter.sendMail(mail);
    if (!info.messageId) throw new FailedToSendMail("Message ID is undefined.");
  };
}

export default Mailer;
