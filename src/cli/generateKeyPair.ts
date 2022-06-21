import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

let publicExport = publicKey.export({ type: "pkcs1", format: "pem" });
let privateExport = privateKey.export({ type: "pkcs1", format: "pem" });

if (typeof publicExport === "string") {
  publicExport = Buffer.from(publicExport);
}
if (typeof privateExport === "string") {
  privateExport = Buffer.from(privateExport);
}

publicExport = publicExport.toString("base64");
privateExport = privateExport.toString("base64");

console.log("Public Key In B64:");
console.log(publicExport);
console.log();
console.log("Private Key In B64:");
console.log(privateExport);
