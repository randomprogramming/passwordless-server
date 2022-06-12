import type { MailerTransporterData } from "./Mailer";
import Mailer from "./Mailer";
import { createTransport } from "nodemailer";

class MailtrapMailer extends Mailer {
  constructor(transporterData: MailerTransporterData) {
    super(createTransport(transporterData));
  }
}

export default MailtrapMailer;
