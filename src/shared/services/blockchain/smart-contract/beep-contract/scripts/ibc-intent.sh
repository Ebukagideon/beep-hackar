#!/bin/bash

set -e

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Variables
NEUTRON_CHAIN_ID="neutron"
OSMOSIS_CHAIN_ID="osmosis"
NEUTRON_NODE=$NEUTRON_RPC
OSMOSIS_NODE=$OSMOSIS_RPC
NEUTRON_KEY_NAME="neutron"
OSMOSIS_KEY_NAME="osmosis"
CONTRACT_FILE="../artifacts/beep_contract.wasm"
NEUTRON_ADMIN_ADDRESS="neutron107nhk9pqhp446fr0fc83z0v82rg9guy8runkuz"
OSMOSIS_ADMIN_ADDRESS="osmo107nhk9pqhp446fr0fc83z0v82rg9guy80cfysh"
GAS_ADJUSTMENT="1.3"
NEUTRON_FEES="0.025untrn"
OSMOSIS_FEES="0.025uosmo"
NEUTRON_MNEMONIC=$NEUTRON_MNEMONIC
OSMOSIS_MNEMONIC=$OSMOSIS_MNEMONIC
NEUTRON_MOCK_ATOM="neutron1yxm00n2arklpfh7zceyq4dm29p0hgcuqt4qc68467lzu6m4v78kqmykjsh"
OSMOSIS_MOCK_BNGN="osmo1g0ztcz84puaw8dgqufv0nz6pxjwsy20q6zdn02xwg5t2wqyry7mq8ml3vk"

# Function to wait for nodes to start
wait_for_node() {
    local node_url=$1
    until curl --silent --fail $node_url; do
        echo "Waiting for node $node_url to be available..."
        sleep 5
    done
}

# Function to update Docker configurations for Neutron and Osmosis
update_docker_configs() {
    local chain_dir=$1
    local rpc_url=$2
    local grpc_url=$3

    cd $chain_dir
    sed -i "s#26657#$rpc_port#g" docker-compose.yml
    sed -i "s#9090#$grpc_port#g" docker-compose.yml
    cd ..
}

generate_intent_id() {
    local creator=$1
    local nonce=$2
    local input="${creator}:${nonce}"
    local hash=$(echo -n "$input" | sha256sum | cut -c 1-40)
    echo "intent${hash}"
}

# Step 1: Run Local Nodes for Neutron and Osmosis
echo "Starting local nodes for Neutron and Osmosis..."

# Clone repositories
git clone --depth=1 --single-branch https://github.com/neutron-org/neutron.git
git clone --depth=1 --single-branch https://github.com/osmosis-labs/osmosis.git

# Update Docker configurations for Neutron and Osmosis
update_docker_configs "neutron" $NEUTRON_RPC $NEUTRON_GRPC
update_docker_configs "osmosis" $OSMOSIS_RPC $OSMOSIS_GRPC

# Start Neutron node
cd neutron
docker-compose up -d

# Start Osmosis node
cd ../osmosis
docker-compose up -d

# Wait for nodes to be available
wait_for_node $NEUTRON_NODE
wait_for_node $OSMOSIS_NODE

# Step 2: Install and Set Up Hermes Relayer
echo "Installing and setting up Hermes relayer..."

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Hermes
cargo install ibc-relayer-cli --bin hermes --locked

# Initialize Hermes configuration
hermes config init

# Create Hermes config.toml
cat <<EOT >> ~/.hermes/config.toml
[[chains]]
id = 'neutron-1'
# Whether or not this is a CCV consumer chain. Default: false
# Only specify true for CCV consumer chain (Neutron), but NOT for sovereign chains.
ccv_consumer_chain = true
rpc_addr = "$NEUTRON_NODE"
grpc_addr = "$NEUTRON_GRPC"
websocket_addr = 'ws://127.0.0.1:26657/websocket'
rpc_timeout = '10s'
account_prefix = 'neutron'
key_name = "$NEUTRON_KEY_NAME"
address_type = { derivation = 'cosmos' }
store_prefix = 'ibc'
default_gas = 5000000
max_gas = 15000000
gas_price = { price = 0.0026, denom = 'untrn' }
gas_adjustment = 0.1
max_msg_num = 20
max_tx_size = 209715
clock_drift = '20s'
max_block_time = '10s'
trusting_period = '10days'
memo_prefix = 'Beep Intent:'
trust_threshold = { numerator = '1', denominator = '3' }
[chains.packet_filter]
policy = 'allow'
list = [
    ['intent', 'beep-1'],
]

[[chains]]
id = 'osmosis-1'
rpc_addr = "$OSMOSIS_NODE"
grpc_addr = "$OSMOSIS_GRPC"
websocket_addr = 'ws://127.0.0.1:26657/websocket'
rpc_timeout = '10s'
account_prefix = 'osmo'
key_name = "$OSMOSIS_KEY_NAME"
address_type = { derivation = 'cosmos' }
store_prefix = 'ibc'
default_gas = 5000000
max_gas = 15000000
gas_price = { price = 0.0026, denom = 'uosmo' }
gas_multiplier = 1.1
max_msg_num = 20
max_tx_size = 209715
clock_drift = '20s'
max_block_time = '10s'
trusting_period = '10days'
memo_prefix = 'Beep Intent:'
trust_threshold = { numerator = '1', denominator = '3' }
[chains.packet_filter]
policy = 'allow'
list = [
  ['intent', 'beep-1'],
]
EOT

# Add keys for each chain using mnemonics
hermes keys add --chain $NEUTRON_CHAIN_ID --mnemonic "$NEUTRON_MNEMONIC"
hermes keys add --chain $OSMOSIS_CHAIN_ID --mnemonic "$OSMOSIS_MNEMONIC"

# Create clients
hermes create client --host-chain $NEUTRON_CHAIN_ID --reference-chain $OSMOSIS_CHAIN_ID

# Create connection
hermes create connection --a-chain $NEUTRON_CHAIN_ID --b-chain $OSMOSIS_CHAIN_ID

# Create channel
hermes create channel --a-chain $NEUTRON_CHAIN_ID --a-connection beep-1 --a-port intent --b-port intent

# Start relaying
hermes start

# Step 3: Compile and Optimize Smart Contracts
echo "Compiling and optimizing smart contracts..."
docker run --rm -v "$(pwd)":/code \
      --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
      --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
      cosmwasm/workspace-optimizer:0.16.0

# Step 4: Upload Contract Binary to Both Chains
echo "Uploading contract binary to Neutron and Osmosis..."

wasmd tx wasm store $CONTRACT_FILE --from $NEUTRON_KEY_NAME --chain-id $NEUTRON_CHAIN_ID --node $NEUTRON_NODE --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $NEUTRON_FEES
wasmd tx wasm store $CONTRACT_FILE --from $OSMOSIS_KEY_NAME --chain-id $OSMOSIS_CHAIN_ID --node $OSMOSIS_NODE --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $OSMOSIS_FEES

# Get code IDs (manually update these based on your upload transaction results)
NEUTRON_CODE_ID=10819
OSMOSIS_CODE_ID=12187

# Step 5: Instantiate the Contract on Both Chains
echo "Instantiating the contract on Neutron and Osmosis..."

wasmd tx wasm instantiate $NEUTRON_CODE_ID '{"admin":"'"$NEUTRON_ADMIN_ADDRESS"'", "supported_tokens":["'"$NEUTRON_MOCK_ATOM"'"], "default_timeout_height":120, "supported_protocols":["swap"]}' --from $NEUTRON_KEY_NAME --chain-id $NEUTRON_CHAIN_ID --node $NEUTRON_NODE --label "Contract-Neutron" --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $NEUTRON_FEES --no-admin
wasmd tx wasm instantiate $OSMOSIS_CODE_ID '{"admin":"'"$OSMOSIS_ADMIN_ADDRESS"'", "supported_tokens":["'"$OSMOSIS_MOCK_BNGN"'"], "default_timeout_height":120, "supported_protocols":["swap"]}' --from $OSMOSIS_KEY_NAME --chain-id $OSMOSIS_CHAIN_ID --node $OSMOSIS_NODE --label "Contract-Osmosis" --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $OSMOSIS_FEES --no-admin

# Step 6: Query Contract Information to Get IBC Port ID
echo "Querying contract information to get IBC port IDs..."

NEUTRON_CONTRACT_ADDRESS=<neutron-contract-address>
OSMOSIS_CONTRACT_ADDRESS=<osmosis-contract-address>

NEUTRON_PORT_ID=$(wasmd query wasm contract $NEUTRON_CONTRACT_ADDRESS --chain-id $NEUTRON_CHAIN_ID --node $NEUTRON_NODE --output json | jq -r '.ibc_port_id')
OSMOSIS_PORT_ID=$(wasmd query wasm contract $OSMOSIS_CONTRACT_ADDRESS --chain-id $OSMOSIS_CHAIN_ID --node $OSMOSIS_NODE --output json | jq -r '.ibc_port_id')

echo "Neutron IBC Port ID: $NEUTRON_PORT_ID"
echo "Osmosis IBC Port ID: $OSMOSIS_PORT_ID"

# Step 7: Add IBC Connection Info to Contracts
echo "Adding IBC connection info to contracts..."

wasmd tx wasm execute $NEUTRON_CONTRACT_ADDRESS '{"add_ibc_connection": {"chain_id": "osmosis", "port": "'"$OSMOSIS_PORT_ID"'", "channel_id": "<channel-id>"}}' --from $NEUTRON_KEY_NAME --chain-id $NEUTRON_CHAIN_ID --node $NEUTRON_NODE --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $NEUTRON_FEES
wasmd tx wasm execute $OSMOSIS_CONTRACT_ADDRESS '{"add_ibc_connection": {"chain_id": "neutron", "port": "'"$NEUTRON_PORT_ID"'", "channel_id": "<channel-id>"}}' --from $OSMOSIS_KEY_NAME --chain-id $OSMOSIS_CHAIN_ID --node $OSMOSIS_NODE --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $OSMOSIS_FEES

# Step 8: Create Intent on Neutron
echo "Creating intent on Neutron..."

wasmd tx wasm execute $NEUTRON_CONTRACT_ADDRESS '{"create_intent": {"intent_type": {"Swap": {"output_tokens": [{"token": "'"$OSMOSIS_MOCK_BNGN"'", "is_native": false, "amount": "100"}]}}, "input_tokens": [{"token": "'"$NEUTRON_MOCK_ATOM"'", "is_native": false, "amount": "100"}], "target_chain_id": "osmosis", "timeout": null}}' --from $NEUTRON_KEY_NAME --chain-id $NEUTRON_CHAIN_ID --node $NEUTRON_NODE --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $NEUTRON_FEES

# Step 9: Create Intent on Neutron
echo "Creating intent on Neutron..."

wasmd tx wasm execute $NEUTRON_CONTRACT_ADDRESS '{"create_intent": {"intent_type": {"Swap": {"output_tokens": [{"token": "'"$OSMOSIS_MOCK_BNGN"'", "is_native": false, "amount": "100"}]}}, "input_tokens": [{"token": "'"$NEUTRON_MOCK_ATOM"'", "is_native": false, "amount": "100"}], "target_chain_id": "osmosis", "timeout": null, "tip": {"token": "'"$NEUTRON_MOCK_ATOM"'", "is_native": false, "amount": "10"}}}' --from $NEUTRON_KEY_NAME --chain-id $NEUTRON_CHAIN_ID --node $NEUTRON_NODE --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $NEUTRON_FEES

# Step 10: Fill Intent on Osmosis
echo "Filling intent on Osmosis..."

USER_ADDRESS=$(wasmd query auth account $(neutrond keys show $NEUTRON_KEY_NAME -a) --chain-id $NEUTRON_CHAIN_ID --node $NEUTRON_NODE --output json | jq -r '.address')
USER_NONCE=$(wasmd query wasm contract-state smart $NEUTRON_CONTRACT_ADDRESS '{"get_user_nonce": {"address": "'"$USER_ADDRESS"'"}}' --chain-id $NEUTRON_CHAIN_ID --node $NEUTRON_NODE --output json | jq -r '.data.nonce')
INTENT_ID="intent$(generate_intent_id $USER_ADDRESS $USER_NONCE)"

wasmd tx wasm execute $OSMOSIS_CONTRACT_ADDRESS '{"fill_intent": {"intent_id": "'"$INTENT_ID"'", "source_chain_id": "neutron", "intent_type": {"Swap": {"output_tokens": [{"token": "'"$OSMOSIS_MOCK_BNGN"'", "is_native": false, "amount": "100"}]}, "input_tokens": [{"token": "'"$NEUTRON_MOCK_ATOM"'", "is_native": false, "amount": "100"}]}}}' --from $OSMOSIS_KEY_NAME --chain-id $OSMOSIS_CHAIN_ID --node $OSMOSIS_NODE --gas auto --gas-adjustment $GAS_ADJUSTMENT --fees $OSMOSIS_FEES

echo "IBC relayer and contract interactions set up successfully!"