# warehouse-hyperledger

This repository creates a fabric network with 2 organizations to demonstrate a simple warehouse.The first organization has 2 peers and the second organization has 3 peers. The idea behind this that peers of org2 are QA people and any transaction of creating a new item in the warehouse has to be approved (Endorsed) by org2 peers so as it add it to the ledger (Warehouse)

# Running the Code

1. Firstly, Install the nescessary dependecies and download hyperledger-fabric.

2. To bring up the network us the command:-

```bash
./network.sh up createChannel
```

3. Deploy the chaincode

```bash
./network.sh deployCC
```

This should start the network and install the javascript chaincode on all the peers. You can now make the transactions as required.
