import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { readFileSync } from "fs";

import dotenv from "dotenv"

dotenv.config()

const rpcEndpoint = "https://rpc-palvus.pion-1.ntrn.tech";
const mnemonic = process.env.NEUTRON_MNEMONIC;
const wasmFilePath = "../artifacts/beep_contract.wasm";

async function main() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "neutron",
  });

  const [firstAccount] = await wallet.getAccounts();

  const client = await SigningCosmWasmClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    {
      gasPrice: GasPrice.fromString("0.025untrn"),
    }
  );

  const wasmCode = readFileSync(wasmFilePath);
  const uploadReceipt = await client.upload(firstAccount.address, wasmCode, "auto");
  console.log("Upload successful, code ID:", uploadReceipt.codeId);

  //  ```Upload successful, code ID: 10818```
  // ```Test ATOM contract instantiated at: neutron1yxm00n2arklpfh7zceyq4dm29p0hgcuqt4qc68467lzu6m4v78kqmykjsh```
  // ```Test NGN contract instantiated at: neutron1pr6wn8rc92jwnd398dyes909cdqdpstm6dzfuqdyvx48n8cvc0wsxjcdyc```

  const initMsg = {
    admin: firstAccount.address, 
    supported_tokens: [
      "neutron1yxm00n2arklpfh7zceyq4dm29p0hgcuqt4qc68467lzu6m4v78kqmykjsh", // tATOM
      "neutron1pr6wn8rc92jwnd398dyes909cdqdpstm6dzfuqdyvx48n8cvc0wsxjcdyc," // tNGN
    ], 
    default_timeout_height: 20, // 2 minutes = 6 sec block * 20
    supported_protocols: ["neutron", "osmosis"]
  };

  const instantiateReceipt = await client.instantiate(firstAccount.address, uploadReceipt.codeId, initMsg, "Beep: IBC intent settlement contract", "auto");
  console.log("Contract instantiated at:", instantiateReceipt.contractAddress);

// Upload successful, code ID: 10819
// Contract instantiated at: neutron143ag97863exrh0tgr3u39vyljefrylusddajx52sfe3lrn325wpqvvuy0l
}

main().catch(console.error);


