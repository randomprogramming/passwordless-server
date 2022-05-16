// Registration
import type { Request, Response, NextFunction } from "express";
import { Fido2Lib } from "fido2-lib";
import B64Helper from "../utils/B64Helper";
import Route from "./Route";
import Dao from "../dao";
import ServerResponse from "../constants/ServerResponse";
import { validateEmailBody } from "../validators";
import { NullData, ValidationException } from "../exceptions";
import { isNonEmptyString } from "../validators/helpers";

class AttestationRoutes extends Route {
  private fido: Fido2Lib;
  private dao: Dao;

  constructor(dao: Dao, fido: Fido2Lib) {
    super();

    this.fido = fido;
    this.dao = dao;

    this.router.post("/begin", this.beginAttestation);
    this.router.post("/complete", this.completeAttestation);
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

  private completeAttestation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { accountId, credentials } = req.body;

      if (!accountId || !credentials) {
        throw new ValidationException("AccountId or Result missing.");
      }

      const account = await this.dao.findAccountById(accountId);
      if (!account || !account.attestationChallenge) {
        throw new NullData(
          "Account with the specified ID was not found or is missing the challenge."
        );
      }

      let publicKey: any;
      try {
        const attestationResult = {
          ...credentials,
          rawId: B64Helper.b64tab(credentials.rawId),
        };
        // TODO: Found out what origin and factor are
        const response = await this.fido.attestationResult(attestationResult, {
          factor: "either",
          challenge: account.attestationChallenge,
          origin: req.headers["origin"] || "http://localhost:3000",
        });
        publicKey = response.authnrData.get("credentialPublicKeyPem");
      } catch (err) {
        console.error("Failed to validate challenge:");
        console.log(err);
        return res
          .status(ServerResponse.NotAcceptable)
          .json({ message: "Failed to validate challenge." });
      }

      if (!isNonEmptyString(publicKey)) {
        throw new NullData("Generated public key is invalid.");
      }
      await this.dao.updateAccountById(accountId, {
        credentialPublicKey: publicKey,
      });

      return res.status(ServerResponse.OK).send();
    } catch (err) {
      next(err);
    }
  };
}

export default AttestationRoutes;
