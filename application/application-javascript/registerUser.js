'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser } = require('../utils-javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../utils-javascript/AppUtil.js');
const mspOrg1 = 'Org1MSP';

const walletPath = path.join(__dirname, 'wallet');

let args = process.argv.slice(2);
if (args.length < 2){
    console.error('Invalid number of arguments, expecting 2.');
    process.exit(1);
}
let username = args[0];
let role = args[1].toLowerCase();

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
        let attrs = [{name: 'username', value: username, ecert: false}];
        let attr_reqs = [{name: 'username', optional: false}];
        switch(role){
        case 'creator':
            attrs.push({name: 'canCreate', value: 'true', ecert: true});
            attr_reqs.push({name: 'canCreate', optional: true});
            break;
        case 'manager':
            let stage = 0;
            if (args.length < 3){
                stage = 3;
            }else{
                stage = args[2];
            }
            attrs.push({name: 'canSignProduct', value: stage, ecert: true});
            attr_reqs.push({name: 'canSignProduct', optional: true});
            break;
        default:
            console.error('Unexpected role');
            process.exit(1);
        }

        console.log("Registering new user");
        await registerAndEnrollUser(caClient, wallet, mspOrg1, username, 'org1.department1', attrs, attr_reqs);
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}

	console.log('*** application ending');

}

main();
