class B64Helper {
  // ArrayBuffer to B64
  public static abtb64(ab: ArrayBuffer): string {
    return Buffer.from(ab).toString("base64");
  }

  // B64 to ArrayBuffer
  public static b64tab(b64: string): ArrayBuffer {
    return new Uint8Array(Buffer.from(b64, "base64")).buffer;
  }

  // B64 to URL safe B64
  public static b64tb64url(b64: string): string {
    return b64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/={0,2}$/g, "");
  }
}

export default B64Helper;
