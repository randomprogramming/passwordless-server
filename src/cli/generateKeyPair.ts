import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

const publicExport = publicKey
  .export({ type: "pkcs1", format: "pem" })
  .toString();
const privateExport = privateKey
  .export({ type: "pkcs1", format: "pem" })
  .toString();

console.log("Public Key:");
console.log(publicExport);
console.log();
console.log("Private Key:");
console.log(privateExport);
