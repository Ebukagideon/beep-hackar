import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import { readFileSync } from "fs";

import dotenv from "dotenv"

dotenv.config()

const rpcEndpoint = "https://rpc.testnet.osmosis.zone";
const mnemonic = process.env.OSMOSIS_MNEMONIC;
const wasmFilePath = "../artifacts/beep_contract.wasm";

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

    // Upload successful, code ID: 12186
    // Test ATOM contract instantiated at: osmo1scr22mp2psg4j7jf4a4682fm6xc72q3rnjanavslx7j3srmg0pjsu8u3js
    // Test NGN contract instantiated at: osmo1g0ztcz84puaw8dgqufv0nz6pxjwsy20q6zdn02xwg5t2wqyry7mq8ml3vk

    const initMsg = {
        admin: firstAccount.address, 
        supported_tokens: [
          "osmo1scr22mp2psg4j7jf4a4682fm6xc72q3rnjanavslx7j3srmg0pjsu8u3js", // tATOM
          "osmo1g0ztcz84puaw8dgqufv0nz6pxjwsy20q6zdn02xwg5t2wqyry7mq8ml3vk," // tNGN
        ], 
        default_timeout_height: 20, // 2 minutes = 6 sec block * 20
        supported_protocols: ["neutron", "osmosis"]
    };
    
    const instantiateReceipt = await client.instantiate(firstAccount.address, uploadReceipt.codeId, initMsg, "Beep: IBC intent settlement contract", "auto");
    console.log("Contract instantiated at:", instantiateReceipt.contractAddress);

    // Upload successful, code ID: 12187
    // Contract instantiated at: osmo1kttmlndqt6q89ewk9em0zp0w4nfhquksu2wv7keaqwnmvlua0wwsfk0uxs
}

main().catch(console.error);

