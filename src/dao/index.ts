import { PrismaClient, Account } from "@prisma/client";

// Data that is allowed to be passed in when updating a row in the Account table
// Don't allow the ID to be changed
export type IAccountUpdateData = Omit<Partial<Account>, "id">;

class Dao {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public async close() {
    await this.prisma.$disconnect();
  }

  public async createAccount(email: string) {
    // TODO: Fetch this client from the public or private key
    const client = await this.prisma.client.findFirst({});
    if (!client) return;
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

  public async findAccountByEmail(email: string) {
    // TODO: In the future email wont be a unique field, so replace this
    return await this.prisma.account.findUnique({
      where: {
        email,
      },
    });
  }

  public async updateAccountByEmail(email: string, data: IAccountUpdateData) {
    // TODO: In the future email wont be a unique field, so replace this
    return await this.prisma.account.update({
      where: {
        email,
      },
      data,
    });
  }
}

export default Dao;
