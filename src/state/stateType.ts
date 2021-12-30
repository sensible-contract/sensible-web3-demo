import Web3 from "@sensible-contract/sensible-web3";

export type ModelState = {
  web3?: Web3;
  tokenList?: {
    codehash: string;
    genesis: string;
    name: string;
    symbol: string;
    tokenBalance: {
      amount: string;
      uiAmount: string;
      decimal: number;
    };
  }[];
};
