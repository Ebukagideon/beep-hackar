package main

import (
    "context"
    "fmt"
    sdk "github.com/cosmos/cosmos-sdk/types"
    "github.com/tendermint/tendermint/rpc/client/http"
)

func main() {
    rpcClient, err := http.New("http://localhost:26657", "/websocket")
    if err != nil {
        panic(err)
    }

    if err := rpcClient.Start(); err != nil {
        panic(err)
    }
    defer rpcClient.Stop()

    query := "tm.event='Tx' AND transfer.sender='cosmos1...'"

    // Subscribe to events
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    out, err := rpcClient.Subscribe(ctx, "example-client", query)
    if err != nil {
        panic(err)
    }

    // Handle events
    for event := range out {
        fmt.Println("Received event:", event)
    }
}
