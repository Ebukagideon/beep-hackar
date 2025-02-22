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
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = "ws://localhost:26657/websocket"; // Replace with your Tendermint RPC WebSocket URL
        const client = yield tendermint_rpc_1.Tendermint34Client.connect(url);
        client.subscribe({
            query: "tm.event='Tx'" // Customize your query
        }).subscribe({
            next: (event) => {
                console.log("Received event:", event);
                // Add custom logic to process the event
            },
            error: (err) => {
                console.error("Error:", err);
            },
            complete: () => {
                console.log("Subscription complete");
            }
        });
    });
}
main().catch((err) => {
    console.error("Error in main:", err);
});
