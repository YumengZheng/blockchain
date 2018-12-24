/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require("crypto-js/sha256");
const level = require("level");
const chainDB = "./chaindata";
const db = level(chainDB, { valueEncoding: "json" });

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    (this.hash = ""),
      (this.height = 0),
      (this.body = data),
      (this.time = 0),
      (this.previousBlockHash = "");
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
  // Add new block
  async addBlock(block) {
    let height = await this.getBlockHeight();
    let newBlock;
    if (!height) {
      newBlock = new Block("First block in the chain - Genesis block");
    } else {
      newBlock = block;
      let lastBlock = await this.getBlock(height - 1);
      newBlock.previousBlockHash = lastBlock.hash;
    }
    newBlock.height = height;
    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // testcode
    // newBlock.hash = (9471234712398472389476969986967).toString();
    await this.addLevelDBData(height, newBlock);
  }

  addLevelDBData(key, value) {
    return new Promise(function(resolve) {
      db.put(key, value, function(err) {
        if (err) return console.log("Block " + key + " submission failed", err);
        resolve(console.log(key, value));
      });
    });
  }

  // Get block height
  getBlockHeight() {
    let i = 0;
    return new Promise(function(resolve) {
      db.createReadStream()
        .on("data", function() {
          i++;
        })
        .on("error", function(err) {
          console.log(err);
        })
        .on("close", function() {
          resolve(i);
        });
    });
  }

  // get block
  getBlock(blockHeight) {
    return new Promise(resolve => {
      db.get(blockHeight, function(err, value) {
        if (err) return console.log("Not found!", err);
        resolve(value);
      });
    });
  }

  // validate block
  async validateBlock(blockHeight) {
    // get block object
    let block = await this.getBlock(blockHeight);
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = "";
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      console.log(
        "Block #" +
          blockHeight +
          " invalid hash:\n" +
          blockHash +
          "<>" +
          validBlockHash
      );
      return false;
    }
  }

  // Validate blockchain
  async validateChain() {
    let errorLog = [];
    let height = await this.getBlockHeight();
    for (var i = 0; i < height - 1; i++) {
      // validate block
      if (!(await this.validateBlock(i))) errorLog.push(i);
      // compare blocks hash link
      let block = await this.getBlock(i);
      let blockHash = block.hash;
      let nextBlock = await this.getBlock(i + 1);
      let previousHash = nextBlock.previousBlockHash;
      if (blockHash !== previousHash) {
        errorLog.push(i);
      }
    }
    if (errorLog.length > 0) {
      console.log("Block errors = " + errorLog.length);
      console.log("Blocks: " + errorLog);
    } else {
      console.log("No errors detected");
    }
  }
}

let blockchain = new Blockchain();
(async function processArray(array) {
  for (const i of array) {
    await blockchain.addBlock(new Block("test data " + i));
  }
  console.log("Done!");
})([0, 1, 2, 3, 4]);

// testcode
// blockchain.addBlock(new Block("test data fake"));

blockchain.validateChain();
