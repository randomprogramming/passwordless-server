// Registration
import type { Response, NextFunction } from "express";
import type { PublicKeyRequest } from "../middleware/RequestTypes";
import B64Helper from "../utils/B64Helper";
import Route from "./Route";
import Dao from "../dao";
import ServerResponse from "../constants/ServerResponse";
import { validateEmailBody } from "../validators";
import { NullData, ValidationException } from "../exceptions";
import { isNonEmptyString } from "../validators/helpers";
import { hasPublicKey } from "../middleware/keys";
import FidoFactory from "../FidoFactory";

class AttestationRoutes extends Route {
  private fidoFactory: FidoFactory;
  private dao: Dao;

  constructor(dao: Dao, fidoFactory: FidoFactory) {
    super();

    this.fidoFactory = fidoFactory;
    this.dao = dao;

    // TODO: Figure out why TS is complaining here
    // @ts-ignore
    this.router.post("/begin", [hasPublicKey], this.beginAttestation);
    // @ts-ignore
    this.router.post("/complete", [hasPublicKey], this.completeAttestation);
  }

  private beginAttestation = async (
    req: PublicKeyRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email } = validateEmailBody(req.body);
      const fido = await this.fidoFactory.fromPublicKey(req.publicKey);
      const account = await this.dao.createAccount(email, req.publicKey);
      if (!account) {
        throw new NullData("Account is null after creation");
      }
      const registrationOptions = await fido.attestationOptions();

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
    req: PublicKeyRequest,
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
        const fido = await this.fidoFactory.fromPublicKey(req.publicKey);
        const response = await fido.attestationResult(attestationResult, {
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
