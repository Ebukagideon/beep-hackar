import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { readFileSync } from "fs";

import dotenv from "dotenv"

dotenv.config()

const rpcEndpoint = "https://rpc-palvus.pion-1.ntrn.tech";
const mnemonic = process.env.MNEMONIC;
const wasmFilePath = "../artifacts/mono_chain_beep.wasm";

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

  // Token deployment details
  // Upload successful, code ID: 10895
  // Test ATOM contract instantiated at: neutron1sr60e2velepytzsdyuutcmccl9n2p2lu3pjcggllxyc9rzyu562sqegazj
  // Test NGN contract instantiated at: neutron1he6zd5kk03cs5ywxk5tth9qfewxwnh7k9hjwekr7gs9gl9argadsqdc9rp

  const initMsg = {
    admin: firstAccount.address, 
    supported_tokens: [
      "neutron1sr60e2velepytzsdyuutcmccl9n2p2lu3pjcggllxyc9rzyu562sqegazj", // tATOM
      "neutron1he6zd5kk03cs5ywxk5tth9qfewxwnh7k9hjwekr7gs9gl9argadsqdc9rp" // tNGN
    ], 
    default_timeout_height: 20, // 2 minutes = 6 sec block * 20
    supported_protocols: ["neutron"]
  };

  const instantiateReceipt = await client.instantiate(firstAccount.address, uploadReceipt.codeId, initMsg, "Beep: IBC intent settlement contract", "auto");
  console.log("Contract instantiated at:", instantiateReceipt.contractAddress);
  
  // Upload successful, code ID: 10896
  // Contract instantiated at: neutron1ywegy3q9hk0nrvpvrq2u6fcdwe3eh3a57rdw4x5pppzxtjmxx7qqu8327v
}

main().catch(console.error);
