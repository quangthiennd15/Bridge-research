# Use chainbridge transfer token bettween Mumbai testnet (L1) and supernet (L2) (use polygon-edge)

### Step 1: Download ChainBridge contract CLI to deploy and interact with the contracts:

git clone -b v1.0.0 --depth 1 https://github.com/ChainSafe/chainbridge-deploy && cd chainbridge-deploy/cb-sol-cli && npm install && make install

### Step 2: Deploy contracts on Mumbai testnet:

cb-sol-cli deploy \
 --url $SRC_GATEWAY \
 --privateKey $SRC_PK \
 --gasPrice 10000000000 \
 --bridge --erc20Handler \
 --relayers $SRC_ADDR \
 --relayerThreshold 1 \
 --chainId 0

### Step 3: Configure contracts on Source:

cb-sol-cli bridge register-resource \
 --url $SRC_GATEWAY \
 --privateKey $SRC_PK \
 --gasPrice 10000000000 \
 --bridge $SRC_BRIDGE \
 --handler $SRC_HANDLER \
 --resourceId 0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00 \
 --targetContract $SRC_HANDLER

### Step 4: Deploy contracts on Supernet:

cb-sol-cli deploy \
 --url $DST_GATEWAY \
 --privateKey $DST_PK --gasPrice 10000000000 \
 --bridge --erc20 --erc20Handler \
 --relayers $DST_ADDR \
 --relayerThreshold 1 \
 --chainId 1

## Configure contracts on Supernet:

### Step 5: Registers the new token as a resource on the bridge

cb-sol-cli bridge register-resource \
 --url $DST_GATEWAY \
 --privateKey $DST_PK --gasPrice 10000000000 \
 --bridge $DST_BRIDGE \
 --handler $DST_HANDLER \
 --resourceId 0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00 \
 --targetContract $DST_TOKEN

### Step 6: Register the token as mintable/burnable on the bridge

cb-sol-cli bridge set-burn \
 --url $DST_GATEWAY \
 --privateKey $DST_PK --gasPrice 10000000000 \
 --bridge $DST_BRIDGE \
 --handler $DST_HANDLER \
 --tokenContract $DST_TOKEN

### Step 7: Give permission for the handler to mint new tokens

cb-sol-cli erc20 add-minter \
 --url $DST_GATEWAY \
 --privateKey $DST_PK --gasPrice 10000000000 \
 --minter $DST_HANDLER \
 --erc20Address $DST_TOKEN

## Create a Relayer

### Step 8: Build the relayer

git clone -b v1.1.1 --depth 1 https://github.com/ChainSafe/chainbridge \
&& cd chainbridge \
&& make build

### Step 9: Author a config

echo "{
\"chains\": [
{
\"name\": \"Mumbai testnet\",
\"type\": \"public blockchain\",
\"id\": \"0\",
\"endpoint\": \"$SRC_GATEWAY\",
\"from\": \"$SRC_ADDR\",
\"opts\": {
\"bridge\": \"$SRC_BRIDGE\",
\"erc20Handler\": \"$SRC_HANDLER\",
\"genericHandler\": \"$SRC_HANDLER\",
\"gasLimit\": \"1000000\",
\"maxGasPrice\": \"10000000000\"
}
},
{
\"name\": \"polygon edge\",
\"type\": \"private blockchain\",
\"id\": \"1\",
\"endpoint\": \"$DST_GATEWAY\",
\"from\": \"$DST_ADDR\",
\"opts\": {
\"bridge\": \"$DST_BRIDGE\",
\"erc20Handler\": \"$DST_HANDLER\",
\"genericHandler\": \"$DST_HANDLER\",
\"gasLimit\": \"1000000\",
\"maxGasPrice\": \"10000000000\"
}
}
]
}" >> config.json

### Step 10: Set up keys

./chainbridge accounts import --privateKey $SRC_PK

./chainbridge accounts import --privateKey $DST_PK

### Step 11: Start the relayer (in other terminal)

./chainbridge --config config.json --verbosity trace --latest

### Step 12: Approve the handler to spend tokens

cb-sol-cli --url $SRC_GATEWAY --privateKey $SRC_PK --gasPrice 10000000000 erc20 approve \
 --amount 100 \
 --erc20Address $SRC_TOKEN \
 --recipient $SRC_HANDLER

### Step 13: Execute a deposit

cb-sol-cli --url $SRC_GATEWAY --privateKey $SRC_PK --gasPrice 10000000000 erc20 deposit \
 --amount 100 \
 --dest 1 \
 --bridge $SRC_BRIDGE \
 --recipient $DST_ADDR \
 --resourceId $RESOURCE_ID

### Step 14: Approve the handler on the destination chain to move tokens

cb-sol-cli --url $DST_GATEWAY --privateKey $DST_PK --gasPrice 10000000000 erc20 approve \
 --amount 1000000000000000000 \
 --erc20Address $DST_TOKEN \
 --recipient $DST_HANDLER

### Step 15: Transfer the wrapped tokens back to the bridge

cb-sol-cli --url $DST_GATEWAY --privateKey $DST_PK --gasPrice 10000000000 erc20 deposit \
 --amount 1000000000000000000 \
 --dest 0 \
 --bridge $DST_BRIDGE \
 --recipient $SRC_ADDR \
 --resourceId $RESOURCE_ID
