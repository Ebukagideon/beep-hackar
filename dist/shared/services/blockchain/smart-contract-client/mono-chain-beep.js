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
exports.BeepContractClient = void 0;
const cosmwasm_stargate_1 = require("@cosmjs/cosmwasm-stargate");
const proto_signing_1 = require("@cosmjs/proto-signing");
const stargate_1 = require("@cosmjs/stargate");
class BeepContractClient {
    constructor(contractAddress, rpcEndpoint) {
        this.signingClient = null;
        this.queryClient = null;
        this.wallet = null;
        this.contractAddress = contractAddress;
        this.rpcEndpoint = rpcEndpoint;
    }
    connect(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set up signing client for execute messages
            this.wallet = yield proto_signing_1.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
                prefix: "neutron"
            });
            this.signingClient = yield cosmwasm_stargate_1.SigningCosmWasmClient.connectWithSigner(this.rpcEndpoint, this.wallet, { gasPrice: stargate_1.GasPrice.fromString("0.025untrn") });
            // Set up query client
            this.queryClient = yield cosmwasm_stargate_1.CosmWasmClient.connect(this.rpcEndpoint);
            return this.signingClient;
        });
    }
    // Query methods - don't require signing
    getConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.queryClient) {
                throw new Error("Query client not initialized. Call connect() first.");
            }
            return yield this.queryClient.queryContractSmart(this.contractAddress, { get_config: {} });
        });
    }
    getIntent(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.queryClient) {
                throw new Error("Query client not initialized. Call connect() first.");
            }
            return yield this.queryClient.queryContractSmart(this.contractAddress, { get_intent: { id } });
        });
    }
    listIntents(startAfter, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.queryClient) {
                throw new Error("Query client not initialized. Call connect() first.");
            }
            return yield this.queryClient.queryContractSmart(this.contractAddress, {
                list_intents: {
                    start_after: startAfter,
                    limit: limit
                }
            });
        });
    }
    getUserNonce(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.queryClient) {
                throw new Error("Query client not initialized. Call connect() first.");
            }
            return yield this.queryClient.queryContractSmart(this.contractAddress, { get_user_nonce: { address } });
        });
    }
    // Existing execute methods remain the same but use signingClient instead of client
    ensureSigningConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.signingClient) {
                throw new Error("Signing client not connected. Call connect() first.");
            }
            return this.signingClient;
        });
    }
    getAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.wallet) {
                throw new Error("Wallet not initialized. Call connect() first.");
            }
            const [firstAccount] = yield this.wallet.getAccounts();
            return firstAccount.address;
        });
    }
    // Increase allowance for CW20 tokens
    increaseAllowance(cw20TokenContract, spender, amount, funds) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                increase_allowance: {
                    spender: spender,
                    amount: amount
                }
            };
            return yield client.execute(senderAddress, cw20TokenContract, msg, "auto", undefined, funds);
        });
    }
    // Example of an updated execute method
    createIntent(inputTokens, outputTokens, tip, timeout, funds) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                create_intent: {
                    intent_type: {
                        Swap: {
                            output_tokens: outputTokens
                        }
                    },
                    input_tokens: inputTokens,
                    timeout,
                    tip
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto", undefined, funds);
        });
    }
    fillIntent(intentId, outputTokens, funds) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                fill_intent: {
                    intent_id: intentId,
                    intent_type: {
                        Swap: {
                            output_tokens: outputTokens
                        }
                    }
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto", undefined, funds);
        });
    }
    withdrawIntentFund(intentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                withdraw_intent_fund: {
                    intent_id: intentId
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto");
        });
    }
    updateAdmin(newAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                update_admin: {
                    new_admin: newAdmin
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto");
        });
    }
    addSupportedTokens(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                add_supported_tokens: {
                    tokens
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto");
        });
    }
    removeSupportedTokens(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                remove_supported_tokens: {
                    tokens
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto");
        });
    }
    addSupportedProtocols(protocols) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                add_supported_protocols: {
                    protocols
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto");
        });
    }
    removeSupportedProtocols(protocols) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                remove_supported_protocols: {
                    protocols
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto");
        });
    }
    updateDefaultTimeoutHeight(defaultTimeoutHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.ensureSigningConnection();
            const senderAddress = yield this.getAddress();
            const msg = {
                update_default_timeout_height: {
                    default_timeout_height: defaultTimeoutHeight
                }
            };
            return yield client.execute(senderAddress, this.contractAddress, msg, "auto");
        });
    }
}
exports.BeepContractClient = BeepContractClient;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const example = () => __awaiter(void 0, void 0, void 0, function* () {
    // Upload successful, code ID: 10906
    // Contract instantiated at: neutron13r9m3cn8zu6rnmkepajnm04zrry4g24exy9tunslseet0s9wrkkstcmkhr
    try {
        const CONTRACT_ADDRESS = "neutron13r9m3cn8zu6rnmkepajnm04zrry4g24exy9tunslseet0s9wrkkstcmkhr";
        const RPC_ENDPOINT = "https://rpc-palvus.pion-1.ntrn.tech";
        const MNEMONIC = process.env.MNEMONIC;
        const tATOM = "neutron1sr60e2velepytzsdyuutcmccl9n2p2lu3pjcggllxyc9rzyu562sqegazj";
        const tNGN = "neutron1he6zd5kk03cs5ywxk5tth9qfewxwnh7k9hjwekr7gs9gl9argadsqdc9rp";
        const client = new BeepContractClient(CONTRACT_ADDRESS, RPC_ENDPOINT);
        yield client.connect(MNEMONIC);
        // increase tATOM allowance 
        let atomAllowanceRes = yield client.increaseAllowance(tATOM, CONTRACT_ADDRESS, "10");
        console.log("Increase Allowance Transaction Result:", atomAllowanceRes);
        // Execute example
        const result = yield client.createIntent([{
                token: "neutron1sr60e2velepytzsdyuutcmccl9n2p2lu3pjcggllxyc9rzyu562sqegazj",
                amount: "10",
                is_native: false
            }], [{
                token: "neutron1he6zd5kk03cs5ywxk5tth9qfewxwnh7k9hjwekr7gs9gl9argadsqdc9rp",
                amount: "50",
                is_native: false,
                target_address: undefined
            }], {
            token: "neutron1sr60e2velepytzsdyuutcmccl9n2p2lu3pjcggllxyc9rzyu562sqegazj",
            amount: "1",
            is_native: false
        }, undefined, []);
        console.log("Create Intent Transaction Result:", result);
        // // increase allowance 
        // let ngnAllowanceRes = await client.increaseAllowance(tNGN, CONTRACT_ADDRESS, "50");
        // console.log("Increase Allowance Transaction Result:", ngnAllowanceRes);
        // let res = await client.fillIntent(
        //     "intent52ff63e02bee532efa520d74b113b032a847eee4", // Change to your own intent id
        //     [{
        //         token: "neutron1he6zd5kk03cs5ywxk5tth9qfewxwnh7k9hjwekr7gs9gl9argadsqdc9rp",
        //         amount: "50",
        //         is_native: false,
        //         target_address: undefined
        //     }]
        // )
        // console.log("Fill Intent Transaction Result:", res);
        // // Query examples
        // const config = await client.getConfig();
        // console.log("Contract config:", config);
        // const intents = await client.listIntents(undefined, 10);
        // console.log("First 10 intents:", JSON.stringify(intents));
        // const userNonce = await client.getUserNonce("neutron107nhk9pqhp446fr0fc83z0v82rg9guy8runkuz");
        // console.log("User nonce:", userNonce);
    }
    catch (error) {
        console.error("Error:", error);
    }
});
example().catch(console.error);
