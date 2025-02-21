"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenFactoryClient = void 0;
const proto_signing_1 = require("@cosmjs/proto-signing");
const stargate_1 = require("@cosmjs/stargate");
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
const query_1 = require("./query");
const tx_1 = require("./tx");
const node_test_1 = require("node:test");
const event_1 = require("./event");
class TokenFactoryClient {
    constructor(rpcEndpoint) {
        this.queryClient = null;
        this.txClient = null;
        this.tmClient = null;
        this.rpcEndpoint = rpcEndpoint;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tmClient = yield tendermint_rpc_1.Tendermint34Client.connect(this.rpcEndpoint);
            const baseQueryClient = new stargate_1.QueryClient(this.tmClient);
            this.queryClient = new query_1.BeepQueryClient(baseQueryClient);
        });
    }
    connectWithWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = "beep";
            const wallet = yield proto_signing_1.DirectSecp256k1HdWallet.generate(12, { prefix });
            const signingClient = yield stargate_1.SigningStargateClient.connectWithSigner(this.rpcEndpoint, wallet, { gasPrice: stargate_1.GasPrice.fromString("0.025token") });
            const address = (yield wallet.getAccounts()).at(0);
            if (!address) {
                return;
            }
            const balance = yield signingClient.getBalance(address === null || address === void 0 ? void 0 : address.address, "token");
            this.txClient = new tx_1.BeepTxClient(signingClient);
            console.log(`Address: ${address.address}, Balance: ${balance.amount}`);
        });
    }
    get query() {
        if (!this.queryClient)
            throw new Error("Query client not connected");
        return this.queryClient;
    }
    get tx() {
        if (!this.txClient)
            throw new Error("Transaction client not connected");
        return this.txClient;
    }
    events() {
        return __awaiter(this, void 0, void 0, function* () {
            const listener = new event_1.IntentEventListener('ws://localhost:26657/websocket');
            // Set up handlers for all event types
            listener.setCreateIntentHandler((event) => {
                console.log('New intent created:', event);
            });
            listener.setAcceptIntentHandler((event) => {
                console.log('Intent accepted:', event);
            });
            listener.setAcceptIntentFailureHandler((event) => {
                console.error('Intent acceptance failed:', event);
            });
            listener.setExecutorEscrowHandler((event) => {
                console.log('Executor escrowed tokens:', event);
            });
            listener.setCreatorPayoutHandler((event) => {
                console.log('Creator received payout:', event);
            });
            listener.setExecutorPayoutHandler((event) => {
                console.log('Executor received payout:', event);
            });
            listener.setIntentExecutedHandler((event) => {
                console.log('Intent executed successfully:', event);
            });
            listener.setEscrowIBCTransferHandler((event) => {
                console.log('IBC transfer escrowed:', event);
            });
            listener.setEscrowNativeTokensHandler((event) => {
                console.log('Native tokens escrowed:', event);
            });
            listener.setIBCTransferFailureHandler((event) => {
                console.error('IBC transfer failed:', event);
            });
            // Connect to the blockchain and start listening
            yield listener.connect();
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            (0, node_test_1.todo)();
        });
    }
}
exports.TokenFactoryClient = TokenFactoryClient;
const startEventListener = () => __awaiter(void 0, void 0, void 0, function* () {
    const listener = new event_1.IntentEventListener('ws://localhost:26657/websocket');
    // Set up handlers for all event types
    listener.setCreateIntentHandler((event) => {
        console.log('New intent created:', event);
    });
    listener.setAcceptIntentHandler((event) => {
        console.log('Intent accepted:', event);
    });
    listener.setAcceptIntentFailureHandler((event) => {
        console.error('Intent acceptance failed:', event);
    });
    listener.setExecutorEscrowHandler((event) => {
        console.log('Executor escrowed tokens:', event);
    });
    listener.setCreatorPayoutHandler((event) => {
        console.log('Creator received payout:', event);
    });
    listener.setExecutorPayoutHandler((event) => {
        console.log('Executor received payout:', event);
    });
    listener.setIntentExecutedHandler((event) => {
        console.log('Intent executed successfully:', event);
    });
    listener.setEscrowIBCTransferHandler((event) => {
        console.log('IBC transfer escrowed:', event);
    });
    listener.setEscrowNativeTokensHandler((event) => {
        console.log('Native tokens escrowed:', event);
    });
    listener.setIBCTransferFailureHandler((event) => {
        console.error('IBC transfer failed:', event);
    });
    // Connect to the blockchain and start listening
    yield listener.connect();
});
// Start the listener
startEventListener().catch(console.error);
__exportStar(require("./types"), exports);
__exportStar(require("./query"), exports);
__exportStar(require("./tx"), exports);
__exportStar(require("./event"), exports);
