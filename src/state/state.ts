import { createGlobalState } from "react-hooks-global-state";
import { ModelState } from "./stateType";

let pubkey = localStorage.getItem("pubkey") || "";
if (!pubkey.includes("0x")) {
  pubkey = "";
}
// app state
const initialState: ModelState = {
  web3: undefined,
  tokenList: [],
};

const { useGlobalState, getGlobalState, setGlobalState } =
  createGlobalState(initialState);

export { useGlobalState, getGlobalState, setGlobalState };
