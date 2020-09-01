'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, enrollAdmin } = require('../utils-javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../utils-javascript/AppUtil.js');
const mspOrg1 = 'Org1MSP';

const walletPath = path.join(__dirname, 'wallet');

async function main() {

	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}

	console.log('*** application ending');

}

main();
