import { PrismaClient, Account, Authenticator } from "@prisma/client";
import { ApiKeyError } from "../exceptions";

// Data that is allowed to be passed in when updating a row in the Account table
// Don't allow the ID to be changed
export type IAccountUpdateData = Omit<Partial<Account>, "id" | "createdAt">;

export type IAuthenticatorCreateData = Omit<
  Authenticator,
  "id" | "createdAt" | "verificationTokenValidUntil"
>;

class Dao {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async close() {
    await this.prisma.$disconnect();
  }

  public async createAccount(email: string, publicKey: string) {
    const client = await this.findClientByPublicKey(publicKey);
    return await this.prisma.account.create({
      data: {
        email,
        clientId: client.id,
      },
    });
  }

  public async findAccountById(id: string) {
    return await this.prisma.account.findFirst({
      where: { id },
    });
  }

  public async updateAccountById(id: string, data: IAccountUpdateData) {
    return await this.prisma.account.update({
      where: {
        id,
      },
      data,
    });
  }

  public async findClientByPrivateKey(privateKey: string) {
    const client = await this.prisma.client.findUnique({
      where: {
        privateApiKey: privateKey,
      },
      include: {
        fidoOptions: true,
      },
    });
    if (!client) {
      throw new ApiKeyError("Client with that API key was not found");
    }
    return client;
  }

  public async findClientByPublicKey(publicKey: string) {
    const client = await this.prisma.client.findUnique({
      where: {
        publicApiKey: publicKey,
      },
      include: {
        fidoOptions: true,
      },
    });
    if (!client) {
      throw new ApiKeyError("Client with that API key was not found");
    }
    return client;
  }

  public async findAccountByEmailAndPrivateKey(
    email: string,
    privateKey: string
  ) {
    const client = await this.findClientByPrivateKey(privateKey);

    return await this.prisma.account.findUnique({
      where: {
        email_clientId: {
          email,
          clientId: client.id,
        },
      },
    });
  }

  public async findAccountByEmailAndPublicKey(
    email: string,
    publicKey: string
  ) {
    const client = await this.findClientByPublicKey(publicKey);

    return await this.prisma.account.findUnique({
      where: {
        email_clientId: {
          email,
          clientId: client.id,
        },
      },
    });
  }

  public async updateAccountByEmailAndPublicKey(
    email: string,
    publicKey: string,
    data: IAccountUpdateData
  ) {
    const client = await this.findClientByPublicKey(publicKey);

    return await this.prisma.account.update({
      where: {
        email_clientId: {
          email,
          clientId: client.id,
        },
      },
      data,
    });
  }

  public async createAuthenticator(data: IAuthenticatorCreateData) {
    return await this.prisma.authenticator.create({
      data,
    });
  }

  public async findEnabledAccountAuthenticator(
    accountId: string,
    credentialId: string
  ) {
    return await this.prisma.authenticator.findFirst({
      where: {
        enabled: true,
        accountId,
        credentialId,
      },
    });
  }

  public async findAuthenticatorByToken(
    accountId: string,
    verificationToken: string
  ) {
    return await this.prisma.authenticator.findUnique({
      where: {
        verificationToken_accountId: {
          accountId,
          verificationToken,
        },
      },
    });
  }

  public async verifyAuthenticator(
    accountId: string,
    verificationToken: string
  ) {
    return await this.prisma.authenticator.update({
      where: {
        verificationToken_accountId: {
          accountId,
          verificationToken,
        },
      },
      data: {
        enabled: true,
        verificationToken: null,
        verificationTokenValidUntil: null,
      },
    });
  }
}

export default Dao;
