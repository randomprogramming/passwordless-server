export function isNonEmptyString(str: any): str is string {
  return !!str && typeof str === "string" && str.length > 0;
}
