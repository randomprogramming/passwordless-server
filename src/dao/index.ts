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
    return await this.prisma.account.create({
      data: {
        email,
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
}

export default Dao;
