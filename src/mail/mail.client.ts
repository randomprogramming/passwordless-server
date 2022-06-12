import type { MailerTransporterData } from "./mailers/Mailer";
import type { TemplateDelegate } from "handlebars";
import { compile } from "handlebars";
import Mailer from "./mailers/Mailer";
import EmptyMailer from "./mailers/empty.mailer";
import MailtrapMailer from "./mailers/mailtrap.mailer";
import fs from "fs";
import path from "path";

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
  // Templates which are loaded on initial server start into memory
  private authenticatorAddedMailTemplate: TemplateDelegate;

  constructor(
    mailerType: string | undefined,
    mailFrom: string,
    transporterData: MailerTransporterData,
    serverBaseUrl: string
  ) {
    this.mailFrom = mailFrom;
    this.serverBaseUrl = serverBaseUrl;
    this.authenticatorAddedMailTemplate = MailClient.loadMailTemplate("authenticatorAddedMail.hbs");

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

  private static loadMailTemplate = (mailFileName: string) => {
    const templatePath = path.join(__dirname, "views", mailFileName);
    return compile(fs.readFileSync(templatePath).toString());
  };

  public sendAuthenticatorAddedMail = async (to: string, accountId: string, token: string) => {
    // TODO: Sending an email takes a lot of time, so maybe not awaiting it would be okay?
    const url = `${this.serverBaseUrl}/api/authenticator/verify/${accountId}/${token}`;
    await this.mailer.send({
      from: this.mailFrom,
      to,
      subject: "New Authenticator Device Added",
      html: this.authenticatorAddedMailTemplate({
        url,
      }),
    });
  };
}

export default MailClient;
