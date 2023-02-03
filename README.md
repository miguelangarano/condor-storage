# Condor File Storage

Condor File Storage is a web app that allows the users to store their files in IPFS and creating a smart contract that saves in the Ethereum blockchain the metadata of the uploaded file and bounds it to a wallet through a smart contract created with Solidity.

## Setup

As this is development in progress app, you must install Truffle and Ganache in your computer.

- You must fill all environment variables (there's a .env.example file which you can use as example to create a real .env file)
- You must run Ganache
- You must have a browser wallet with ETH
- You must have a way to connect to a IPFS node like Infura
- Just run "yarn" 
- Then "truffle migrate --reset --config truffle-config.cjs"
- And finally "yarn dev"

This way you will be able to instsall dependencies, migrate the smart contracts and run the app.

Happy File uploading :)

## Deploy

If you want to deploy this app you can add a new network configuration inside truffle-config.cjs file
You can have a look of a deployed app here: [Condor File Storage Live App](https://main--tiny-dolphin-5ebbd0.netlify.app)

This is already configured for using the Infura Goerli Testnet, but you can add whatever ETH testnet you want, you just have to update to valid credentials on the .env file for connecting to a ETH Testnet or ETH Mainnet through Infura or other service.

You can also change the CONDOR_INFURA_IPFS_URL variable within .env for the name you want (obviously you will have to change the name inside the files this variable is being used) and it's value for connecting to your own IPFS dedicated gateway.

## Using the live version

For using the live version the only thing you need is accessing from a Ethereum compatible browser or having a wallet like metamask as a browser plugin.
- You must set the [Goerli testnet](https://goerli.net/) in your wallet ([Goerli settings](https://chainlist.org/chain/5))
- And for getting ETH go to [Goerli Faucet](https://goerlifaucet.com/), register and put your wallet address to get your testnet ETH.
