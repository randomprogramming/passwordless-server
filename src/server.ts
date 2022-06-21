import "dotenv/config";
import type { Application } from "express";
import express from "express";
import EnvParser from "./utils/EnvParser";
import AttestationRoutes from "./routes/Attestation";
import AssertionRoutes from "./routes/Assertion";
import Dao from "./dao";
import { ApiKeyError, NullData, ValidationException } from "./exceptions";
import ServerResponse from "./constants/ServerResponse";
import cors from "cors";
import FidoFactory from "./FidoFactory";
import morgan from "morgan";
import MailClient from "./mail/mail.client";
import AuthenticatorRoutes from "./routes/Authenticator";
import B64Helper from "./utils/B64Helper";

class Server {
  private readonly API_BASE_URL = "/api";
  private readonly ATTESTATION_BASE_URL = this.API_BASE_URL + "/attestation";
  private readonly ASSERTION_BASE_URL = this.API_BASE_URL + "/assertion";
  private readonly AUTHENTICATOR_BASE_URL = this.API_BASE_URL + "/authenticator";

  // Initialized by this class
  private expressApp: Application;

  // Read from ENV
  private port: number;
  private authPrivateKey: string;
  private mailerType: string | undefined;
  private mailFrom: string;
  private mailUser: string;
  private mailPass: string;
  private serverBaseUrl: string;

  // Dependecies for injection
  private dao: Dao;
  private fidoFactory: FidoFactory;
  private mailClient: MailClient;

  constructor() {
    this.expressApp = express();

    this.port = EnvParser.getNumber("PORT", 3003);
    this.authPrivateKey = B64Helper.db64(EnvParser.getString("AUTH_PRIVATE_KEY", true));
    this.mailerType = EnvParser.getString("MAILER_TYPE", false);
    this.mailFrom = EnvParser.getString("MAILER_FROM", true);
    this.mailUser = EnvParser.getString("MAILER_AUTH_USER", true);
    this.mailPass = EnvParser.getString("MAILER_AUTH_PASSWORD", true);
    this.serverBaseUrl = EnvParser.getString("SERVER_BASE_URL", true);

    console.log(`Read from env:\nport:${this.port}\nauthPrivateKey:${this.authPrivateKey}\n`);

    this.dao = new Dao();
    this.fidoFactory = new FidoFactory(this.dao);
    this.mailClient = new MailClient(
      this.mailerType,
      this.mailFrom,
      {
        auth: {
          user: this.mailUser,
          pass: this.mailPass,
        },
      },
      this.serverBaseUrl
    );

    this.setUpMiddleware();
    this.setUpRoutes();
    this.setUpErrorHandling();
  }

  private setUpMiddleware() {
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: true }));
    // TODO: Add a env variable to select which cors domains to allow
    this.expressApp.use(cors());
    this.expressApp.use(morgan("combined"));
  }

  private setUpRoutes() {
    this.expressApp.get("/", (req, res) => {
      return res.send("Health check");
    });
    this.expressApp.use(
      this.ATTESTATION_BASE_URL,
      new AttestationRoutes(this.dao, this.fidoFactory, this.mailClient).getRouter()
    );
    this.expressApp.use(
      this.ASSERTION_BASE_URL,
      new AssertionRoutes(this.dao, this.fidoFactory, this.authPrivateKey).getRouter()
    );
    this.expressApp.use(this.AUTHENTICATOR_BASE_URL, new AuthenticatorRoutes(this.dao).getRouter());
  }

  private setUpErrorHandling() {
    this.expressApp.use(
      (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.log(err);
        if (err instanceof ValidationException) {
          return res
            .status(ServerResponse.BadRequest)
            .json({ message: "Error when validating input data" });
        }
        if (err instanceof NullData) {
          return res
            .status(ServerResponse.BadRequest)
            .json({ message: "Some required data was missing" });
        }
        if (err instanceof ApiKeyError) {
          return res.status(ServerResponse.Unauthorized).json({
            message: err.message,
          });
        }

        return res
          .status(ServerResponse.InternalServerError)
          .json({ message: "Unexpected error happened, please try again" });
      }
    );
  }

  public run() {
    const server = this.expressApp.listen(this.port, "0.0.0.0");
    server.on("listening", () => {
      console.log(`\tServer listening on port ${this.port}`);
    });
    process.on("SIGINT", async () => {
      await this.dao.close();
      server.close();
    });
  }
}

export default Server;
