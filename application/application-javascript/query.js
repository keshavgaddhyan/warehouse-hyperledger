// The first argument in the command is the user to be used
// The second argument is the command to be sent to the chaincode
// The  rest are variables of the said command 
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient } = require('../utils-javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../utils-javascript/AppUtil.js');

let args = process.argv.slice(2);
let user = args[0];
let command = args[1];
let variables = args.slice(2);

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';

const walletPath = path.join(__dirname, 'wallet');

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		const gateway = new Gateway();

		try {

			await gateway.connect(ccp, {
				wallet,
				identity: user,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			console.log('\n--> Evaluate Transaction: '+command);
			console.log(variables)
			let result = await contract.evaluateTransaction(command, ...variables);
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

		} finally {
			// Disconnect from the gateway when the application is closing
			// This will close all connections to the network
			gateway.disconnect();
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}

	console.log('*** application ending');

}

main();