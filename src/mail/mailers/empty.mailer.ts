import type { MailData } from "./Mailer";
import Mailer from "./Mailer";
import { createTransport } from "nodemailer";

class EmptyMailer extends Mailer {
  constructor() {
    super(createTransport({}));
  }

  public send = async (mail: MailData) => {
    console.log("Empty Mailer is sending email:");
    console.log(
      `From: ${mail.from}\n
      To: ${mail.to}\n
      Subject: ${mail.subject}\n
      Text: ${mail.text}\n
      HTML: ${mail.html}\n`
    );
  };
}

export default EmptyMailer;
