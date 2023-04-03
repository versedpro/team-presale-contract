# AIF project tokens

This project contains token(ERC20), presale, timelock contracts

**Deployment**

Try running following tasks in order:

```shell
npx hardhat run --network goerli .\scripts\deploy.ts
npx hardhat verify --network goerli <TOKEN_DEPLOYED> <DEV_WALLET_ADDRESS>
```

Edit the `deploy_presale.ts` file with parameters like address of token deployed. Read commnets on that file.

```shell
npx hardhat run --network goerli .\scripts\deploy_presale.ts
npx hardhat verify --network goerli <CONTRACT_DEPLOYED> <contruct_params>
```

Transfer 5000,000 tokens to presale contract to lock on presale
