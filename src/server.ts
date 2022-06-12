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

class Server {
  private readonly API_BASE_URL = "/api";
  private readonly ATTESTATION_BASE_URL = this.API_BASE_URL + "/attestation";
  private readonly ASSERTION_BASE_URL = this.API_BASE_URL + "/assertion";

  // Initialized by this class
  private expressApp: Application;

  // Read from ENV
  private port: number;
  private authPrivateKey: string;
  private mailerType: string | undefined;
  private mailFrom: string;
  private mailPort: number;
  private mailHost: string;
  private mailUser: string;
  private mailPass: string;

  // Dependecies for injection
  private dao: Dao;
  private fidoFactory: FidoFactory;
  private mailClient: MailClient;

  constructor() {
    this.expressApp = express();

    this.port = EnvParser.getNumber("PORT", 3003);
    this.authPrivateKey = EnvParser.getString("AUTH_PRIVATE_KEY", true);
    this.mailerType = EnvParser.getString("MAILER_TYPE", false);
    this.mailFrom = EnvParser.getString("MAILER_FROM", true);
    this.mailPort = EnvParser.getNumber("MAILER_PORT", 587);
    this.mailHost = EnvParser.getString("MAILER_HOST", true);
    this.mailUser = EnvParser.getString("MAILER_AUTH_USER", true);
    this.mailPass = EnvParser.getString("MAILER_AUTH_PASSWORD", true);

    this.dao = new Dao();
    this.fidoFactory = new FidoFactory(this.dao);
    this.mailClient = new MailClient(this.mailerType, this.mailFrom, {
      port: this.mailPort,
      host: this.mailHost,
      auth: {
        user: this.mailUser,
        pass: this.mailPass,
      },
    });

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
    this.expressApp.use(
      this.ATTESTATION_BASE_URL,
      new AttestationRoutes(this.dao, this.fidoFactory).getRouter()
    );
    this.expressApp.use(
      this.ASSERTION_BASE_URL,
      new AssertionRoutes(
        this.dao,
        this.fidoFactory,
        this.authPrivateKey
      ).getRouter()
    );
  }

  private setUpErrorHandling() {
    this.expressApp.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
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
