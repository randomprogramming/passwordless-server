import { EnvVariableException } from "../exceptions";
import TypeCheck from "./TypeCheck";

class EnvParser {
  public static getNumber(env: string, defaultValue?: number): number {
    const val = process.env[env];

    if (!val) {
      if (!defaultValue) {
        throw new EnvVariableException(
          env,
          "Variable not found, default not provided."
        );
      } else {
        return defaultValue;
      }
    }

    if (TypeCheck.isInteger(val)) {
      return parseInt(val);
    } else {
      throw new EnvVariableException(env, "Variable expected to be numeric.");
    }
  }
}

export default EnvParser;
