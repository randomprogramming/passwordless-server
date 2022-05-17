// Login
import type { Request, Response, NextFunction } from "express";
import type { Factor } from "fido2-lib";
import { Fido2Lib } from "fido2-lib";
import ServerResponse from "../constants/ServerResponse";
import Dao from "../dao";
import { NullData } from "../exceptions";
import B64Helper from "../utils/B64Helper";
import { validateEmailBody } from "../validators";
import Route from "./Route";

class AssertionRoutes extends Route {
  private dao: Dao;
  private fido: Fido2Lib;

  constructor(dao: Dao, fido: Fido2Lib) {
    super();

    this.dao = dao;
    this.fido = fido;

    this.router.post("/begin", this.beginAssertion);
    this.router.post("/complete", this.completeAssertion);
  }

  private beginAssertion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email } = validateEmailBody(req.body);
      const assertionOptions = await this.fido.assertionOptions();
      const encodedChallenge = B64Helper.abtb64(assertionOptions.challenge);
      const encodedOptions = {
        ...assertionOptions,
        challenge: encodedChallenge,
      };
      await this.dao.updateAccountByEmail(email, {
        assertionChallenge: encodedChallenge,
      });
      return res.status(ServerResponse.OK).json(encodedOptions);
    } catch (err) {
      next(err);
    }
  };

  private completeAssertion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, clientAssertionResponse } = req.body;
      validateEmailBody(email);

      const account = await this.dao.findAccountByEmail(email);
      if (
        !account ||
        !account.assertionChallenge ||
        !account.credentialPublicKey
      ) {
        throw new NullData(
          "Account with the specified ID was not found or is missing some data."
        );
      }

      // TODO: Found out what origin and factor are(probably add a column for the customer to add their site location)
      const assertionExpectations = {
        challenge: account.assertionChallenge,
        origin: "http://localhost:3000",
        factor: "either" as Factor,
        publicKey: account.credentialPublicKey,
        prevCounter: account.authCounter,
        userHandle: Buffer.from(account.id).toString("base64"), // Must be b64
      };

      try {
        const decoded = {
          ...clientAssertionResponse,
          rawId: B64Helper.b64tab(clientAssertionResponse.rawId),
        };

        await this.fido.assertionResult(decoded, assertionExpectations);
      } catch (err) {
        console.error("Login failed:");
        console.log(err);
        return res
          .status(ServerResponse.NotAcceptable)
          .json({ message: "Login failed." });
      }

      return res.status(ServerResponse.OK).json();
    } catch (err) {
      next(err);
    }
  };
}

export default AssertionRoutes;
