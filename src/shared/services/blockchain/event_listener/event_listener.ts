const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm-stargate");
const { Tendermint34Client } = require("@cosmjs/tendermint-rpc");
const fetch = require("node-fetch");
const crypto = require("crypto");

const mnemonic = "your mnemonic here"; // Replace with your mnemonic
const rpcEndpoint = "http://localhost:26657"; // Replace with your RPC endpoint
const contractAddress = "your_contract_address_here"; // Replace with your contract address
const password = "your password here"; // Replace with your encryption password

async function createAndStoreWallet() {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [account] = await wallet.getAccounts();
    const address = account.address;

    // Encrypt the mnemonic
    const cipher = crypto.createCipher("aes-256-cbc", password);
    let encryptedMnemonic = cipher.update(mnemonic, "utf8", "hex");
    encryptedMnemonic += cipher.final("hex");

    // Store encrypted mnemonic and address
    console.log("Encrypted Mnemonic:", encryptedMnemonic);
    console.log("Address:", address);

    return { wallet, address };
}

async function listenForCreateIntentEvent() {
    const tmClient = await Tendermint34Client.connect(rpcEndpoint);

    tmClient.subscribeTx(`tm.event='create_intent'`).subscribe({
        next: async (event) => {
            console.log("Received create_intent event:", event);

            // Check executor balance and asset price
            const { wallet, address } = await createAndStoreWallet();
            const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet);

            const executorAddress = "executor_address_here"; // Replace with actual executor address
            const requiredAmount = 1000000; // Replace with required amount to fill intent
            const asset = "cosmos"; // Replace with actual asset

            const hasEnoughBalance = await checkExecutorBalance(client, executorAddress, requiredAmount);
            const assetPrice = await getPrice(asset);
            console.log("Executor Balance Check:", hasEnoughBalance);
            console.log("Asset Price:", assetPrice);

            if (hasEnoughBalance && assetPrice < someThreshold) {
                const msg = {
                    fill_intent: {
                        // Your fill intent message parameters
                    }
                };
                await fillIntent(client, contractAddress, msg, address);
            }
        },
        error: (err) => {
            console.error("Error:", err);
        },
        complete: () => {
            console.log("Subscription complete");
        }
    });

    console.log("Listening for create_intent events...");
}

async function checkExecutorBalance(client, executorAddress, requiredAmount) {
    const balance = await client.getBalance(executorAddress, "uatom"); // Replace with appropriate denom
    return balance.amount >= requiredAmount;
}

async function getPrice(asset) {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${asset}&vs_currencies=usd`);
    const data = await response.json();
    return data[asset].usd;
}

async function fillIntent(client, contractAddress, msg, signerAddress) {
    const result = await client.execute(signerAddress, contractAddress, msg, "auto");
    console.log("Intent filled:", result);
}

// Start the event listener
listenForCreateIntentEvent().catch((err) => {
    console.error("Error listening for events:", err);
});
