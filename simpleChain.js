/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require("crypto-js/sha256");
const level = require("level");
const chainDB = "./chaindata";
const db = level(chainDB);

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

function getLevelDBHeight(value) {
  let i = 0;
  return new Promise(function(resolve) {
    db.createReadStream()
      .on("data", function(data) {
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
    this.chain = [];
    addDataToLevelDB(new Block("First block in the chain - Genesis block"));
  }

  // Add new block
  addBlock(newBlock) {
    // Block height
    newBlock.height = this.chain.length;
    // UTC timestamp
    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);
    // previous block hash
    if (this.chain.length > 0) {
      newBlock.previousBlockHash = this.chain[this.chain.length - 1].hash;
    }
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Adding block object to chain
    addDataToLevelDB(newBlock);
  }

  // Get block height
  getBlockHeight(key) {
    let i = 0;
    return new Promise(function(resolve) {
      db.createReadStream()
        .on("data", function(data) {
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
    // return object as a single string
    return new Promise(resolve => {
      db.get(key, function(err, value) {
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
