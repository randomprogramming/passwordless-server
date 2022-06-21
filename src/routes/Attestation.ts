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
import MailClient from "../mail/mail.client";
import { randomBytes } from "crypto";
import getOrigin from "../utils/getOrigin";

class AttestationRoutes extends Route {
  private static readonly AUTHENTICATOR_VERIFICATION_TOKEN_SIZE = 64;

  private fidoFactory: FidoFactory;
  private dao: Dao;
  private mailClient: MailClient;

  constructor(dao: Dao, fidoFactory: FidoFactory, mailClient: MailClient) {
    super();

    this.fidoFactory = fidoFactory;
    this.dao = dao;
    this.mailClient = mailClient;

    // TODO: Figure out why TS is complaining here
    // @ts-ignore
    this.router.post("/begin", [hasPublicKey], this.beginAttestation);
    // @ts-ignore
    this.router.post("/complete", [hasPublicKey], this.completeAttestation);
  }

  private beginAttestation = async (req: PublicKeyRequest, res: Response, next: NextFunction) => {
    try {
      const { email } = validateEmailBody(req.body);
      const fido = await this.fidoFactory.fromPublicKey(req.publicKey);
      // One account can have multiple devices registered
      let account = await this.dao.findAccountByEmailAndPublicKey(email, req.publicKey);
      if (!account) {
        account = await this.dao.createAccount(email, req.publicKey);
      }
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

      const account = await this.dao.findAccountByEmailAndPublicKey(email, req.publicKey);
      if (!account || !account.attestationChallenge) {
        throw new NullData(
          "Account with the specified ID was not found or is missing the challenge."
        );
      }

      try {
        const attestationResult = {
          ...credentials,
          rawId: B64Helper.b64tab(credentials.rawId),
        };
        // TODO: Found out what factor is(probably add a column for the customer to add their site location)
        const fido = await this.fidoFactory.fromPublicKey(req.publicKey);
        const response = await fido.attestationResult(attestationResult, {
          factor: "either",
          challenge: account.attestationChallenge,
          origin: getOrigin(req),
        });
        const publicKey = response.authnrData.get("credentialPublicKeyPem");
        const counter = (response.authnrData.get("counter") as number) || 0;
        const credentialsId = credentials.id;
        const transports = (credentials.transports as string[]) || []; //TODO: pass this from frontend
        const authenticatorType = credentials.type;

        if (!isNonEmptyString(publicKey)) {
          throw new NullData("Generated public key is invalid.");
        }
        if (!isNonEmptyString(credentialsId)) {
          throw new NullData("Credential ID is null.");
        }
        if (!isNonEmptyString(authenticatorType)) {
          throw new NullData("Authenticator Type is null.");
        }

        const verificationToken = randomBytes(
          AttestationRoutes.AUTHENTICATOR_VERIFICATION_TOKEN_SIZE
        ).toString("base64url");
        await this.dao.createAuthenticator({
          accountId: account.id,
          authCounter: counter,
          credentialId: credentialsId,
          credentialPublicKey: publicKey,
          enabled: false,
          transports: transports,
          type: authenticatorType,
          verificationToken,
        });

        await this.mailClient.sendAuthenticatorAddedMail(
          account.email,
          account.id,
          verificationToken
        );

        return res.status(ServerResponse.OK).send();
      } catch (err) {
        console.error("Failed to validate challenge:");
        console.log(err);
        return res
          .status(ServerResponse.NotAcceptable)
          .json({ message: "Failed to validate challenge." });
      }
    } catch (err) {
      next(err);
    }
  };
}

export default AttestationRoutes;
