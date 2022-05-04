import "dotenv/config";
import express from "express";
import type { Application } from "express";
import PingRoutes from "./routes/Ping";
import EnvParser from "./utils/EnvParser";

class Server {
  private readonly API_BASE_URL = "/api";

  private expressApp: Application;
  private port: number;

  constructor() {
    this.expressApp = express();
    this.port = EnvParser.getNumber("PORT", 3003);

    this.setUpMiddleware();
    this.setUpRoutes();
    this.setUpErrorHandling();
  }

  private setUpMiddleware() {
    this.expressApp.use(express.json());
    this.expressApp.use(express.urlencoded({ extended: true }));
  }

  private setUpRoutes() {
    this.expressApp.use(this.API_BASE_URL, new PingRoutes().getRouter());
  }

  private setUpErrorHandling() {
    this.expressApp.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        // TODO: Implement proper error handler
        console.error("Error happened.");
        console.log(err);
        return res.status(500).json({ message: "Error" }); //TODO: Use constants for res status
      }
    );
  }

  public run() {
    this.expressApp.listen(this.port, "0.0.0.0");
  }
}

export default Server;
