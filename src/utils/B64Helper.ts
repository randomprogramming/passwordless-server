class B64Helper {
  // ArrayBuffer to B64
  public static abtb64(ab: ArrayBuffer): string {
    return Buffer.from(ab).toString("base64");
  }

  // B64 to ArrayBuffer
  public static b64tab(b64: string): ArrayBuffer {
    // return Buffer.from(b64, "base64"); TODO: Test if this works
    throw new Error("Not impolemented");
  }
}

export default B64Helper;
