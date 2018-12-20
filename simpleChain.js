/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require("crypto-js/sha256");
const level = require("level");
const chainDB = "./chaindata";
const db = level(chainDB, { valueEncoding: "json" });

function addLevelDBData(key, value) {
  db.put(key, value, function(err) {
    if (err) return console.log("Block " + key + " submission failed", err);
    console.log(key, value);
  });
}

function addDataToLevelDB(value) {
  let i = 0;
  db.createReadStream()
    .on("data", function(data) {
      i++;
    })
    .on("error", function(err) {
      return console.log("Unable to read data stream!", err);
    })
    .on("close", function() {
      console.log("Block #" + i);
      addLevelDBData(i, value);
    });
}

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
  constructor() {
    // addDataToLevelDB(new Block("First block in the chain - Genesis block"));
  }

  // Add new block
  async addBlock(newBlock) {
    let height = await this.getBlockHeight();
    if (!height) {
      await addDataToLevelDB(
        new Block("First block in the chain - Genesis block")
      );
    } else {
      newBlock.height = height;
      newBlock.time = new Date()
        .getTime()
        .toString()
        .slice(0, -3);
      let data = await this.getBlock(height);
      newBlock.previousBlockHash = data.hash;
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
      await addDataToLevelDB(newBlock);
    }
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
  validateBlock(blockHeight) {
    // get block object
    let block = this.getBlock(blockHeight);
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
  validateChain() {
    let errorLog = [];
    for (var i = 0; i < this.chain.length - 1; i++) {
      // validate block
      if (!this.validateBlock(i)) errorLog.push(i);
      // compare blocks hash link
      let blockHash = this.chain[i].hash;
      let previousHash = this.chain[i + 1].previousBlockHash;
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
