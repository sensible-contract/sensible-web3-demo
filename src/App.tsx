import Web3 from "@sensible-contract/sensible-web3";
import { LocalWallet } from "@sensible-contract/wallets";
import { Button, Card, Col, Input, message, Row, Select } from "antd";
import React, { useRef, useState } from "react";
import "./App.css";
import { getGlobalState, setGlobalState, useGlobalState } from "./state/state";
import { transferBsvInDerivedPath } from "./txUtils";
const { Option } = Select;

let window: any = globalThis.window;
function connectWallet() {
  message.warn("Please connect wallet.");
}

function viewAddressOnExplorer(address: string) {
  window.location.href = `https://blockcheck.info/address/${address}`;
}

function viewTransactionOnExplorer(txid: string) {
  window.open(`https://blockcheck.info/tx/${txid}`);
}

async function UpdateTokenList() {
  let web3 = getGlobalState("web3");
  if (web3) {
    let _res = await web3.sensible.getTokenList();
    setGlobalState("tokenList", _res);
  }
}

function ComConnect() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");

  return (
    <Card title="Basic">
      <Button
        type="primary"
        onClick={async () => {
          let window: any = globalThis.window;
          if (!window.sensilet) {
            alert("sensilet is not installed");
            window.location.href = "https://sensilet.com/";
            return;
          }
          await window.sensilet.requestAccount();

          let web3 = new Web3(window.sensilet);
          setGlobalState("web3", web3);
          setConnected(true);
          let addr = await web3.wallet.getAddress();
          setAddress(addr);
          let balance = await web3.sensible.getBsvBalance();
          setBalance(`${balance.uiAmount} BSV`);

          UpdateTokenList();
          message.success("Connect success.");
        }}
      >
        Connect Sensilet
      </Button>

      <Button
        type="primary"
        onClick={async () => {
          let localWallet = LocalWallet.fromWIF(
            "L3UP4NJeL1BrpaJmBu4gNy3ZWrXdiVHFkms6HoVEm27FjxvmZMbh"
          );
          let web3 = new Web3(localWallet);
          setGlobalState("web3", web3);
          setConnected(true);
          setAddress(await web3.wallet.getAddress());
          let balance = await web3.sensible.getBsvBalance();

          UpdateTokenList();
          setBalance(`${balance.uiAmount} BSV`);
          message.success("Connect success.");
        }}
      >
        Connect Local Wallet
      </Button>
      <div className="data-block">{`Address: ${address}`}</div>
      <div className="data-block">{`Balance: ${balance}`}</div>
    </Card>
  );
}

function ComSendBsv() {
  const addressInputRef = useRef<Input | null>(null);
  const amountInputRef = useRef<Input | null>(null);

  const [txid, setTxid] = useState("");
  return (
    <Card title="Send Bsv">
      <Input
        ref={addressInputRef}
        placeholder="receiver address: "
        onChange={(e) => {
          console.log(addressInputRef.current?.state.value);
        }}
      />
      <Input
        ref={amountInputRef}
        type="number"
        placeholder="amount:"
        onChange={(e) => {
          console.log(e.target.value);
        }}
      />

      <Button
        type="primary"
        onClick={async () => {
          let web3 = getGlobalState("web3");
          if (!web3) {
            connectWallet();
            return;
          }

          const address = addressInputRef.current?.state.value;
          const amount = amountInputRef.current?.state.value;
          if (!address) {
            message.error("Please input address.");
            return;
          }
          if (!amount) {
            message.error("Please input amount.");
            return;
          }
          let satoshis = web3.utils.toSatoshis(amount);
          let { txid } = await web3.sensible.transferBsv({
            receiver: { address, amount: satoshis },
          });

          if (txid) setTxid(txid);
          message.success("success");
        }}
      >
        SEND
      </Button>

      {txid ? (
        <div className="data-block">
          <div>
            txid:{" "}
            <a
              onClick={() => {
                viewTransactionOnExplorer(txid);
              }}
            >
              {txid}
            </a>{" "}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ComSendToken() {
  const codehashInputRef = useRef<Input | null>(null);
  const genesisInputRef = useRef<Input | null>(null);
  const addressInputRef = useRef<Input | null>(null);
  const amountInputRef = useRef<Input | null>(null);
  const [tokenList] = useGlobalState("tokenList");
  const [txid, setTxid] = useState("");
  const [selectedTokenIndex, setSelectedTokenIndex] = useState(0);
  return (
    <Card title="Send Tokens">
      {tokenList && tokenList?.length > 0 ? (
        <Select
          defaultValue={`${tokenList[0].tokenBalance.uiAmount} ${tokenList[0].symbol}`}
          style={{ width: 240 }}
          onChange={(idx) => {
            console.log(idx);
          }}
        >
          {tokenList?.map((v, index) => (
            <Option value={index}>
              {`${v.tokenBalance.uiAmount} ${v.symbol}`}
            </Option>
          ))}
        </Select>
      ) : (
        <div>no tokens holding</div>
      )}
      <Input ref={addressInputRef} placeholder="receiver address: " />
      <Input ref={amountInputRef} type="number" placeholder="amount:" />

      <Button
        type="primary"
        onClick={async () => {
          let web3 = getGlobalState("web3");
          if (!web3) {
            connectWallet();
            return;
          }
          if (!tokenList) {
            return;
          }

          const token = tokenList[selectedTokenIndex];
          const address = addressInputRef.current?.state.value;
          const amount = amountInputRef.current?.state.value;

          if (!address) {
            message.error("Please input address.");
            return;
          }
          if (!amount) {
            message.error("Please input amount.");
            return;
          }
          let toAmount = web3.utils
            .fromDecimalUnit(amount, token.tokenBalance.decimal)
            .toString(10);
          let { txids } = await web3.sensible.transferToken({
            token,
            receivers: [
              {
                address,
                amount: toAmount,
              },
            ],
          });
          message.success("success");

          UpdateTokenList();
          if (txids) setTxid(txids[1]);
        }}
      >
        TRANSFER TOKENS
      </Button>

      {txid ? (
        <div className="data-block">
          <div>
            txid:{" "}
            <a
              onClick={() => {
                viewTransactionOnExplorer(txid);
              }}
            >
              {txid}
            </a>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ComSignMessage() {
  const messageInputRef = useRef<Input | null>(null);

  const [signature, setSignature] = useState("");
  return (
    <Card title="Sign Message">
      <Input ref={messageInputRef} placeholder="message: " />
      <Button
        type="primary"
        onClick={async () => {
          let web3 = getGlobalState("web3");
          if (!web3) {
            connectWallet();
            return;
          }

          const msg = messageInputRef.current?.state.value;
          if (!msg) {
            message.error("Please input message.");
            return;
          }

          let signature = await web3.wallet.signMessage(msg);
          setSignature(signature);
        }}
      >
        SIGN
      </Button>
      <Button
        type="primary"
        onClick={async () => {
          let web3 = getGlobalState("web3");
          if (!web3) {
            connectWallet();
            return;
          }

          const msg = messageInputRef.current?.state.value;
          if (!msg) {
            message.error("Please input message.");
            return;
          }
          let address = await web3.wallet.getAddress();
          let success = web3.utils.verifyMessage(msg, address, signature);
          if (success) {
            message.success("Verification pass.");
          } else {
            message.error("Verification failed.");
          }
        }}
      >
        VERIFY
      </Button>

      {signature ? (
        <div className="data-block">signature: {signature}</div>
      ) : null}
    </Card>
  );
}

function ComSendBsvInDerivedPath() {
  const derivedInputRef = useRef<Input | null>(null);
  const addressInputRef = useRef<Input | null>(null);
  const amountInputRef = useRef<Input | null>(null);

  const [derivedAddress, setDerivedAddress] = useState("");
  const [derviedBalance, setDerivedBalance] = useState("");
  const [txid, setTxid] = useState("");
  return (
    <Card title="Send Bsv In Derived Path">
      <Input
        ref={derivedInputRef}
        placeholder="derived path: "
        onChange={(e) => {
          console.log(derivedInputRef.current?.state.value);
        }}
      />

      <Button
        type="primary"
        onClick={async () => {
          let web3 = getGlobalState("web3");
          if (!web3) {
            connectWallet();
            return;
          }

          const derivedPath = derivedInputRef.current?.state.value;
          let { pubKey, address } =
            await window.sensilet.getPublicKeyAndAddress(derivedPath);

          let _res = await web3.provider.getBalance(address);
          let balance = _res.balance + _res.pendingBalance;

          console.log(derivedPath, balance);
          setDerivedAddress(address);
          setDerivedBalance(balance / 100000000 + " BSV");
          message.success("success");
        }}
      >
        UPDATE PATH
      </Button>

      {derivedAddress ? (
        <div>
          <div className="data-block">
            <div>
              derivedAddress:{" "}
              <a
                onClick={() => {
                  viewAddressOnExplorer(derivedAddress);
                }}
              >
                {derivedAddress}
              </a>{" "}
            </div>
          </div>
          <div className="data-block">
            <div>Balance: {derviedBalance}</div>
          </div>
        </div>
      ) : null}

      <Input
        ref={addressInputRef}
        placeholder="receiver address: "
        onChange={(e) => {
          console.log(addressInputRef.current?.state.value);
        }}
      />
      <Input
        ref={amountInputRef}
        type="number"
        placeholder="amount:"
        onChange={(e) => {
          console.log(e.target.value);
        }}
      />

      <Button
        type="primary"
        onClick={async () => {
          let web3 = getGlobalState("web3");
          if (!web3) {
            connectWallet();
            return;
          }

          const derivedPath = derivedInputRef.current?.state.value;
          const address = addressInputRef.current?.state.value;
          const amount = amountInputRef.current?.state.value;
          if (!address) {
            message.error("Please input address.");
            return;
          }
          if (!amount) {
            message.error("Please input amount.");
            return;
          }
          let satoshis = web3.utils.toSatoshis(amount);

          let txid = await transferBsvInDerivedPath({
            derivedPath,
            toAddress: address,
            toSatoshis: satoshis,
          });

          setTxid(txid);
          message.success("success");
        }}
      >
        SEND
      </Button>

      {txid ? (
        <div className="data-block">
          <div>
            txid:{" "}
            <a
              onClick={() => {
                viewTransactionOnExplorer(txid);
              }}
            >
              {txid}
            </a>{" "}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function App() {
  return (
    <div className="App">
      <header className="App-header"></header>
      <Row gutter={24} wrap={true}>
        <Col span={8}>
          <ComConnect />
        </Col>

        <Col span={8}>
          <ComSendBsv />
        </Col>
        <Col span={8}>
          <ComSendToken />
        </Col>
        <Col span={8}>
          <ComSignMessage />
        </Col>

        <Col span={8}>
          <ComSendBsvInDerivedPath />
        </Col>
      </Row>
    </div>
  );
}

export default App;
