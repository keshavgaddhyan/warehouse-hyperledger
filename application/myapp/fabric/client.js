/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildWallet } = require('../../utils-javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';

const walletPath = path.resolve(__dirname, '..', '..', 'application-javascript','wallet');


class FabricClient{
    constructor(){}

    async listUsers(){
        const wallet = await buildWallet(Wallets, walletPath);
        let users = await wallet.list();
        return users;
    }

    async invoke(user, command, variables = []){
        //build a network profile
        const ccp = buildCCPOrg1();

        // Create a new file system based wallet for managing identities.
        const wallet = await buildWallet(Wallets, walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(user);
        if (userExists == undefined) {
            throw('An identity for the user "'+user+'" does not exist in the wallet');
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet: wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);

        // Submit the specified transaction.
        console.log('sending the command');
        const result = await contract.submitTransaction(command, ...variables);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();
        return JSON.parse(result.toString());
    }

    async query(user, command, variables = []){
        //build a network profile
        const ccp = buildCCPOrg1();

        // Create a new file system based wallet for managing identities.
        const wallet = await buildWallet(Wallets, walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.get(user);
        if (userExists == undefined) {
            throw('An identity for the user "'+user+'" does not exist in the wallet');
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet: wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);

        // Submit the specified transaction.
        console.log('sending the command ' + command);
        const result = await contract.evaluateTransaction(command, ...variables);
        // console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        // Disconnect from the gateway.
        await gateway.disconnect();
        return JSON.parse(result.toString());
    }
}

module.exports = FabricClient;
