
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const dotenv = require("dotenv");
const app = express();

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


const db_name = path.join(__dirname, "data", "apptest.db");
const db = new sqlite3.Database(db_name, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful connection to the database 'apptest.db'");
});

const sql_create = ` CREATE TABLE IF NOT EXISTS database (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,

    StateTxn VARCHAR(100) NOT NULL,
    TypeOfBridge VARCHAR(100) NOT NULL,

    Sender VARCHAR(100) NOT NULL,
    Receiver VARCHAR(100) NOT NULL,

    Amount VARCHAR(100) NOT NULL,

    Token VARCHAR(100) NOT NULL

  );`;



// User
app.get("/bridge", (req, res) => {
    db.run(sql_create, (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.send("Successful creation of the database table");
    });
  });


// Get information of user with ID transaction
app.get("/bridge/getinforid/:id", (req, res) => {
    const id = req.params.id; 
    const query = `SELECT * FROM database WHERE ID = ?`;
    db.get(query,[id], (err, row) => {
      if (err) {
        console.error("Error querying the database:", err);
        return;
      }
  
      if (!row) {
        console.error("No matching record found in the database.");
        return;
      }
      res.send(row);
    });
  });


// Get information of user with address sender
app.get("/bridge/getinforaddress/:address", (req, res) => {
    const address = req.params.address; 
    const query = `SELECT * FROM database WHERE Sender = ?`;
    db.all(query,[address], (err, row) => {
      if (err) {
        console.error("Error querying the database:", err);
        return;
      }
  
      if (!row) {
        console.error("No matching record found in the database.");
        return;
      }
      res.send(row);
    });
  });


// ============================= NATIVE EDGE BRIDGE =============================================
const { exec } = require("child_process");
// Deposit Funtion
app.post("/nativebridge/deposit", (req, res) => {
    var errors=[];

    if (!req.body.AccRootchain){
        errors.push("No account in rootchain specified");
    }
    if (!req.body.PKRootchain){
        errors.push("No Private key of account in rootchain specified");
    }
    if (!req.body.AccChildchain){
        errors.push("No account in childchain specified");
    }
    if (!req.body.AddRootToken){
        errors.push("No address of token in rootchain specified");
    }

    if (!req.body.amount){
        errors.push("Amount must greater than 0");
    }
 
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }

    const sql_insert = `INSERT INTO database (StateTxn, TypeOfBridge, Sender, Receiver, Amount, Token) VALUES (?,?,?,?,?,?)`;

    const command = `./polygon-edge bridge deposit-erc20 --sender-key ${req.body.PKRootchain} --receivers ${req.body.AccChildchain} --amounts ${req.body.amount} --root-token ${req.body.AddRootToken} --root-predicate 0xb89D097Bf74AC754286087C91882905Eb5fe9F2d --json-rpc http://18.224.19.137:8545`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        db.run(sql_insert, ['Fail', 'Native bridge', `${req.body.AccRootchain}`, `${req.body.AccChildchain}`, `${req.body.amount}`, `${req.body.AddRootToken}`], function(err) {
            res.status(500).send(`ID Transaction: ${this.lastID} \n Command execution error: ${error.message}`);
      })
        return;
      }

      if (stderr) {
            db.run(sql_insert, ['Fail', 'Native bridge', `${req.body.AccRootchain}`, `${req.body.AccChildchain}`, `${req.body.amount}`, `${req.body.AddRootToken}`], function(err) {
                res.status(500).send(`ID Transaction: ${this.lastID} \n Command execution error: ${stderr}`);
          })
        return;
      }

      db.run(sql_insert, ['Successfull', 'Native bridge', `${req.body.AccRootchain}`, `${req.body.AccChildchain}`, `${req.body.amount}`, `${req.body.AddRootToken}`], function(err) {
            res.status(200).send(`ID Transaction: ${this.lastID} \n Sender: ${req.body.AccRootchain} \n Receiver: ${req.body.AccChildchain} \n Amount: ${req.body.amount} \n Token: ${req.body.AddRootToken}`);
      })
      
  });
});

// Withdraw Function
app.post("/nativebridge/withdraw", (req, res) => {
    var errors=[];
    if (!req.body.AccRootchain){
        errors.push("No account in rootchain specified");
    }
    if (!req.body.PKRootchain){
        errors.push("No Private key of account in rootchain specified");
    }
    if (!req.body.AccChildchain){
        errors.push("No account in childchain specified");
    }
    if (!req.body.AddChildToken){
        errors.push("No address of token in childchain specified");
    }
    if (!req.body.amount){
        errors.push("Amount must greater than 0");
    }

    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }

    const sql_insert = `INSERT INTO database (StateTxn, TypeOfBridge, Sender, Receiver, Amount, Token) VALUES (?,?,?,?,?,?)`;


    const command = `./polygon-edge bridge withdraw-erc20 --sender-key ${req.body.PKRootchain} --receivers ${req.body.AccRootchain} --amounts ${req.body.amount} --child-predicate 0x0000000000000000000000000000000000001004 --child-token ${req.body.AddChildToken} --json-rpc http://localhost:10001`;

    exec(command, (error, stdout, stderr) => {

                if (error) {
                    db.run(sql_insert, ['Fail', 'Native bridge', `${req.body.AccChildchain}`, `${req.body.AccRootchain}`, `${req.body.amount}`, `${req.body.AddChildToken}`], function(err) {
                        res.status(500).send(`ID Transaction: ${this.lastID} \n Command execution error: ${error.message}`);
                })
                    return;
                }
            
                if (stderr) {
                        db.run(sql_insert, ['Fail', 'Native bridge', `${req.body.AccChildchain}`, `${req.body.AccRootchain}`, `${req.body.amount}`, `${req.body.AddChildToken}`], function(err) {
                            res.status(500).send(`ID Transaction: ${this.lastID} \n Command execution error: ${error.message}`);
                    })
                    return;
                }
                
                const lines = stdout.split("\n");
                let exitID = "";
                for (const line of lines) {
                    if (line.includes("Exit Event IDs")) {
                        exitID = line.split(" ")[13]+ "";
                        break;
                    }
                }
             
                const command_exit = `./polygon-edge bridge exit --sender-key ${req.body.PKRootchain} --exit-helper 0xc491BCBAfB3aF71C962DB35d91FC4858680D4D84 --exit-id ${exitID} --root-json-rpc http://18.224.19.137:8545 --child-json-rpc http://localhost:10001`;

                setTimeout(() => {
                    exec(command_exit, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Command execution error: ${error.message}`);
                            res.send(`Withdraw failed!!! Command execution error: ${error.message}`);
                            db.run(sql_insert, ['Fail', 'Native bridge', `${req.body.AccChildchain}`, `${req.body.AccRootchain}`, `${req.body.amount}`, `${req.body.AddChildToken}`]);
            
                            return;
                        }
            
                        if (stderr) {
                            console.error(`Command execution stderr: ${stderr}`);
                            db.run(sql_insert, ['Fail', 'Native bridge', `${req.body.AccChildchain}`, `${req.body.AccRootchain}`, `${req.body.amount}`, `${req.body.AddChildToken}`])
                            return;
                        }
                        db.run(sql_insert, ['Successfull', 'Native bridge', `${req.body.AccChildchain}`, `${req.body.AccRootchain}`, `${req.body.amount}`, `${req.body.AddChildToken}`], function(err) {
                            res.status(200).send(`ID Transaction: ${this.lastID} \n Sender: ${req.body.AccChildchain} \n Receiver: ${req.body.AccRootchain} \n Amount: ${req.body.amount} \n Token: ${req.body.AddChildToken}`);
                      })
                      
                });  
                }, 5 * 60 * 1000); // 5 phút = 5 * 60 * 1000 milliseconds

               
    });
});

// ============================= CHAINBRIDGE =============================================

// Config sender (Mumbai)
app.post("/chainbridge/sender", (req, res) => {
    var errors=[];

    if (!req.body.SRC_ADDR){
        errors.push("No account in rootchain specified");
    }

    if (!req.body.SRC_PK){
        errors.push("No Private key of account in rootchain specified");
    }

    if (!req.body.SRC_GATEWAY){
        errors.push("No RPC of rootchain specified");
    }
    if (!req.body.SRC_TOKEN){
        errors.push("No address of token on rootchain specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    const command1 = `node chainbridge-deploy/cb-sol-cli/index.js deploy --url ${req.body.SRC_GATEWAY} --privateKey ${req.body.SRC_PK} --gasPrice 10000000000 --bridge --erc20Handler --relayers ${req.body.SRC_ADDR} --relayerThreshold 1 --chainId 0`;
    exec(command1, (error, stdout, stderr) => {
        if (error) {
            console.error(`Command execution error: ${error.message}`);
            res.send(`Deploy contract on layer 1 failed!!! Command execution error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`Command execution stderr: ${stderr}`);
            return;
        }
        const lines = stdout.split("\n");
        let erc20HandlerAddress = "";
        let bridgecontract = "";
        for (const line of lines) {
            if (line.includes("Bridge:")) {
                bridgecontract = line.split(":")[1].trim() + "";
            }
            if (line.includes("Erc20 Handler:")) {
                erc20HandlerAddress = line.split(":")[1].trim() + "";
                break;
            }
        }
        const command2 = `node chainbridge-deploy/cb-sol-cli/index.js bridge register-resource --url ${req.body.SRC_GATEWAY} --privateKey ${req.body.SRC_PK} --gasPrice 10000000000 --bridge ${bridgecontract} --handler ${erc20HandlerAddress} --resourceId 0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00 --targetContract ${req.body.SRC_TOKEN}`;
        exec(command2, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
                res.send(`Config contract on layer1 failed!!! Command execution error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Command execution stderr: ${stderr}`);
                return;
            }
                res.send(`Bridge contract on rootchain (sender): ${bridgecontract} \n Handler contract on rootchain (sender): ${erc20HandlerAddress} `);      
            });
        });
    });
    
// Config receiver (Supernet)
app.post("/chainbridge/receiver", (req, res) => {
    var errors=[];

    if (!req.body.DST_ADDR){
        errors.push("No account in chilchain specified");
    }

    if (!req.body.DST_PK){
        errors.push("No Private key of account in chilchain specified");
    }

    if (!req.body.DST_GATEWAY){
        errors.push("No RPC of chilchain specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    
    const command1 = `node chainbridge-deploy/cb-sol-cli/index.js deploy --url ${req.body.DST_GATEWAY} --privateKey ${req.body.DST_PK} --gasPrice 10000000000 --bridge --erc20 --erc20Handler --relayers ${req.body.DST_ADDR} --relayerThreshold 1 --chainId 1`;
    exec(command1, (error, stdout, stderr) => {
        if (error) {
            console.error(`Command execution error: ${error.message}`);
            res.send(`Deploy contract on layer 2 failed!!! Command execution error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`Command execution stderr: ${stderr}`);
            return;
        }
        const lines = stdout.split("\n");
        let erc20HandlerAddress = "";
        let bridgecontract = "";
        let erc20Address = "";
        for (const line of lines) {
            if (line.includes("Bridge:")) {
                bridgecontract = line.split(":")[1].trim() + "";
            }
            if (line.includes("Erc20 Handler:")) {
                erc20HandlerAddress = line.split(":")[1].trim() + "";
            }
            if (line.includes("Erc20:")) {
                erc20Address = line.split(":")[1].trim() + "";
                break;
            }
        }

        const command2 = `node chainbridge-deploy/cb-sol-cli/index.js bridge register-resource --url ${req.body.DST_GATEWAY} --privateKey ${req.body.DST_PK} --gasPrice 10000000000 --bridge ${bridgecontract} --handler ${erc20HandlerAddress} --resourceId 0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00 --targetContract ${erc20Address}`;
        exec(command2, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
                res.send(`Config contract on layer2 failed!!! Command execution error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Command execution stderr: ${stderr}`);
                return;
            }
            
            const command3 = `node chainbridge-deploy/cb-sol-cli/index.js bridge set-burn --url ${req.body.DST_GATEWAY} --privateKey ${req.body.DST_PK} --gasPrice 10000000000 --bridge ${bridgecontract} --handler ${erc20HandlerAddress} --tokenContract ${erc20Address}`;
            exec(command3, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Command execution error: ${error.message}`);
                    res.send(`Register the token as mintable/burnable on the bridge failed!!! Command execution error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`Command execution stderr: ${stderr}`);
                    return;
                }
                const command4 = `node chainbridge-deploy/cb-sol-cli/index.js erc20 add-minter --url ${req.body.DST_GATEWAY} --privateKey ${req.body.DST_PK} --gasPrice 10000000000 --minter ${erc20HandlerAddress} --erc20Address ${erc20Address}`;
                exec(command4, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Command execution error: ${error.message}`);
                        res.send(`Give permission for the handler to mint new tokens failed!!! Command execution error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.error(`Command execution stderr: ${stderr}`);
                        return;
                    }
                res.send(`Bridge contract on childchain (receiver): ${bridgecontract} \n Handler contract on childchain (receiver): ${erc20HandlerAddress} \n Address of token on childchain: ${erc20Address}`);
                });
            });    
        }); 
    });
});


// Deposit
app.post("/chainbridge/deposit", (req, res) => {
    var errors=[];

    if (!req.body.SRC_HANDLER){
        errors.push("No address handler in rootchain specified");
    }

    if (!req.body.SRC_BRIDGE){
        errors.push("No address bridge in rootchain specified");
    }

    if (!req.body.SRC_PK){
        errors.push("No Private key of account in rootchain specified");
    }

    if (!req.body.SRC_GATEWAY){
        errors.push("No RPC of rootchain specified");
    }

    if (!req.body.SRC_TOKEN){
        errors.push("No address of token on rootchain specified");
    }

    if (!req.body.DST_ADDR){
        errors.push("No address on childchain specified");
    }

    if (!req.body.amount){
        errors.push("Amount must greater than 0");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }

    const sql_insert = `INSERT INTO database (StateTxn, TypeOfBridge, Sender, Receiver, Amount, Token) VALUES (?,?,?,?,?,?)`;

    const command1 = `node chainbridge-deploy/cb-sol-cli/index.js --url ${req.body.SRC_GATEWAY} --privateKey ${req.body.SRC_PK} --gasPrice 10000000000 erc20 approve --amount ${req.body.amount} --erc20Address ${req.body.SRC_TOKEN} --recipient ${req.body.SRC_HANDLER}`;
    exec(command1, (error, stdout, stderr) => {
        if (error) {
            db.run(sql_insert, ['Fail', 'Chain bridge', `${req.body.SRC_ADDR}`, `${req.body.DST_ADDR}`, `${req.body.amount}`, `${req.body.SRC_TOKEN}`], function(err) {
                res.status(500).send(`ID Transaction: ${this.lastID} \n Command execution error: ${error.message}`);
        })
            return;
        }

        if (stderr) {
            db.run(sql_insert, ['Fail', 'Chain bridge', `${req.body.SRC_ADDR}`, `${req.body.DST_ADDR}`, `${req.body.amount}`, `${req.body.SRC_TOKEN}`], function(err) {
                res.status(500).send(`ID Transaction: ${this.lastID} \n Command execution error: ${stderr}`);
        })
            return;
        }

        const command2 = `node chainbridge-deploy/cb-sol-cli/index.js --url ${req.body.SRC_GATEWAY} --privateKey ${req.body.SRC_PK} --gasPrice 10000000000 erc20 deposit --amount ${req.body.amount} --dest 1 --bridge ${req.body.SRC_BRIDGE} --recipient ${req.body.DST_ADDR} --resourceId 0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00`;
        exec(command2, (error, stdout, stderr) => {
            if (error) {
                db.run(sql_insert, ['Fail', 'Chain bridge', `${req.body.SRC_ADDR}`, `${req.body.DST_ADDR}`, `${req.body.amount}`, `${req.body.SRC_TOKEN}`], function(err) {
                    res.status(500).send(`ID Transaction: ${this.lastID} \n Command execution error: ${error.message}`);
            })
                return;
            }
            if (stderr) {
                db.run(sql_insert, ['Fail', 'Chain bridge', `${req.body.SRC_ADDR}`, `${req.body.DST_ADDR}`, `${req.body.amount}`, `${req.body.SRC_TOKEN}`], function(err) {
                    res.status(500).send(`ID Transaction: ${this.lastID} \n Command execution error: ${stderr}`);
            })
                return;
            }
            db.run(sql_insert, ['Successfull', 'Chain bridge', `${req.body.SRC_ADDR}`, `${req.body.DST_ADDR}`, `${req.body.amount}`, `${req.body.SRC_TOKEN}`], function(err) {
                res.status(200).send(`ID Transaction: ${this.lastID} \n Sender: ${req.body.SRC_ADDR} \n Receiver: ${req.body.DST_ADDR} \n Amount: ${req.body.amount} \n Token: ${req.body.SRC_TOKEN}`);
          })
        });
    });
});


// Withdraw
app.post("/chainbridge/withdraw", (req, res) => {
    var errors=[];

    if (!req.body.DST_HANDLER){
        errors.push("No address handler in rootchain specified");
    }

    if (!req.body.DST_BRIDGE){
        errors.push("No address bridge in rootchain specified");
    }

    if (!req.body.DST_PK){
        errors.push("No Private key of account in rootchain specified");
    }

    if (!req.body.DST_GATEWAY){
        errors.push("No RPC of childchain specified");
    }

    if (!req.body.DST_TOKEN){
        errors.push("No address of token on rootchain specified");
    }

    if (!req.body.SRC_ADDR){
        errors.push("No address on childchain specified");
    }

    if (!req.body.amount){
        errors.push("Amount must greater than 0");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }

    const command1 = `node chainbridge-deploy/cb-sol-cli/index.js --url ${req.body.DST_GATEWAY} --privateKey ${req.body.DST_PK} --gasPrice 10000000000 erc20 approve --amount ${req.body.amount} --erc20Address ${req.body.DST_TOKEN} --recipient ${req.body.DST_HANDLER}`;
    exec(command1, (error, stdout, stderr) => {
        if (error) {
            console.error(`Command execution error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`Command execution stderr: ${stderr}`);
            return;
        }
        const command2 = `node chainbridge-deploy/cb-sol-cli/index.js --url ${req.body.DST_GATEWAY} --privateKey ${req.body.DST_PK} --gasPrice 10000000000 erc20 deposit --amount ${req.body.amount} --dest 0 --bridge ${req.body.DST_BRIDGE} --recipient ${req.body.SRC_ADDR} --resourceId 0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00`;
        exec(command2, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
                res.send(`Withdraw failed!!! Command execution error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Command execution stderr: ${stderr}`);
                return;
            }
                res.send(`Command execution stdout: ${stdout}`);
        });
    });
});


app.listen(3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    res.send("Welcome to App Server test Bridge token");
});
