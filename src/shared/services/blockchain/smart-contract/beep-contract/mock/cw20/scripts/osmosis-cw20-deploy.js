import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { readFileSync } from "fs";

import dotenv from "dotenv"

dotenv.config()

const rpcEndpoint = "https://rpc.testnet.osmosis.zone";
const mnemonic = process.env.OSMOSIS_MNEMONIC;
const wasmFilePath = "../artifacts/first_token_cw20contract.wasm";

async function main() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "osmo",
  });

  const [firstAccount] = await wallet.getAccounts();

  const client = await SigningCosmWasmClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    {
      gasPrice: GasPrice.fromString("0.025uosmo"),
    }
  );

  const wasmCode = readFileSync(wasmFilePath);
  const uploadReceipt = await client.upload(firstAccount.address, wasmCode, "auto");
  console.log("Upload successful, code ID:", uploadReceipt.codeId);

  const initMsgAtom = {
    name: "Test ATOM",
    symbol: "tATOM",
    decimals: 6,
    initial_balances: [
      {
        "address": "osmo1lwkwk72mw5364cw405fxplynxs92zyfjlvwx0t",
        "amount": "10000000"
      },
      {
        "address": "osmo107nhk9pqhp446fr0fc83z0v82rg9guy80cfysh",
        "amount": "10000000"
      }
    ]
  };

  const initMsgNgn = {
    name: "Test NGN",
    symbol: "tNGN",
    decimals: 6,
    initial_balances: [
      {
        "address": "osmo1lwkwk72mw5364cw405fxplynxs92zyfjlvwx0t",
        "amount": "10000000"
      },
      {
        "address": "osmo107nhk9pqhp446fr0fc83z0v82rg9guy80cfysh",
        "amount": "10000000"
      }
    ]
  };

  const instantiateReceiptAtom = await client.instantiate(firstAccount.address, uploadReceipt.codeId, initMsgAtom, "Test ATOM Token", "auto");
  console.log("Test ATOM contract instantiated at:", instantiateReceiptAtom.contractAddress);

  const instantiateReceiptNgn = await client.instantiate(firstAccount.address, uploadReceipt.codeId, initMsgNgn, "Test NGN Token", "auto");
  console.log("Test NGN contract instantiated at:", instantiateReceiptNgn.contractAddress);
}

main().catch(console.error);
