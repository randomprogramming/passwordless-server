import type { Attachment, Fido2LibOptions } from "fido2-lib";
import type { FidoOptions } from "@prisma/client";
import { Fido2Lib } from "fido2-lib";
import { ApiKeyError } from "./exceptions";
import Dao from "./dao";

class FidoFactory {
  private dao: Dao;

  constructor(dao: Dao) {
    this.dao = dao;
  }

  public static stringToFidoAttachment = (
    att: string | null
  ): Attachment | undefined => {
    if (!att) return undefined;
    if (att === "cross-platform" || att === "platform")
      return att as Attachment;
    return undefined;
  };

  public static toFido2LibOptions = (
    localFidoOptions: FidoOptions
  ): Fido2LibOptions => {
    // Fido2-lib expects the missing options to be undefined,
    // meanwhile our database returns null for those options,
    // so we have to cast nulls to undefineds
    return {
      ...localFidoOptions,
      rpId: localFidoOptions.rpId || undefined,
      rpName: localFidoOptions.rpName || undefined,
      rpIcon: localFidoOptions.rpIcon || undefined,
      authenticatorAttachment: FidoFactory.stringToFidoAttachment(
        localFidoOptions.authenticatorAttachment
      ),
      authenticatorRequireResidentKey:
        localFidoOptions.authenticatorRequireResidentKey || undefined,
      authenticatorUserVerification:
        localFidoOptions.authenticatorUserVerification || undefined,
    };
  };

  private createFidoInstance = (options: FidoOptions) => {
    return new Fido2Lib(FidoFactory.toFido2LibOptions(options));
  };

  public fromPrivateKey = async (privateKey: string): Promise<Fido2Lib> => {
    const client = await this.dao.findClientByPrivateKey(privateKey);
    if (!client) {
      throw new ApiKeyError("No client found with that API key.");
    }
    return this.createFidoInstance(client.fidoOptions);
  };

  public fromPublicKey = async (publicKey: string): Promise<Fido2Lib> => {
    const client = await this.dao.findClientByPublicKey(publicKey);
    if (!client) {
      throw new ApiKeyError("No client found with that API key.");
    }
    return this.createFidoInstance(client.fidoOptions);
  };
}

export default FidoFactory;
