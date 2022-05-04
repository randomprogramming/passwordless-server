import Route from "./Route";
import type { Request, Response, NextFunction } from "express";

class PingRoutes extends Route {
  constructor() {
    super();

    this.router.get("/ping", this.ping);
  }

  private async ping(req: Request, res: Response, next: NextFunction) {
    try {
      return res.send("Server returns ping");
    } catch (error) {
      next(error);
    }
  }
}

export default PingRoutes;
