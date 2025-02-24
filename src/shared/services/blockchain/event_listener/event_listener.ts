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