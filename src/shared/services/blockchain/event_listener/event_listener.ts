<<<<<<< HEAD
import { Tendermint34Client, TxEvent } from "@cosmjs/tendermint-rpc";
import { SigningCosmWasmClient, CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import fetch from "node-fetch";
import crypto from "crypto";

const mnemonic = "your mnemonic here"; // Replace with your mnemonic
const rpcEndpoint = "wss://rpc-palvus.pion-1.ntrn.tech/websocket"; // Replace with your RPC endpoint
const contractAddress = "neutron13r9m3cn8zu6rnmkepajnm04zrry4g24exy9tunslseet0s9wrkkstcmkhr"; // Replace with your smart contract address
const password = "secret-key"; // Replace with your encryption password

// Encryption parameters
const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// Define the price threshold for filling intents
const someThreshold = 10; // Replace with your actual threshold value

function encrypt(text: string, key: Buffer, iv: Buffer): string {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

async function createAndStoreWallet() {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [account] = await wallet.getAccounts();
    const address = account.address;

    // Encrypt the mnemonic
    const encryptedMnemonic = encrypt(mnemonic, key, iv);

    // Store encrypted mnemonic, address, key, and iv
    console.log("Encrypted Mnemonic:", encryptedMnemonic);
    console.log("Address:", address);
    console.log("Key:", key.toString("hex"));
    console.log("IV:", iv.toString("hex"));

    return { wallet, address };
}

export async function listenForCreateIntentEvent() {
    try {
        const tmClient = await Tendermint34Client.connect(rpcEndpoint);
        console.log("Connected to RPC endpoint");

        tmClient.subscribeTx(`wasm._contract_address='${contractAddress}' AND wasm.event='create_intent'`).subscribe({
            next: async (event: TxEvent) => {
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
            error: (err: any) => {
                console.error("Error:", err);
            },
            complete: () => {
                console.log("Subscription complete");
            }
        });

        console.log("Listening for create_intent events...");
    } catch (error) {
        console.error("Error listening for events:", error);
    }
}

async function checkExecutorBalance(client: CosmWasmClient, executorAddress: string, requiredAmount: number): Promise<boolean> {
    const balance = await client.getBalance(executorAddress, "uatom"); // Replace with appropriate denom
    return parseInt(balance.amount) >= requiredAmount;
}

async function getPrice(asset: string): Promise<number> {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${asset}&vs_currencies=usd`);
    const data = await response.json();
    return data[asset].usd;
}

async function fillIntent(client: SigningCosmWasmClient, contractAddress: string, msg: object, signerAddress: string) {
    const result = await client.execute(signerAddress, contractAddress, msg, "auto");
    console.log("Intent filled:", result);
}

// Start the event listener
listenForCreateIntentEvent().catch((err) => {
    console.error("Error listening for events:", err);
});
=======
import { StargateClient } from "@cosmjs/stargate";
import { WebsocketClient, SubscriptionEventType } from "@cosmjs/tendermint-rpc";

const RPC_ENDPOINT = "wss://rpc.cosmos.network/websocket";

async function main() {
    const client = await StargateClient.connect(RPC_ENDPOINT);
    const tmClient = new WebsocketClient(RPC_ENDPOINT);
    
    // Use subscribeTx instead of subscribe
    tmClient.subscribeTx((event: SubscriptionEventType) => {
        console.log('Raw event:', JSON.stringify(event, null, 2));
        try {
            const events = (event as any).events;
            if (events) {
                
                for (const [eventType, attributes] of Object.entries(events)) {
                    if (eventType === "message") {
                        const parsedAttributes = (attributes as any[]).map(attr => ({
                            key: attr.key,
                            value: attr.value
                        }));
                        
                        const method = parsedAttributes.find(attr => attr.key === "method")?.value;
                        
                        switch(method) {
                            case "instantiate":
                                console.log("Instantiate Event:", parsedAttributes);
                                break;
                            case "create_intent":
                                console.log("Create Intent Event:", parsedAttributes);
                                break;
                            case "fill_intent":
                                console.log("Fill Intent Event:", parsedAttributes);
                                break;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error processing event:", error);
        }
    }, (error: any) => {
        console.error("Subscription Error:", error);
    });

    async function reconnect() {
        try {
            tmClient.disconnect();
            return new WebsocketClient(RPC_ENDPOINT);
        } catch (error) {
            console.error("Reconnection failed, retrying in 5 seconds...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            return reconnect();
        }
    }

    setInterval(async () => {
        try {
            if (!tmClient.connected) {
                console.log("Connection lost, reconnecting...");
                const newClient = await reconnect();
                if (newClient) {
                    // Re-establish subscription with new client
                    // Add your subscription logic here
                }
            }
        } catch (error) {
            console.error("Heartbeat check failed:", error);
        }
    }, 30000);

    process.on('SIGINT', () => {
        console.log('Closing WebSocket connection...');
        tmClient.disconnect();
        process.exit(0);
    });
}

main().catch(console.error);
>>>>>>> origin
