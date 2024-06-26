// Login
import type { Response, NextFunction } from "express";
import type { Factor } from "fido2-lib";
import type { PrivateKeyRequest, PublicKeyRequest } from "../middleware/RequestTypes";
import ServerResponse from "../constants/ServerResponse";
import Dao from "../dao";
import { NullData } from "../exceptions";
import { hasPrivateKey, hasPublicKey } from "../middleware/keys";
import B64Helper from "../utils/B64Helper";
import { validateEmailBody } from "../validators";
import Route from "./Route";
import { privateEncrypt } from "crypto";
import FidoFactory from "../FidoFactory";
import { isNonEmptyString } from "../validators/helpers";

class AssertionRoutes extends Route {
  private dao: Dao;
  private fidoFactory: FidoFactory;
  private authPrivateKey: string;

  constructor(dao: Dao, fidoFactory: FidoFactory, authPrivateKey: string) {
    super();

    this.dao = dao;
    this.fidoFactory = fidoFactory;
    this.authPrivateKey = authPrivateKey;

    // TODO: Figure out why TS is complaining here
    // @ts-ignore
    this.router.post("/begin", [hasPublicKey], this.beginAssertion);
    // @ts-ignore
    this.router.post("/complete", [hasPrivateKey], this.completeAssertion);
  }

  private beginAssertion = async (req: PublicKeyRequest, res: Response, next: NextFunction) => {
    try {
      const { email } = validateEmailBody(req.body);
      const fido = await this.fidoFactory.fromPublicKey(req.publicKey);
      const assertionOptions = await fido.assertionOptions();
      const encodedChallenge = B64Helper.abtb64(assertionOptions.challenge);
      const encodedOptions = {
        ...assertionOptions,
        challenge: encodedChallenge,
      };
      await this.dao.updateAccountByEmailAndPublicKey(email, req.publicKey, {
        assertionChallenge: encodedChallenge,
      });
      return res.status(ServerResponse.OK).json(encodedOptions);
    } catch (err) {
      next(err);
    }
  };

  private completeAssertion = async (req: PrivateKeyRequest, res: Response, next: NextFunction) => {
    try {
      const { email, clientAssertionResponse } = req.body;

      validateEmailBody({ email });

      const credentialId = clientAssertionResponse?.id;
      if (!isNonEmptyString(credentialId)) {
        throw new NullData("Credential ID is null.");
      }

      const account = await this.dao.findAccountByEmailAndPrivateKey(email, req.privateKey);
      if (!account || !account.assertionChallenge) {
        throw new NullData("Account with the specified ID was not found or is missing some data.");
      }

      const accountAuthenticator = await this.dao.findEnabledAccountAuthenticator(
        account.id,
        credentialId
      );
      if (!accountAuthenticator) {
        throw new NullData("Account authenticator not found.");
      }

      const expectedOrigin =
        (await this.dao.findOriginByPrivateKey(req.privateKey)) || "http://localhost:3000";
      console.log("Expected Origin: ", expectedOrigin);
      // TODO: Found out what factor is(probably add a column for the customer to add their site location)
      const assertionExpectations = {
        challenge: account.assertionChallenge,
        origin: expectedOrigin,
        factor: "either" as Factor,
        publicKey: accountAuthenticator.credentialPublicKey,
        prevCounter: accountAuthenticator.authCounter,
        userHandle: Buffer.from(account.id).toString("base64"), // Must be b64
      };

      try {
        const decoded = {
          ...clientAssertionResponse,
          rawId: B64Helper.b64tab(clientAssertionResponse.rawId),
        };

        const fido = await this.fidoFactory.fromPrivateKey(req.privateKey);
        const result = await fido.assertionResult(decoded, assertionExpectations);

        if (result) {
          // Send a signed message back so that we can verify that the status hasn't been tampered with
          // And the user is 100% authenticated
          const signedMessage = privateEncrypt(this.authPrivateKey, Buffer.from(email)).toString(
            "base64"
          );

          return res.status(ServerResponse.OK).json({
            signedMessage,
          });
        }
      } catch (err) {
        console.error("Login failed:");
        console.log(err);
        return res.status(ServerResponse.NotAcceptable).json({ message: "Login failed." });
      }
    } catch (err) {
      next(err);
    }
  };
}

export default AssertionRoutes;
