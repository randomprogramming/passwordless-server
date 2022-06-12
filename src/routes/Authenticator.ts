import type { Request, Response, NextFunction } from "express";
import ServerResponse from "../constants/ServerResponse";
import Dao from "../dao";
import { NullData } from "../exceptions";
import { validateVerifyAuthenticatorParams } from "../validators";
import Route from "./Route";

class AuthenticatorRoutes extends Route {
  private dao: Dao;

  constructor(dao: Dao) {
    super();

    this.dao = dao;

    this.router.get("/verify/:accountId/:token", this.verifyAuthenticator);
  }

  private verifyAuthenticator = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Make clients able to specify where to redirect user
    // Expose three options: 1. Authenticator verified, 2. Token expired, 3. Invalid token
    try {
      const { accountId, token } = validateVerifyAuthenticatorParams(req.params);

      const authenticator = await this.dao.findAuthenticatorByToken(accountId, token);
      if (
        !authenticator ||
        !authenticator.verificationToken ||
        !authenticator.verificationTokenValidUntil
      ) {
        throw new NullData("Authenticator with that token was not found.");
      }

      if (new Date() < new Date(authenticator.verificationTokenValidUntil)) {
        await this.dao.verifyAuthenticator(accountId, token);
        return res.status(ServerResponse.OK).send("Authenticator verified.");
      } else {
        return res.status(ServerResponse.NotAcceptable).send("This link has expired.");
      }
    } catch (err) {
      return res
        .status(ServerResponse.BadRequest)
        .send("Failed to verify this authenticator, please try again later.");
    }
  };
}

export default AuthenticatorRoutes;
