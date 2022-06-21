import type { Request } from "express";

export default function (req: Request) {
  let origin: string | null = null;
  const originHeader = req.headers["origin"];
  if (originHeader) {
    origin = new URL(originHeader).origin;
  } else {
    origin = "http://localhost:3000";
  }
  console.log("Origin: ", origin);
  return origin;
}
