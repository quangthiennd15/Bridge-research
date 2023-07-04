## 1. Công cụ sử dụng:

- WSL (Windows Subsystem for Linux) là một tính năng tùy chọn trên Windows 10 và 11 cho phép người dùng chạy hệ điều hành Linux ngay trên Windows mà không cần cài đặt một máy ảo hay khởi động lại hệ thống. Nó cung cấp một môi trường đầy đủ cho các câu lệnh và công cụ của Linux.

- Window terminal: chạy các câu lệnh Linux

- Truffle và Web3js: được sử dụng để mint và kiểm tra số dư ERC20 hay NFT cho cả Rootchain và Childchain

- Metamask: Kiểm soát các tài khoản và check số dư nhanh hơn.

## 2. Cách cài đặt

### Step 1: Download binary polygon-edge from source:

https://github.com/0xPolygon/polygon-edge/releases

### Step 2: Generate New Account Secrets (4 node)

./polygon-edge polybft-secrets --insecure --data-dir test-chain- --num 4

### Step 3: Specify Validator Set & Generate Genesis

./polygon-edge genesis --validators-path ./ --block-gas-limit 10000000 --epoch-size 150 --premine 0x0000000000000000000000000000000000000000,_rootchain_acc_ --reward-wallet _rootchain_acc_ --native-token-config "Mintable Edge Coin:MEC:18:true:_rootchain_acc_" --bridge-allow-list-admin _rootchain_acc_ --bridge-block-list-admin _rootchain_acc_

### Step 4: Deploy StakeManager contract

./polygon-edge polybft stake-manager-deploy \
--private-key _private_key_rootchain_acc_ \
--genesis ./genesis.json \
--jsonrpc _rpc_rootchain_ \
--stake-token _add_token_on_rootchain_

### Step 5: Deploy rootchain contracts

./polygon-edge rootchain deploy --deployer-key _private_key_rootchain_acc_ --genesis ./genesis.json --json-rpc _rpc_rootchain_ --stake-token _add_token_on_rootchain_ --stake-manager _address of stakemanager in file genesis_

### Step 6: Funding validators on the rootchain

./polygon-edge rootchain fund --addresses _add of 4 node_ --amounts 10000000,10000000,10000000,10000000 --json-rpc _rpc_rootchain_ --mint --private-key _private_key_rootchain_acc_ --stake-token _add_token_on_rootchain_

### Step 7: Allowlist validators on the rootchain

./polygon-edge polybft whitelist-validators --addresses _add of 4 node_ --jsonrpc _rpc_rootchain_ --private-key _private_key_rootchain_acc_ --supernet-manager _address of supernetmanager in file genesis_

### Step 8: Register validators on the rootchain

./polygon-edge polybft register-validator --jsonrpc _rpc_rootchain_ --supernet-manager _address of supernetmanager in file genesis_ --data-dir ./test-chain-1

./polygon-edge polybft register-validator --jsonrpc _rpc_rootchain_ --supernet-manager _address of supernetmanager in file genesis_ --data-dir ./test-chain-2

./polygon-edge polybft register-validator --jsonrpc _rpc_rootchain_ --supernet-manager _address of supernetmanager in file genesis_ --data-dir ./test-chain-3

./polygon-edge polybft register-validator --jsonrpc _rpc_rootchain_ --supernet-manager _address of supernetmanager in file genesis_ --data-dir ./test-chain-4

### Step 9: Initial staking on the rootchain

./polygon-edge polybft stake --jsonrpc _rpc_rootchain_ --amount 1000000 --stake-manager _address of stakemanager in file genesis_ --stake-token _add_token_on_rootchain_ --supernet-id 1 --data-dir ./test-chain-1

./polygon-edge polybft stake --jsonrpc _rpc_rootchain_ --amount 1000000 --stake-manager _address of stakemanager in file genesis_ --stake-token _add_token_on_rootchain_ --supernet-id 1 --data-dir ./test-chain-2

./polygon-edge polybft stake --jsonrpc _rpc_rootchain_ --amount 1000000 --stake-manager _address of stakemanager in file genesis_ --stake-token _add_token_on_rootchain_ --supernet-id 1 --data-dir ./test-chain-3

./polygon-edge polybft stake --jsonrpc _rpc_rootchain_ --amount 1000000 --stake-manager _address of stakemanager in file genesis_ --stake-token _add_token_on_rootchain_ --supernet-id 1 --data-dir ./test-chain-4

### Step 10: Finalize validator set on the rootchain

./polygon-edge polybft supernet --enable-staking --finalize-genesis-set --jsonrpc _rpc_rootchain_ --private-key _private_key_rootchain_acc_ --genesis ./genesis.json --supernet-manager _address of supernetmanager in file genesis_ --stake-manager _address of stakemanager in file genesis_

# Bridge

## ERC20

### Deposit (from L1 -> L2)

./polygon-edge bridge deposit-erc20 \
 --sender-key _private_key_rootchain_acc_ \
 --receivers _rootchain_acc | add_node1_ \
 --amounts 10000000000000000000000 \
 --root-token _add_token_on_rootchain_ \
 --root-predicate _add_ERC20prediacte_in_file_genesis_ \
 --json-rpc _rpc_rootchain_\
 --minter-key _private_key_rootchain_acc_

### Withdraw

./polygon-edge bridge withdraw-erc20 \
 --sender-key _private_key_rootchain_acc_ \
 --receivers _rootchain_acc_ \
 --amounts 100\
 --child-predicate 0x0000000000000000000000000000000000001004 \
 --child-token _add return after deposit_ \
 --json-rpc _child_childchain_

### Exit

./polygon-edge bridge exit \
 --sender-key _private_key_rootchain_acc_\
 --exit-helper _exit_helper_add in file genesis_ \
 --exit-id _exit_event_id in file genesis_ \
 --root-json-rpc _rpc_rootchain_ \
 --child-json-rpc _child_childchain_

## ERC721

### Deposit

./polygon-edge bridge deposit-erc721 --root-token _add_NFT_on_rootchain_ --root-predicate _add_ERC721prediacte_in_file_genesis_ --sender-key _private_key_rootchain_acc_ --json-rpc _rpc_rootchain_ --token-ids _NFT_id_ --receivers _rootchain_acc_

### Withdraw

./polygon-edge bridge withdraw-erc721 --child-token _add return after deposit_ 0x0000000000000000000000000000000000001006 --json-rpc _child_childchain_ --receivers _rootchain_acc_ --sender-key _private_key_rootchain_acc_ --token-ids _NFT_id_

### Exit

./polygon-edge bridge exit --child-json-rpc _child_childchain_ --exit-helper _exit_helper_add in file genesis_ --exit-id _add id after deposit_ --root-json-rpc*rpc_rootchain* --sender-key _private_key_rootchain_acc_
