

=============================1===========================
Public key (address) = 0xE08B3Ee196a1894334Cfa9f5B731D18b7886E41C
BLS Public key       = 2982c79f5bb53aef0caeaffc328e261bad3a0da7ae0ae00f84538e7e5efbac182d4347a1bea76a60f3eb6404827ab00f3335982ba05410fa8d0bd2cd182d0bfa2e932c90425afb76fae2d4448c47256db44f8842c0b4045b1c3d507367fea068220d169ee2a2aab7b67ef9e7611483c061d5983f0ea7c661555aed59c860387f
Node ID              = 16Uiu2HAkvhidihVaySSfevArjvok7ehtH3P65MBLcW7cy1eG7YJS

=============================2===========================
Public key (address) = 0xDF4c520F2B71F7e01f863C56018b3B19c3A8C665
BLS Public key       = 266e3fb086c5b950265a140fb070b0421d4a965211a04e472081d2aa939c5b10222b6a40b32ec8328bc2155d1ff58856dc9a4f39707cb3b038ca3eee53e52b630abbe806946dc4340945ad741582f38231ee46a27bc4b4fae96ba1d5eae0028f01570c1e90e716faf04940829ed7702e746ed9700ca0e3d002218117d7e90206
Node ID              = 16Uiu2HAmKV7fuKwj67kBWZ6JzTAgDbxReMtziDy5BCCQ1kmN82SG

=============================3===========================
Public key (address) = 0xDE89B82A20F1AA011eFB6B63417D46ac2c5ACedC
BLS Public key       = 1d595e4951b6ad25db35f1c1cce8f35bd077b2a9f6f94df1abaf94977adb22800c3980cf3151b68fa82658cff724f2e91422482e1da2e5b8af36375d73e98808192b00f2d796e22f140d7fae8e2522897a33a705025673e47451b1628c4cfbe521448ffa0049448a534a98616f91277c60454235383c86c2c2179191fc0658d0
Node ID              = 16Uiu2HAm1KSj2wnV6enQrL6pFZGHo3NMLNjceyjfEFEfZrC1kzSG

=============================4===========================
Public key (address) = 0xAA190696329Bd3c74f1dF074bbDcC025181bc063
BLS Public key       = 0d2f36335d3798b981a05da3e246d454053b03051e6fc06e181b68660b10c0d408cd3663ed9496a3642f784c859e745e9ea29430026514f04d85159c09dc1e0e0630ac529a7d3e3e2fe52d49c0aaae0f9f4c5718ba1a3fc8a9974d233b38ce8e2fdd4b9172e0912017ec3c2563b8de9d1d54cc487f0e1e678a432c200c2d618d
Node ID              = 16Uiu2HAmJuztPiatQadSx82UtHbV8bYDJ2Zj6R51e58vhxdHBeGm







./polygon-edge genesis --block-gas-limit 10000000 --epoch-size 10 \
    --validators-path ./ --validators-prefix test-chain- \
    --consensus polybft \
    --reward-wallet 0xE08B3Ee196a1894334Cfa9f5B731D18b7886E41C:1000000 \
    --transactions-allow-list-admin 0xE08B3Ee196a1894334Cfa9f5B731D18b7886E41C,0xDF4c520F2B71F7e01f863C56018b3B19c3A8C665 \
    --transactions-allow-list-enabled 0xE08B3Ee196a1894334Cfa9f5B731D18b7886E41C,0xDF4c520F2B71F7e01f863C56018b3B19c3A8C665





polygon-edge rootchain fund --data-dir ./test-chain-1 --amount 1000000000000000000 --native-root-token 0x4F2492ACC4Bd37F41A22E09E400669a5678b675f






polygon-edge polybft whitelist-validators \
  --private-key aa75e9a7d427efc732f8e4f1a5b7646adcc61fd5bae40f80d13c8419c9f43d6d \
  --addresses 0xE08B3Ee196a1894334Cfa9f5B731D18b7886E41C,0xDF4c520F2B71F7e01f863C56018b3B19c3A8C665 \
  --supernet-manager 0x817d3FaaEa8eB495fA74a90a5d2897cFcc94f3D7 --jsonrpc http://127.0.0.1:8545



polygon-edge polybft register-validator --data-dir ./test-chain-1 \
--supernet-manager 0x817d3FaaEa8eB495fA74a90a5d2897cFcc94f3D7 --jsonrpc http://127.0.0.1:8545




polygon-edge polybft stake --data-dir ./test-chain-1 --chain-id 1 --amount 1000000000000000000 \
--stake-manager 0xdeAe3cc8C1794E5265ED92EF0A95929f50b08e3C --native-root-token 0x4F2492ACC4Bd37F41A22E09E400669a5678b675f --jsonrpc http://127.0.0.1:8545


polygon-edge polybft supernet --private-key aa75e9a7d427efc732f8e4f1a5b7646adcc61fd5bae40f80d13c8419c9f43d6d --genesis ./genesis.json --supernet-manager 0x817d3FaaEa8eB495fA74a90a5d2897cFcc94f3D7 --stake-manager 0xdeAe3cc8C1794E5265ED92EF0A95929f50b08e3C --finalize-genesis-set --enable-staking --jsonrpc http://127.0.0.1:8545