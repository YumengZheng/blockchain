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
  constructor(app) {
    this.app = app;
    this.addInitialBlock();
    this.getBlockByIndex();
    this.postNewBlock();
  }

  async addInitialBlock() {
    const newBlock = new Block("First block in the chain - Genesis block");
    newBlock.height = 0;
    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    newBlock.previousBlockHash = "";
    await this.addLevelDBData(0, newBlock);
  }

  postNewBlock() {
    this.app.post("/api/block", async (req, res) => {
      const data = req.body.data;
      if (data !== undefined) {
        const newBlock = new Block(data);
        const height = await this.getBlockHeight();
        const lastBlock = await this.getBlock(height - 1);
        newBlock.previousBlockHash = lastBlock.hash;
        newBlock.time = new Date()
          .getTime()
          .toString()
          .slice(0, -3);
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
        newBlock.height = height;
        await this.addLevelDBData(height, newBlock);
        res.send(newBlock);
      } else {
        res.send("please provide content");
      }
    });
  }

  getBlockByIndex() {
    this.app.get("/api/block/:index", async (req, res) => {
      const index = req.params.index;
      await db.get(index, function(err, value) {
        if (err) {
          res.send("something went wrong");
          return console.log("Not found!", err);
        }
        const block = value;
        res.send(block);
      });
    });
  }

  addLevelDBData(key, value) {
    return new Promise(function(resolve) {
      db.put(key, value, function(err) {
        if (err) {
          res.send("something went wrong");
          return console.log("Block " + key + " submission failed", err);
        }
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
    const block = await this.getBlock(blockHeight);
    // get block hash
    const blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = "";
    // generate block hash
    const validBlockHash = SHA256(JSON.stringify(block)).toString();
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
    const errorLog = [];
    const height = await this.getBlockHeight();
    for (var i = 0; i < height - 1; i++) {
      // validate block
      if (!(await this.validateBlock(i))) errorLog.push(i);
      // compare blocks hash link
      const block = await this.getBlock(i);
      const blockHash = block.hash;
      const nextBlock = await this.getBlock(i + 1);
      const previousHash = nextBlock.previousBlockHash;
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

module.exports = app => {
  return new Blockchain(app);
};
