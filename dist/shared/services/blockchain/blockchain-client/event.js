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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentEventListener = exports.IntentEventHandler = void 0;
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
// Event type constants
const EVENT_TYPES = {
    CREATE_INTENT: 'create_intent',
    ESCROW_IBC_TRANSFER: 'escrow_ibc_transfer',
    ESCROW_NATIVE_TOKENS: 'escrow_native_tokens',
    IBC_TRANSFER_FAILURE: 'ibc_transfer_failure',
    ACCEPT_INTENT: 'accept_intent',
    ACCEPT_INTENT_FAILURE: 'accept_intent_failure',
    EXECUTOR_ESCROW: 'executor_escrow',
    CREATOR_PAYOUT: 'creator_payout',
    EXECUTOR_PAYOUT: 'executor_payout',
    INTENT_EXECUTED: 'intent_executed'
};
// Helper function to parse attributes
function parseAttributes(attributes) {
    return attributes.reduce((acc, attr) => (Object.assign(Object.assign({}, acc), { [attr.key]: attr.value })), {});
}
// Main event handler class
class IntentEventHandler {
    handleEvent(event) {
        const attributes = parseAttributes(event.attributes);
        switch (event.type) {
            case EVENT_TYPES.CREATE_INTENT:
                if (this.onCreateIntent) {
                    this.onCreateIntent({
                        intentId: attributes.intent_id,
                        creator: attributes.creator,
                        amount: attributes.amount,
                        inputToken: attributes.input_token,
                        outputToken: attributes.output_token,
                        targetChain: attributes.target_chain,
                        minOutput: attributes.min_output,
                        status: attributes.status,
                        expiryHeight: attributes.expiry_height
                    });
                }
                break;
            case EVENT_TYPES.ACCEPT_INTENT:
                if (this.onAcceptIntent) {
                    this.onAcceptIntent({
                        intentId: attributes.intent_id,
                        creator: attributes.creator,
                        executor: attributes.executor,
                        inputToken: attributes.input_token,
                        outputToken: attributes.output_token,
                        amount: attributes.amount,
                        minOutput: attributes.min_output
                    });
                }
                break;
            case EVENT_TYPES.ACCEPT_INTENT_FAILURE:
                if (this.onAcceptIntentFailure) {
                    this.onAcceptIntentFailure({
                        intentId: attributes.intent_id,
                        error: attributes.error,
                        stage: attributes.stage
                    });
                }
                break;
            case EVENT_TYPES.EXECUTOR_ESCROW:
                if (this.onExecutorEscrow) {
                    this.onExecutorEscrow({
                        intentId: attributes.intent_id,
                        sender: attributes.sender,
                        receiver: attributes.receiver,
                        denom: attributes.denom,
                        ibcDenom: attributes.ibc_denom,
                        amount: attributes.amount
                    });
                }
                break;
            case EVENT_TYPES.CREATOR_PAYOUT:
                if (this.onCreatorPayout) {
                    this.onCreatorPayout({
                        intentId: attributes.intent_id,
                        sender: attributes.sender,
                        receiver: attributes.receiver,
                        denom: attributes.denom,
                        ibcDenom: attributes.ibc_denom,
                        amount: attributes.amount
                    });
                }
                break;
            case EVENT_TYPES.EXECUTOR_PAYOUT:
                if (this.onExecutorPayout) {
                    this.onExecutorPayout({
                        intentId: attributes.intent_id,
                        sender: attributes.sender,
                        receiver: attributes.receiver,
                        denom: attributes.denom,
                        ibcDenom: attributes.ibc_denom,
                        amount: attributes.amount
                    });
                }
                break;
            case EVENT_TYPES.INTENT_EXECUTED:
                if (this.onIntentExecuted) {
                    this.onIntentExecuted({
                        intentId: attributes.intent_id,
                        creator: attributes.creator,
                        executor: attributes.executor,
                        status: attributes.status
                    });
                }
                break;
            // Existing handlers from previous implementation
            case EVENT_TYPES.ESCROW_IBC_TRANSFER:
                if (this.onEscrowIBCTransfer) {
                    this.onEscrowIBCTransfer({
                        intentId: attributes.intent_id,
                        sender: attributes.sender,
                        receiver: attributes.receiver,
                        ibcDenom: attributes.ibc_denom,
                        amount: attributes.amount
                    });
                }
                break;
            case EVENT_TYPES.ESCROW_NATIVE_TOKENS:
                if (this.onEscrowNativeTokens) {
                    this.onEscrowNativeTokens({
                        intentId: attributes.intent_id,
                        sender: attributes.sender,
                        receiver: attributes.receiver,
                        denom: attributes.denom,
                        amount: attributes.amount
                    });
                }
                break;
            case EVENT_TYPES.IBC_TRANSFER_FAILURE:
                if (this.onIBCTransferFailure) {
                    this.onIBCTransferFailure({
                        sender: attributes.sender,
                        receiver: attributes.receiver,
                        denom: attributes.denom,
                        amount: attributes.amount,
                        error: attributes.error
                    });
                }
                break;
        }
    }
    // Event registration methods
    setCreateIntentHandler(handler) {
        this.onCreateIntent = handler;
    }
    setAcceptIntentHandler(handler) {
        this.onAcceptIntent = handler;
    }
    setAcceptIntentFailureHandler(handler) {
        this.onAcceptIntentFailure = handler;
    }
    setExecutorEscrowHandler(handler) {
        this.onExecutorEscrow = handler;
    }
    setCreatorPayoutHandler(handler) {
        this.onCreatorPayout = handler;
    }
    setExecutorPayoutHandler(handler) {
        this.onExecutorPayout = handler;
    }
    setIntentExecutedHandler(handler) {
        this.onIntentExecuted = handler;
    }
    setEscrowIBCTransferHandler(handler) {
        this.onEscrowIBCTransfer = handler;
    }
    setEscrowNativeTokensHandler(handler) {
        this.onEscrowNativeTokens = handler;
    }
    setIBCTransferFailureHandler(handler) {
        this.onIBCTransferFailure = handler;
    }
}
exports.IntentEventHandler = IntentEventHandler;
class IntentEventListener {
    constructor(wsUrl) {
        this.client = null;
        this.subscriptions = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1 second
        this.wsUrl = wsUrl;
        this.eventHandler = new IntentEventHandler();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wsClient = new tendermint_rpc_1.WebsocketClient(this.wsUrl);
                this.client = yield tendermint_rpc_1.Tendermint34Client.create(wsClient);
                this.reconnectAttempts = 0;
                console.log('Connected to blockchain at', this.wsUrl);
                // Subscribe to all intent-related events
                yield this.subscribeToEvents();
            }
            catch (error) {
                console.error('Connection error:', error);
                yield this.handleReconnect();
            }
        });
    }
    handleReconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                yield new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
                yield this.connect();
            }
            else {
                throw new Error('Failed to connect after maximum reconnection attempts');
            }
        });
    }
    subscribeToEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error('Client not initialized');
            }
            // Create query strings for each event type
            const eventQueries = Object.values(EVENT_TYPES).map(eventType => `event.type='${eventType}'`);
            try {
                // Subscribe to events
                for (const query of eventQueries) {
                    const stream = this.client.subscribeNewBlock();
                    // Process events from each block
                    stream.subscribe({
                        next: (event) => __awaiter(this, void 0, void 0, function* () {
                            if (event.header) {
                                // Fetch the block data
                                const block = yield this.client.block(event.header.height);
                                // Process all transactions in the block
                                if (block.block.txs) {
                                    for (const tx of block.block.txs) {
                                        // Get transaction results
                                        const txResult = yield this.client.tx({ hash: tx });
                                        // Process events from transaction
                                        if (txResult.result.events) {
                                            txResult.result.events
                                                .filter((event) => Object.values(EVENT_TYPES).includes(event.type))
                                                .forEach((event) => {
                                                this.eventHandler.handleEvent({
                                                    type: event.type,
                                                    attributes: event.attributes.map(attr => ({
                                                        key: Buffer.from(attr.key).toString('utf8'),
                                                        value: Buffer.from(attr.value).toString('utf8')
                                                    }))
                                                });
                                            });
                                        }
                                    }
                                }
                            }
                        }),
                        error: (error) => __awaiter(this, void 0, void 0, function* () {
                            console.error('Subscription error:', error);
                            yield this.handleReconnect();
                        }),
                        complete: () => {
                            console.log('Subscription completed');
                        }
                    });
                    this.subscriptions.push(query);
                }
                console.log('Subscribed to events:', this.subscriptions);
            }
            catch (error) {
                console.error('Subscription error:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                this.client.disconnect();
                this.client = null;
                this.subscriptions = [];
                console.log('Disconnected from blockchain');
            }
        });
    }
    // Event handler setters
    setCreateIntentHandler(handler) {
        this.eventHandler.setCreateIntentHandler(handler);
    }
    setAcceptIntentHandler(handler) {
        this.eventHandler.setAcceptIntentHandler(handler);
    }
    setAcceptIntentFailureHandler(handler) {
        this.eventHandler.setAcceptIntentFailureHandler(handler);
    }
    setExecutorEscrowHandler(handler) {
        this.eventHandler.setExecutorEscrowHandler(handler);
    }
    setCreatorPayoutHandler(handler) {
        this.eventHandler.setCreatorPayoutHandler(handler);
    }
    setExecutorPayoutHandler(handler) {
        this.eventHandler.setExecutorPayoutHandler(handler);
    }
    setIntentExecutedHandler(handler) {
        this.eventHandler.setIntentExecutedHandler(handler);
    }
    setEscrowIBCTransferHandler(handler) {
        this.eventHandler.setEscrowIBCTransferHandler(handler);
    }
    setEscrowNativeTokensHandler(handler) {
        this.eventHandler.setEscrowNativeTokensHandler(handler);
    }
    setIBCTransferFailureHandler(handler) {
        this.eventHandler.setIBCTransferFailureHandler(handler);
    }
}
exports.IntentEventListener = IntentEventListener;
// Example usage
const startEventListener = () => __awaiter(void 0, void 0, void 0, function* () {
    const listener = new IntentEventListener('ws://your-cosmos-node:26657/websocket');
    // Set up event handlers
    listener.setCreateIntentHandler((event) => {
        console.log('New intent created:', event);
    });
    listener.setAcceptIntentHandler((event) => {
        console.log('Intent accepted:', event);
    });
    // Connect to the blockchain
    try {
        yield listener.connect();
    }
    catch (error) {
        console.error('Failed to start listener:', error);
    }
    // Cleanup on process termination
    process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Shutting down listener...');
        yield listener.disconnect();
        process.exit(0);
    }));
});
// Start the listener
startEventListener().catch(console.error);
