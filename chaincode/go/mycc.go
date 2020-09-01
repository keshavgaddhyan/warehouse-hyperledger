/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * The sample smart contract for documentation topic:
 * Writing Your First Blockchain Application
 */

package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"strconv"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Define the Smart Contract structure
type SimpleChaincode struct {
	contractapi.Contract
}

type Product struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Stage       string      `json:"status"`
	Signatures  []Signature `json:"signatures"`
	CreatedBy   string      `json:"createdBy"`
	MaxStage    string      `json:"maxStage"`
	Completed   bool        `json:"completed"`
}

type Signature struct {
	Name  string `json:"name"`
	Stage string `json:"stage"`
}

//QueryProduct get a product by id
func (t *SimpleChaincode) QueryProduct(ctx contractapi.TransactionContextInterface, productID string) (*Product, error) {

	productAsBytes, err := ctx.GetStub().GetState(productID)
	if err != nil {
		return nil, fmt.Errorf("failed to get product %s: %v", productID, err)
	}

	if productAsBytes == nil {
		return nil, fmt.Errorf("product %s does not exist", productID)
	}
	var product Product
	err = json.Unmarshal(productAsBytes, &product)
	if err != nil {
		return nil, err
	}
	if product.Signatures == nil {
		product.Signatures = []Signature{}
	}

	return &product, nil
}

func (t *SimpleChaincode) InitLedger(ctx contractapi.TransactionContextInterface) error {
	var product = Product{Name: "Test Product", Description: "Just a test product to make sure chaincode is running", Stage: "0", CreatedBy: "admin", MaxStage: "3"}
	productAsBytes, err := json.Marshal(product)
	err = ctx.GetStub().PutState("1", productAsBytes)
	if err != nil {
		return err
	}
	startingID := new(big.Int).SetInt64(2)
	startingIDAsByte := startingID.Bytes()
	return ctx.GetStub().PutState("MaxProductId", startingIDAsByte) //set starting id as 2
}

func (t *SimpleChaincode) CreateProduct(ctx contractapi.TransactionContextInterface, productName string, description string, maxStage string) (*Product, error) {
	canCreate, found, err := cid.GetAttributeValue(ctx.GetStub(), "canCreate")
	if err != nil {
		return nil, fmt.Errorf("Error when getting user rights")
	}
	if !found {
		return nil, fmt.Errorf("User does not have right to perform this action")
	}

	if canCreate != "true" {
		return nil, fmt.Errorf("User does not have right to perform this action")
	}

	username, found, _ := cid.GetAttributeValue(ctx.GetStub(), "username")
	var product = Product{Name: productName, Description: description, Stage: "0", CreatedBy: username, MaxStage: maxStage, Completed: false}

	productIdAsBytes, _ := ctx.GetStub().GetState("MaxProductId")
	productId := new(big.Int).SetBytes(productIdAsBytes)
	productIdAsString := productId.String()

	productAsBytes, _ := json.Marshal(product)

	ctx.GetStub().PutState(productIdAsString, productAsBytes)

	increment := new(big.Int).SetInt64(1)
	newProductId := new(big.Int).Add(productId, increment)
	err = ctx.GetStub().PutState("MaxProductId", newProductId.Bytes())
	if err != nil {
		return nil, fmt.Errorf("Failed to create product: %v", err)
	}
	return &product, nil
}

func (t *SimpleChaincode) SignProduct(ctx contractapi.TransactionContextInterface, productID string) (*Product, error) {

	productAsBytes, err := ctx.GetStub().GetState(productID)

	if err != nil {
		return nil, fmt.Errorf("Error while retrieving product")
	}

	product := Product{}
	username, _, _ := cid.GetAttributeValue(ctx.GetStub(), "username")
	json.Unmarshal(productAsBytes, &product)

	canSignStageAsBytes, found, _ := cid.GetAttributeValue(ctx.GetStub(), "canSignProduct")
	if !found {
		return nil, fmt.Errorf("User cannot sign product")
	}

	if product.Stage == product.MaxStage {
		return nil, fmt.Errorf("Cannot be signed.")
	}
	canSignStage, _ := strconv.Atoi(canSignStageAsBytes)
	currentStage, _ := strconv.Atoi(product.Stage)

	if canSignStage <= currentStage {
		return nil, fmt.Errorf("User does not have rights to sign.")
	}

	product.Stage = strconv.Itoa(currentStage + 1)
	if product.Signatures == nil {
		product.Signatures = []Signature{}
	}

	if product.Stage == product.MaxStage {
		product.Completed = true
	}
	var signature = Signature{Name: username, Stage: strconv.Itoa(currentStage)}
	product.Signatures = append(product.Signatures, signature)

	productAsBytes, _ = json.Marshal(product)
	err = ctx.GetStub().PutState(productID, productAsBytes)
	if err != nil {
		return nil, fmt.Errorf("Failed to sign product")
	}
	return &product, nil
}

func (t *SimpleChaincode) QueryAllProducts(ctx contractapi.TransactionContextInterface) ([]*Product, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("0", "999999999")
	if err != nil {
		return nil, fmt.Errorf("Failed to get products", err)
	}
	return buildJSON(resultsIterator)
}

func (t *SimpleChaincode) GetIncompleteProducts(ctx contractapi.TransactionContextInterface) ([]*Product, error) {
	var query string
	query = "{\"selector\":{\"completed\": false}}"
	resultsIterator, err := ctx.GetStub().GetQueryResult(query)
	if err != nil {
		return nil, fmt.Errorf("Failed to get products", err)
	}
	return buildJSON(resultsIterator)
}

func (t *SimpleChaincode) SearchProducts(ctx contractapi.TransactionContextInterface, searchTerm string) ([]*Product, error) {
	var query string
	query = fmt.Sprintf("{\"selector\":{\"name\": {\"$regex\":\"(?i)^.*?%s.*?$\"}}}", searchTerm)
	resultsIterator, err := ctx.GetStub().GetQueryResult(query)
	if err != nil {
		return nil, fmt.Errorf("Failed to get products", err)
	}
	return buildJSON(resultsIterator)
}

func (t *SimpleChaincode) GetMaxProductId(ctx contractapi.TransactionContextInterface) ([]byte, error) {
	return ctx.GetStub().GetState("MaxProductId")
}

func buildJSON(resultsIterator shim.StateQueryIteratorInterface) ([]*Product, error) {
	var products []*Product
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var product Product
		err = json.Unmarshal(queryResult.Value, &product)
		if product.Signatures == nil {
			product.Signatures = []Signature{}
		}
		if err != nil {
			return nil, err
		}
		products = append(products, &product)
	}
	return products, nil
}

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {
	chaincode, err := contractapi.NewChaincode(&SimpleChaincode{})
	if err != nil {
		log.Panicf("Error creating asset chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting asset chaincode: %v", err)
	}
}
