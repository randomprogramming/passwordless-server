import type { MailerTransporterData } from "./mailers/Mailer";
import Mailer from "./mailers/Mailer";
import EmptyMailer from "./mailers/empty.mailer";
import MailtrapMailer from "./mailers/mailtrap.mailer";

enum MailerType {
  mailtrap = "mailtrap",
}

function isMailerType(str: string | undefined): str is MailerType {
  if (!str) return false;
  return Object.values(MailerType).includes(str as MailerType);
}

class MailClient {
  private mailFrom: string;
  private mailer: Mailer;
  private serverBaseUrl: string;

  constructor(
    mailerType: string | undefined,
    mailFrom: string,
    transporterData: MailerTransporterData,
    serverBaseUrl: string
  ) {
    this.mailFrom = mailFrom;
    this.serverBaseUrl = serverBaseUrl;

    if (isMailerType(mailerType)) {
      switch (mailerType) {
        case MailerType.mailtrap:
          this.mailer = new MailtrapMailer(transporterData);
          break;
      }
    } else {
      if (mailerType) {
        console.warn(`Mailer type '${mailerType}' was not recognized, using Empty Mailer.`);
      } else {
        console.warn("No mailer type supplied, using Empty Mailer.");
      }

      this.mailer = new EmptyMailer();
    }
  }

  public sendAuthenticatorAddedMail = async (to: string, accountId: string, token: string) => {
    await this.mailer.send({
      from: this.mailFrom,
      to,
      subject: "New Authenticator Device Added",
      text: `You have added a new authenticator device.
      Activate your new device by clicking the following link: ${this.serverBaseUrl}/api/authenticator/verify/${accountId}/${token} .
      \nThis link is only valid for one hour.`,
    });
  };
}

export default MailClient;
