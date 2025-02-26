import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

const mnemonic = "your mnemonic here"; // Replace with your wallet's mnemonic
const rpcEndpoint = "http://localhost:26657"; // Replace with your Tendermint RPC endpoint
const contractAddress = "your_contract_address_here"; // Replace with your smart contract address

async function main() {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [account] = await wallet.getAccounts();
    const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet);

    const tmClient = await Tendermint34Client.connect(rpcEndpoint);
    
    // Subscribe to transaction events
    tmClient.subscribeTx(`transfer.recipient='${contractAddress}' OR tm.event='create_intent' OR tm.event='fill_intent' OR tm.event='withdraw_intent_fund' OR tm.event='update_admin' OR tm.event='add_supported_tokens' OR tm.event='remove_supported_tokens' OR tm.event='add_supported_protocols' OR tm.event='remove_supported_protocols' OR tm.event='update_default_timeout_height'`).subscribe({
        next: (event: any) => {
            console.log("Received event:", event);
            // Add custom logic to process the event
        },
        error: (err: any) => {
            console.error("Error:", err);
        },
        complete: () => {
            console.log("Subscription complete");
        }
    });

    console.log(`Listening to events for contract: ${contractAddress}`);
}

main().catch((err) => {
    console.error("Error in main:", err);
});