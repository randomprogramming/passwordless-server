import type { Request, Response, NextFunction } from "express";
import path from "path";
import ServerResponse from "../constants/ServerResponse";
import Dao from "../dao";
import { NullData, ValidationException } from "../exceptions";
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
        return res.status(ServerResponse.OK).sendFile("AuthenticatorVerified.html", {
          root: path.join(__dirname, "views"),
        });
      } else {
        throw new ValidationException("Authenticator token is no longer valid.");
      }
    } catch (err) {
      return res.status(ServerResponse.BadRequest).sendFile("AuthenticatorFailed.html", {
        root: path.join(__dirname, "views"),
      });
    }
  };
}

export default AuthenticatorRoutes;
