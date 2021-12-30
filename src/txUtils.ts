import * as bsv from "@sensible-contract/bsv";
import { SensiblequeryProvider } from "@sensible-contract/providers";
import { TxComposer } from "@sensible-contract/tx-composer";
let window: any = globalThis.window;
export async function transferBsvInDerivedPath({
  derivedPath,
  toAddress,
  toSatoshis,
}: {
  derivedPath: string;
  toAddress: string;
  toSatoshis: number;
}) {
  let sensilet = window.sensilet;
  let { pubKey, address } = await sensilet.getPublicKeyAndAddress(derivedPath);

  const provider = new SensiblequeryProvider();
  const txComposer = new TxComposer();
  let utxos = await provider.getUtxos(address);
  utxos.forEach((v, index) => {
    txComposer.appendP2PKHInput({
      address: new bsv.Address(v.address),
      txId: v.txId,
      outputIndex: v.outputIndex,
      satoshis: v.satoshis,
    });
    txComposer.addInputInfo({
      inputIndex: index,
      address: derivedPath,
    });
  });
  txComposer.appendP2PKHOutput({
    address: new bsv.Address(toAddress),
    satoshis: toSatoshis,
  });
  txComposer.appendChangeOutput(new bsv.Address(address));
  let sigResults = await sensilet.signTransaction(
    txComposer.getRawHex(),
    txComposer.getInputInfos()
  );
  txComposer.unlock(sigResults);

  await provider.broadcast(txComposer.getRawHex());
  return txComposer.getTxId();
}
