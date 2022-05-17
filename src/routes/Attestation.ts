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
      const { email } = validateEmailBody(req.body);
      const account = await this.dao.createAccount(email);
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
      const { email, credentials } = req.body;
      validateEmailBody({ email });

      if (!credentials) {
        throw new ValidationException("Missing credentials.");
      }

      const account = await this.dao.findAccountByEmail(email);
      if (!account || !account.attestationChallenge) {
        throw new NullData(
          "Account with the specified ID was not found or is missing the challenge."
        );
      }

      let publicKey: string, counter: number;
      try {
        const attestationResult = {
          ...credentials,
          rawId: B64Helper.b64tab(credentials.rawId),
        };
        // TODO: Found out what origin and factor are(probably add a column for the customer to add their site location)
        const response = await this.fido.attestationResult(attestationResult, {
          factor: "either",
          challenge: account.attestationChallenge,
          origin: req.headers["origin"] || "http://localhost:3000",
        });
        publicKey = response.authnrData.get("credentialPublicKeyPem");
        counter = response.authnrData.get("counter") || 0;
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
      await this.dao.updateAccountById(account.id, {
        credentialPublicKey: publicKey,
        authCounter: counter,
      });
      return res.status(ServerResponse.OK).send();
    } catch (err) {
      next(err);
    }
  };
}

export default AttestationRoutes;
