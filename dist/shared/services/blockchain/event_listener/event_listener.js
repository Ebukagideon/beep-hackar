"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenForCreateIntentEvent = listenForCreateIntentEvent;
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
const cosmwasm_stargate_1 = require("@cosmjs/cosmwasm-stargate");
const proto_signing_1 = require("@cosmjs/proto-signing");
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importDefault(require("crypto"));
const mnemonic = "your mnemonic here"; // Replace with your mnemonic
const rpcEndpoint = "wss://rpc-palvus.pion-1.ntrn.tech/websocket"; // Replace with your RPC endpoint
const contractAddress = "neutron13r9m3cn8zu6rnmkepajnm04zrry4g24exy9tunslseet0s9wrkkstcmkhr"; // Replace with your smart contract address
const password = "secret-key"; // Replace with your encryption password
// Encryption parameters
const algorithm = "aes-256-cbc";
const key = crypto_1.default.randomBytes(32);
const iv = crypto_1.default.randomBytes(16);
// Define the price threshold for filling intents
const someThreshold = 10; // Replace with your actual threshold value
function encrypt(text, key, iv) {
    const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}
function createAndStoreWallet() {
    return __awaiter(this, void 0, void 0, function* () {
        const wallet = yield proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
        const [account] = yield wallet.getAccounts();
        const address = account.address;
        // Encrypt the mnemonic
        const encryptedMnemonic = encrypt(mnemonic, key, iv);
        // Store encrypted mnemonic, address, key, and iv
        console.log("Encrypted Mnemonic:", encryptedMnemonic);
        console.log("Address:", address);
        console.log("Key:", key.toString("hex"));
        console.log("IV:", iv.toString("hex"));
        return { wallet, address };
    });
}
function listenForCreateIntentEvent() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tmClient = yield tendermint_rpc_1.Tendermint34Client.connect(rpcEndpoint);
            console.log("Connected to RPC endpoint");
            tmClient.subscribeTx(`wasm._contract_address='${contractAddress}' AND wasm.event='create_intent'`).subscribe({
                next: (event) => __awaiter(this, void 0, void 0, function* () {
                    console.log("Received create_intent event:", event);
                    // Check executor balance and asset price
                    const { wallet, address } = yield createAndStoreWallet();
                    const client = yield cosmwasm_stargate_1.SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet);
                    const executorAddress = "executor_address_here"; // Replace with actual executor address
                    const requiredAmount = 1000000; // Replace with required amount to fill intent
                    const asset = "cosmos"; // Replace with actual asset
                    const hasEnoughBalance = yield checkExecutorBalance(client, executorAddress, requiredAmount);
                    const assetPrice = yield getPrice(asset);
                    console.log("Executor Balance Check:", hasEnoughBalance);
                    console.log("Asset Price:", assetPrice);
                    if (hasEnoughBalance && assetPrice < someThreshold) {
                        const msg = {
                            fill_intent: {
                            // Your fill intent message parameters
                            }
                        };
                        yield fillIntent(client, contractAddress, msg, address);
                    }
                }),
                error: (err) => {
                    console.error("Error:", err);
                },
                complete: () => {
                    console.log("Subscription complete");
                }
            });
            console.log("Listening for create_intent events...");
        }
        catch (error) {
            console.error("Error listening for events:", error);
        }
    });
}
function checkExecutorBalance(client, executorAddress, requiredAmount) {
    return __awaiter(this, void 0, void 0, function* () {
        const balance = yield client.getBalance(executorAddress, "uatom"); // Replace with appropriate denom
        return parseInt(balance.amount) >= requiredAmount;
    });
}
function getPrice(asset) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, node_fetch_1.default)(`https://api.coingecko.com/api/v3/simple/price?ids=${asset}&vs_currencies=usd`);
        const data = yield response.json();
        return data[asset].usd;
    });
}
function fillIntent(client, contractAddress, msg, signerAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield client.execute(signerAddress, contractAddress, msg, "auto");
        console.log("Intent filled:", result);
    });
}
// Start the event listener
listenForCreateIntentEvent().catch((err) => {
    console.error("Error listening for events:", err);
});
