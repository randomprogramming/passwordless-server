import type { Request, Response, NextFunction } from "express";
import type { PrivateKeyRequest, PublicKeyRequest } from "./RequestTypes";
import { ApiKeyError } from "../exceptions";

const KEY_AUTH_PREFIX = "Basic ";

function getKey(req: Request) {
  const authHeader = req.headers.authorization;
  if (
    !authHeader ||
    authHeader.length === 0 ||
    !authHeader.includes(KEY_AUTH_PREFIX)
  ) {
    throw new ApiKeyError("Auth header missing.");
  }
  const key = authHeader.split(KEY_AUTH_PREFIX);
  if (key.length < 2 || key[1].length === 0) {
    throw new ApiKeyError("API key missing.");
  }
  return key[1];
}

export function hasPublicKey(
  req: PublicKeyRequest,
  res: Response,
  next: NextFunction
) {
  req.publicKey = getKey(req);
  next();
}

export function hasPrivateKey(
  req: PrivateKeyRequest,
  res: Response,
  next: NextFunction
) {
  req.privateKey = getKey(req);
  next();
}
