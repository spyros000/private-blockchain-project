/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persistent storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialize the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            //let currentHeight = this.height;
            let currentLength = this.chain.length;
            //console.log(`chain length: ${this.chain.length}`);
            block.height = currentLength;
            //console.log(block.height);
            block.time = new Date().getTime().toString().slice(0,-3);
            //console.log("Check #1");
            if (currentLength === 0) {
                //console.log("Check #2");
                block.previousBlockHash = "";
            } else {
                //console.log("Check #3");
                let previousBlock = this.chain[currentLength - 1];
                //console.log(currentLength);
                //console.log("Check #4");
                //console.log(`previous block height: ${previousBlock.height}`);
                block.previousBlockHash = previousBlock.hash;
                //console.log(previousBlock.hash);
            }
            //console.log("Check #5");
            block.hash = SHA256(JSON.stringify(block)).toString();
            //console.log("Check #6");
            //console.log(SHA256(JSON.stringify(block)));
            self.chain.push(block);
            //console.log("Check #7");
            self.height += 1;
            //console.log("Check #8");
            if(resolve) {
                resolve(block);
            } else{ reject(new Error("The block is rejected."));}
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submitting your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve, reject) => {
            let message = `${address}:${new Date().getTime().toString()}:starRegistry`;
            if (resolve) {
                resolve(message);         
            } else {
                reject(new Error("Something went wrong."));
            }
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Verify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            //console.log(message.split(':')[1]);
            //let messageArray = Date.parse(message.split(':'));
            //console.log(`message array: ${messageArray}`);
            let messageTime = parseInt(message.split(':')[1]);
            //console.log(`messageTime: ${typeof messageTime}, ${messageTime}`);
            let currentTime = new Date().getTime();
            //console.log(`currentTime: ${typeof currentTime}, ${currentTime}`);
            let messageVerified = bitcoinMessage.verify(message, address, signature);
            //console.log(`Message verified: ${messageVerified}`);
            let minutesPassed = currentTime - messageTime;
            //console.log(minutesPassed);
            //300000
            if( (currentTime - messageTime) < 10000000 && messageVerified) {
                
                //console.log("True");
                /*Construct the string to use as data for hte block's body property 
                 * { owner: address, star: { "dec": "68° 52' 56.9", "ra": "16h 29m 1.0s", "story": "Testing the story 4"} }
                */
                //console.log(star);
                let blockData = `{"owner": ${message.split(':')[0]}, "star": ${JSON.stringify(star)}}}`;
                //console.log(blockData);
                let block = new BlockClass.Block(blockData);
                //console.log(`Created block: hash: ${block.hash}, height: ${block.height}, body: ${block.body}, time: ${block.time}, previousBlockHash: ${block.previousBlockHash}`);
                self._addBlock(block);
                //resolve(this.chain[this.chain.length]);
                return resolve(block);
            } 
            else {
                //console.log("False");
                reject("Five (5) minutes have elapsed since the ownership request or invalid data.");
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        console.log("Check #1");
        return new Promise( (resolve, reject) => {
            console.log(hash);
            let chainArrayLength = self.chain.length;
            let i = 0;
            let result;
            for ( ; i < chainArrayLength; i++) {
                if ( self.chain[i].hash === hash ) {
                    result = self.chain[i];
                    console.log("Check #Found");
                    return resolve(result);
                }
            }
            /*
            if (result) {
                return resolve(result);
            } else {
                //console.log("Check #Error");
                reject(new Error("No block returned"));
            }
            */
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of "Star" objects existing in the chain 
     * and belong to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        //console.log("Check #1");
        let self = this;
        //let arrayOfBlocks = [];
        let arrayOfStars = [];
        return new Promise((resolve, reject) => {
            //console.log("Check #2");
            let i = 0;
            let chainArray = this.chain;
            let chainArrayLength = chainArray.length;
            for (; i < chainArrayLength; i++) {
                //console.log(`Iteration ${i}`);
                //console.log(`current block: ${chainArray[i].height}`);
                let aBlock = chainArray[i];
                //console.log(`the current block body is: ${aBlock.body}`);
                //console.log(`body ascii: ${hex2ascii(aBlock.body)}`);
                if(aBlock.height !== 0) {
                    //console.log(`block's body to ascii is ${hex2ascii(aBlock.body)}`);
                    //console.log(`block owner: ${hex2ascii(aBlock.body).owner}`);
                    //console.log(`block owner (parsed body) ${JSON.parse(hex2ascii(aBlock.body)).owner}`);
                    let aBlockData = JSON.parse(hex2ascii(aBlock.body));
                    //console.log(`The block's data is: ${aBlockData}`);
                    //console.log(`${typeof aBlockData} ${aBlockData.constructor}`);
                    //let aBlockAddress =  aBlockData.split(',')[0].slice(8);
                    let aBlockAddress = aBlockData.slice(10, 44);
                    //console.log(`the block's address is: ${aBlockAddress}`);
                    if(aBlockAddress === address) {
                        arrayOfStars.push(aBlockData.slice(54));
                    }
                }
            }
            //console.log(`Array of blocks: ${arrayOfStars}`);
            if(arrayOfStars.length > 0) {
                return resolve(arrayOfStars);
            }
            else { return reject(new Error("No stars registered with this address."));}
            
        });

    }


    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the Block's hash with the previousBlockHash
     */
    validateChain() {
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            self.forEach( (element) => {
                if ( element.validate() ) {
                    if(element.hash !== self.chain[element.height + 1].previousBlockHash) {
                        errorLog.push(new Error(element.blockHeight));
                    }
                }
            } );
        });
    }

}

module.exports.Blockchain = Blockchain;   