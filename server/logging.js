import { ENABLE_LOG } from "./config.js";

export function log() {
  if (ENABLE_LOG) {
    for (let i = 0; i < arguments.length; i++) {
      console.log(new Array(i + 1).join("\t") + arguments[i]);
    }
  }
}
