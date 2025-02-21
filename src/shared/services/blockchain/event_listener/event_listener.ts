import { WebSocketClient } from "@cosmjs/tendermint-rpc";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";

async function main() {
    const url = "ws://localhost:26657/websocket"; // Replace with your Tendermint RPC WebSocket URL
    const client = await Tendermint34Client.connect(url);

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
}

main().catch((err) => {
    console.error("Error in main:", err);
});

