// Login
import { Fido2Lib } from "fido2-lib";
import Route from "./Route";

class AssertionRoutes extends Route {
  private fido: Fido2Lib;

  constructor(fido: Fido2Lib) {
    super();

    this.fido = fido;
  }
}

export default AssertionRoutes;
