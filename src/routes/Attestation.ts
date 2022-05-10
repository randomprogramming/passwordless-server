// Registration
import type { Request, Response, NextFunction } from "express";
import { Fido2Lib } from "fido2-lib";
import B64Helper from "../utils/B64Helper";
import Route from "./Route";
import Dao from "../dao";
import ServerResponse from "../constants/ServerResponse";
import { validateEmailBody } from "../validators";

class AttestationRoutes extends Route {
  private fido: Fido2Lib;
  private dao: Dao;

  constructor(dao: Dao, fido: Fido2Lib) {
    super();

    this.fido = fido;
    this.dao = dao;

    this.router.post("/begin", this.beginAttestation);
  }

  private beginAttestation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // TODO: Make sure req.body.email is unique before inserting
      const data = validateEmailBody(req.body);
      const account = await this.dao.createAccount(data.email);
      const registrationOptions = await this.fido.attestationOptions();

      registrationOptions.user = {
        id: account.id,
        displayName: account.email.split("@")[0],
        name: account.email,
      };

      const encodedOptions = {
        ...registrationOptions,
        challenge: B64Helper.abtb64(registrationOptions.challenge),
      };

      await this.dao.updateAccountById(account.id, {
        attestationChallenge: encodedOptions.challenge,
      });

      return res.status(ServerResponse.Created).send(encodedOptions);
    } catch (err) {
      next(err);
    }
  };
}

export default AttestationRoutes;
