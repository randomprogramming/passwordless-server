import { Router } from "express";

class Route {
  protected router: Router;

  constructor() {
    this.router = Router();
  }

  public getRouter() {
    return this.router;
  }
}

export default Route;
