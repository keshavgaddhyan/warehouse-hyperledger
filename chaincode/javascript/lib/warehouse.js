/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class warehouse extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const items = [
            {
                name: 'pen',
                make: 'reynolds',
                model: 'speedGel',
                color: 'blue',
            },
            {
                name: 'bike',
                make: 'Ford',
                model: 'splendor',
                color: 'red',
            },
            {
                name: 'shoes',
                make: 'nike',
                model: 'airmax',
                color: 'black',
            },

        ];

        for (let i = 0; i < items.length; i++) {
            items[i].docType = 'item';
            await ctx.stub.putState('ITEM' + i, Buffer.from(JSON.stringify(items[i])));
            console.info('Added <--> ', items[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryItems(ctx, itemNumber) {
        const itemAsBytes = await ctx.stub.getState(itemNumber); // get the car from chaincode state
        if (!itemAsBytes || itemAsBytes.length === 0) {
            throw new Error(`${itemNumber} does not exist`);
        }
        console.log(itemAsBytes.toString());
        return itemAsBytes.toString();
    }

    async createItem(ctx, itemNumber, name, make, model, color) {
        console.info('============= START : Create Item ===========');

        const item = {
            color,
            docType: 'item',
            make,
            name,
            model,
        };

        await ctx.stub.putState(itemNumber, Buffer.from(JSON.stringify(item)));
        console.info('============= END : Create Item ===========');
    }

    async queryAllItems(ctx) {
        const startKey = 'ITEM0';
        const endKey = 'ITEM999';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async changeItemName(ctx, itemNumber, newName) {
        console.info('============= START : ChangeItemName ===========');

        const itemAsBytes = await ctx.stub.getState(itemNumber); // get the car from chaincode state
        if (!itemAsBytes || itemAsBytes.length === 0) {
            throw new Error(`${itemNumber} does not exist`);
        }
        const item = JSON.parse(itemAsBytes.toString());
        item.name = newName;

        await ctx.stub.putState(itemNumber, Buffer.from(JSON.stringify(item)));
        console.info('============= END : ChangeItemName ===========');
    }

}

module.exports = warehouse;