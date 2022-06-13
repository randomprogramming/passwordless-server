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
    let accountIdValidated: string | null = null;
    try {
      const { accountId, token } = validateVerifyAuthenticatorParams(req.params);
      accountIdValidated = accountId;
      const authenticator = await this.dao.findAuthenticatorByToken(accountId, token);
      if (!authenticator?.verificationToken || !authenticator?.verificationTokenValidUntil) {
        throw new NullData("Authenticator with that token was not found.");
      }

      if (new Date() < new Date(authenticator.verificationTokenValidUntil)) {
        const client = await this.dao.findClientForAccount(accountId);
        if (!client) {
          throw new NullData("Client was not found.");
        }
        await this.dao.verifyAuthenticator(accountId, token);
        if (client.authenticatorAddedRedirectUrl) {
          return res.redirect(client.authenticatorAddedRedirectUrl);
        } else {
          return res.status(ServerResponse.OK).sendFile("AuthenticatorVerified.html", {
            root: path.join(__dirname, "views"),
          });
        }
      } else {
        throw new ValidationException("Authenticator token is no longer valid.");
      }
    } catch (err) {
      if (!accountIdValidated) {
        return res.status(ServerResponse.BadRequest).sendFile("AuthenticatorFailed.html", {
          root: path.join(__dirname, "views"),
        });
      }
      const client = await this.dao.findClientForAccount(accountIdValidated);
      if (!client || !client.authenticatorFailedRedirectUrl) {
        return res.status(ServerResponse.BadRequest).sendFile("AuthenticatorFailed.html", {
          root: path.join(__dirname, "views"),
        });
      } else {
        return res.redirect(client.authenticatorFailedRedirectUrl);
      }
    }
  };
}

export default AuthenticatorRoutes;
