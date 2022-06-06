import type { Request } from "express";

export interface PublicKeyRequest extends Request {
  publicKey: string;
}

export interface PrivateKeyRequest extends Request {
  privateKey: string;
}
