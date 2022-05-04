class TypeCheck {
  public static isInteger(str: string) {
    if (typeof str !== "string" || str.length === 0) return false;
    return !isNaN(parseFloat(str));
  }
}

export default TypeCheck;
