import type { MailerTransporterData } from "./Mailer";
import Mailer from "./Mailer";
import { createTransport } from "nodemailer";

class TitanMailer extends Mailer {
  constructor(transporterData: MailerTransporterData) {
    super(
      createTransport({
        ...transporterData,
        secure: true,
        port: 465,
        host: "smtp.titan.email",
      })
    );
  }
}

export default TitanMailer;
