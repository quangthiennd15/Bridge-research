
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

// Create table data for native bridge
const sql_create = ` CREATE TABLE IF NOT EXISTS data_native (
    AccRootchain VARCHAR(100) NOT NULL,
    PKRootchain VARCHAR(100) NOT NULL,
    AddTokenRootchain VARCHAR(100) NOT NULL,
    AddERC20Predicate VARCHAR(100) NOT NULL,
    RPCRootchain VARCHAR(100) NOT NULL,

    AddChildToken VARCHAR(100) NOT NULL,
    RPCChildChain VARCHAR(100) NOT NULL,

    ExitHelper VARCHAR(100) NOT NULL,
    IDexit VARCHAR(100) NOT NULL

  );`;

app.get("/nativebridge", (req, res) => {
    db.run(sql_create, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.send("Successful creation of the data_native table");
    });
});


app.get("/nativebridge/getinfor", (req, res) =>{
    const query = `SELECT * FROM data_native`;
    var params = []
    db.all(query, params, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
});


// ============================= NATIVE BRIDGE =============================================
// Deposit Function
// AccRootchain = row["AccRootchain"];
    //     const PKRootchain = row["PKRootchain"];
    //     const RPCRootchain = row["RPCRootchain"];
    //     const AddTokenRootchain = row["AddTokenRootchain"];
    //     const AddERC20Predicate 


// Insert information of layer 1
app.post("/nativebridge/insertLayer1", (req, res) => {
    var errors=[];

    if (!req.body.AccRootchain){
        errors.push("No account in rootchain specified");
    }
    if (!req.body.PKRootchain){
        errors.push("No Private key of account in rootchain specified");
    }
    if (!req.body.AddTokenRootchain){
        errors.push("No address of token in rootchain specified");
    }
    if (!req.body.AddERC20Predicate){
        errors.push("No address of token ERC20 predicate in rootchain specified");
    }
    if (!req.body.RPCRootchain){
        errors.push("No RPC of rootchain specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        AccRootchain: req.body.AccRootchain,
        PKRootchain: req.body.PKRootchain,
        AddTokenRootchain: req.body.AddTokenRootchain,
        AddERC20Predicate: req.body.AddERC20Predicate,
        RPCRootchain: req.body.RPCRootchain
    }
 
    var sql =`INSERT INTO data_native (AccRootchain, PKRootchain, AddTokenRootchain, AddERC20Predicate, RPCRootchain, AddChildToken, RPCChildChain, ExitHelper, IDexit) VALUES (?,?,?,?,?,'','','','')`
    var params =[data.AccRootchain, data.PKRootchain, data.AddTokenRootchain, data.AddERC20Predicate, data.RPCRootchain]

    db.run(sql,params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
            res.send('Insert information of layer1 successfull!');
    });
});

// Insert information of layer 2
app.post("/nativebridge/insertLayer2", (req, res) => {
    var errors=[];

    if (!req.body.AddChildToken){
        errors.push("No account in childchain specified");
    }
    if (!req.body.RPCChildChain){
        errors.push("No have RPC of rootchain specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
 
    var data = {
        AddChildToken: req.body.AddChildToken,
        RPCChildChain: req.body.RPCChildChain
    }
    var sql ='UPDATE data_native SET (AddChildToken, RPCChildChain) = (?,?)'
    var params =[data.AddChildToken, data.RPCChildChain]

    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
            res.send('Insert information of layer2 successfull!');
    });
});


// Deposit Funtion
const { exec } = require("child_process");
app.get("/nativebridge/deposit", (req, res) => {
    const query = `SELECT * FROM data_native`;
    db.get(query, (err, row) => {
        if (err) {
            console.error("Error querying the database:", err);
            return;
        }

        if (!row) {
            console.error("No matching record found in the database.");
            return;
        }
        const AccRootchain = row["AccRootchain"];
        const PKRootchain = row["PKRootchain"];
        const RPCRootchain = row["RPCRootchain"];
        const AddTokenRootchain = row["AddTokenRootchain"];
        const AddERC20Predicate = row["AddERC20Predicate"];

        const command = `./polygon-edge bridge deposit-erc20 --sender-key ${PKRootchain} --receivers ${AccRootchain} --amounts 100 --root-token ${AddTokenRootchain} --root-predicate ${AddERC20Predicate} --json-rpc ${RPCRootchain} --minter-key ${PKRootchain}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
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


// Withdraw Function
app.get("/nativebridge/withdraw", (req, res) => {
    const query = `SELECT * FROM data_native`;
    db.get(query, (err, row) => {
        if (err) {
            console.error("Error querying the database:", err);
            return;
        }

        if (!row) {
            console.error("No matching record found in the database.");
            return;
        }
        const AccRootchain = row["AccRootchain"];
        const PKRootchain = row["PKRootchain"];
        const AddChildToken = row["AddChildToken"];
        const RPCChildChain = row["RPCChildChain"];
        const command = `./polygon-edge bridge withdraw-erc20 --sender-key ${PKRootchain} --receivers ${AccRootchain} --amounts 100 --child-predicate 0x0000000000000000000000000000000000001004 --child-token ${AddChildToken} --json-rpc ${RPCChildChain}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
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


// Exit Withdraw Function
app.post("/nativebridge/withdraw/exit", (req, res) => {
    var errors=[];

    if (!req.body.ExitHelper){
        errors.push("No address exithelper specified");
    }
    if (!req.body.IDexit){
        errors.push("No ID exit rootchain specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
 
    var data = {
        ExitHelper: req.body.ExitHelper,
        IDexit: req.body.IDexit
    }
    var sql ='UPDATE data_native SET (ExitHelper, IDexit) = (?,?)'
    var params =[data.ExitHelper, data.IDexit]

    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }

        const query = `SELECT * FROM data_native`;
        db.get(query, (err, row) => {
        if (err) {
            console.error("Error querying the database:", err);
            return;
        }

        if (!row) {
            console.error("No matching record found in the database.");
            return;
        }
        const PKRootchain = row["PKRootchain"];
        const RPCChildChain = row["RPCChildChain"];
        const RPCRootchain = row["RPCRootchain"];

        const command = `./polygon-edge bridge exit --sender-key ${PKRootchain} --exit-helper ${data.ExitHelper} --exit-id ${data.IDexit} --root-json-rpc ${RPCRootchain} --child-json-rpc ${RPCChildChain}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
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
});



// ============================= CHAINBRIDGE =============================================
const sqlite_create = ` CREATE TABLE IF NOT EXISTS data_chain (
  SRC_GATEWAY VARCHAR(100) NOT NULL,
  DST_GATEWAY VARCHAR(100) NOT NULL,
  SRC_ADDR VARCHAR(100) NOT NULL,
  SRC_PK VARCHAR(100) NOT NULL,
  DST_ADDR VARCHAR(100) NOT NULL,
  DST_PK VARCHAR(100) NOT NULL,
  SRC_TOKEN VARCHAR(100) NOT NULL,
  RESOURCE_ID VARCHAR(100) NOT NULL,

  SRC_BRIDGE VARCHAR(100) NOT NULL,
  SRC_HANDLER VARCHAR(100) NOT NULL,
  DST_TOKEN VARCHAR(100) NOT NULL,

  DST_HANDLER VARCHAR(100) NOT NULL,
  DST_BRIDGE VARCHAR(100) NOT NULL
);`;

app.get("/chainbridge", (req, res) => {
    db.run(sqlite_create, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.send("Successful creation of the data_chain table");
    });
});

// Insert data to data_chain table
const sqlite_insert = `INSERT INTO data_chain (SRC_GATEWAY ,DST_GATEWAY ,SRC_ADDR ,SRC_PK ,DST_ADDR ,DST_PK ,SRC_TOKEN ,RESOURCE_ID ,SRC_BRIDGE ,SRC_HANDLER ,DST_TOKEN, DST_HANDLER, DST_BRIDGE ) VALUES
('http://18.224.19.137:8545/', 'http://127.0.0.1:10001/', '0x35A657d6994E48d600De79308cF5Cc7EbA7b1Ef8', 'e8b9049bda2bdb4e7c60ea183933d5b1124e0282ed9d33a4ac87715e62d7a858','0x33c1fb08894D9aaEf6b254C6C16b95E827B8e3cD', '38a19fbf90662461b18b50006d5d3df7d7d4401c71fdcfa6061493e6e9b78faf', '0x94C3a87e8C470C73DcFb825dB699cB3C29d8Fc36', '0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00', '','','', '', '' )`;

app.get("/chainbridge/insert", (req, res) => {
    db.run(sqlite_insert, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.send("Successful add information to data_chain table ");
    });
});

// Get information from data_chain table
app.get("/chainbridge/getinfor", (req, res) => {
    const query = `SELECT * FROM data_chain`;
    db.get(query, (err, row) => {
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


// Config Layer 1 (Mumbai)
app.get("/chainbridge/configl1", (req, res) => {
    const query = `SELECT * FROM data_chain`;
    db.get(query, (err, row) => {
        if (err) {
            console.error("Error querying the database:", err);
            return;
        }

        if (!row) {
            console.error("No matching record found in the database.");
            return;
        }
        const SRC_GATEWAY = row["SRC_GATEWAY"];
        const SRC_ADDR = row["SRC_ADDR"];
        const SRC_PK = row["SRC_PK"];

        const command1 = `node chainbridge-deploy/cb-sol-cli/index.js deploy --url ${SRC_GATEWAY} --privateKey ${SRC_PK} --gasPrice 10000000000 --bridge --erc20Handler --relayers ${SRC_ADDR} --relayerThreshold 1 --chainId 0`;

        exec(command1, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`Command execution stderr: ${stderr}`);
                return;
            }
            res.send(`Command execution stdout: ${stdout}`);

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
            const query1 = `UPDATE data_chain SET SRC_BRIDGE = '${bridgecontract}', SRC_HANDLER = '${erc20HandlerAddress}'`;
            db.get(query1, (err, row) => { });

            const SRC_BRIDGE = row["SRC_BRIDGE"];
            const SRC_HANDLER = row["SRC_HANDLER"];
            const SRC_TOKEN = row["SRC_TOKEN"];
            const RESOURCE_ID = row["RESOURCE_ID"];
            const command2 = `node chainbridge-deploy/cb-sol-cli/index.js bridge register-resource --url ${SRC_GATEWAY} --privateKey ${SRC_PK} --gasPrice 10000000000 --bridge ${SRC_BRIDGE} --handler ${SRC_HANDLER} --resourceId ${RESOURCE_ID} --targetContract ${SRC_TOKEN}`;
            exec(command2, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Command execution error: ${error.message}`);
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
});

// Add column in data_chain table
// const sql_add = `ALTER TABLE data_chain ADD COLUMN DST_HANDLER;`;
// app.get("/chainbridge/add", (req, res) => {
//   db.run(sql_add, (err) => {
//     if (err) {
//       return console.error(err.message);
//     }
//     res.send("Successful add column ");
//   });
// });

// Add config layer 2
// app.get("/chainbridge/addDestination", (req, res) => {
//   const query = `UPDATE data_chain SET DST_BRIDGE = '0x2702f3db3dc8311bB3757f978fDCE30E309A0c88', DST_HANDLER = '0x8eb5574A48f995854Ca216b9c8c5B5B678a125a8', DST_TOKEN = '0xf222B35298fde183778CB3FC30cEdD0919548184'`;
//   db.get(query, (err, row) => {
//     if (err) {
//       console.error("Error querying the database:", err);
//       return;
//     }
//     res.send('Successful add information of destination chain');
//   });
// });

// app.get("/chainbridge/update", (req, res) => {
//   const query = `UPDATE data_chain SET DST_GATEWAY = 'http://127.0.0.1:10001'`;
//   db.get(query, (err, row) => {
//     if (err) {
//       console.error("Error querying the database:", err);
//       return;
//     }
//     res.send('Successful update information of destination chain');
//   });
// });


// Config Layer 2 (Supernet)
app.get("/chainbridge/configl2", (req, res) => {
    const query = `SELECT * FROM data_chain`;
    db.get(query, (err, row) => {
        if (err) {
            console.error("Error querying the database:", err);
            return;
        }

        if (!row) {
            console.error("No matching record found in the database.");
            return;
        }
        const DST_GATEWAY = row["DST_GATEWAY"];
        const DST_PK = row["DST_PK"];
        const DST_ADDR = row["DST_ADDR"];

        const command1 = `node chainbridge-deploy/cb-sol-cli/index.js deploy --url ${DST_GATEWAY} --privateKey ${DST_PK} --gasPrice 10000000000 --bridge --erc20 --erc20Handler --relayers ${DST_ADDR} --relayerThreshold 1 --chainId 1`;

        exec(command1, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
                return;
            }

            if (stderr) {
                console.error(`Command execution stderr: ${stderr}`);
                return;
            }
            res.send(`Command execution stdout: ${stdout}`);

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
            const query1 = `UPDATE data_chain SET DST_BRIDGE = '${bridgecontract}', DST_HANDLER = '${erc20HandlerAddress}', DST_TOKEN = '${erc20Address}'`;
            db.get(query1, (err, row) => { });

            const DST_TOKEN = row["DST_TOKEN"];
            const DST_BRIDGE = row["DST_BRIDGE"];
            const DST_HANDLER = row["DST_HANDLER"];
            const RESOURCE_ID = row["RESOURCE_ID"];

            // Registers the new token as a resource on the bridge
            const command2 = `node chainbridge-deploy/cb-sol-cli/index.js bridge register-resource --url ${DST_GATEWAY} --privateKey ${DST_PK} --gasPrice 10000000000 --bridge ${DST_BRIDGE} --handler ${DST_HANDLER} --resourceId ${RESOURCE_ID} --targetContract ${DST_TOKEN}`;
            exec(command2, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Command execution error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`Command execution stderr: ${stderr}`);
                    return;
                }
                res.send(`Command execution stdout: ${stdout}`);
            });

            // Register the token as mintable/burnable on the bridge
            const command3 = `node chainbridge-deploy/cb-sol-cli/index.js bridge set-burn --url ${DST_GATEWAY} --privateKey ${DST_PK} --gasPrice 10000000000 --bridge ${DST_BRIDGE} --handler ${DST_HANDLER} --tokenContract ${DST_TOKEN}`;
            exec(command3, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Command execution error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`Command execution stderr: ${stderr}`);
                    return;
                }
                res.send(`Command execution stdout: ${stdout}`);
            });

            // Give permission for the handler to mint new tokens
            const command4 = `node chainbridge-deploy/cb-sol-cli/index.js erc20 add-minter --url ${DST_GATEWAY} --privateKey ${DST_PK} --gasPrice 10000000000 --minter ${DST_HANDLER} --erc20Address ${DST_TOKEN}`;
            exec(command4, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Command execution error: ${error.message}`);
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
});


// Deposit
app.get("/chainbridge/deposit", (req, res) => {
    const query = `SELECT * FROM data_chain`;
    db.get(query, (err, row) => {
        if (err) {
            console.error("Error querying the database:", err);
            return;
        }

        if (!row) {
            console.error("No matching record found in the database.");
            return;
        }
        const SRC_BRIDGE = row["SRC_BRIDGE"];
        const SRC_PK = row["SRC_PK"];
        const DST_ADDR = row["DST_ADDR"];
        const RESOURCE_ID = row["RESOURCE_ID"];

        const command = `node chainbridge-deploy/cb-sol-cli/index.js --url ${SRC_GATEWAY} --privateKey ${SRC_PK} --gasPrice 10000000000 erc20 deposit --amount 100 --dest 1 --bridge ${SRC_BRIDGE} --recipient ${DST_ADDR} --resourceId ${RESOURCE_ID}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
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

// Withdraw

app.get("/chainbridge/withdraw", (req, res) => {
    const query = `SELECT * FROM data_chain`;
    db.get(query, (err, row) => {
        if (err) {
            console.error("Error querying the database:", err);
            return;
        }

        if (!row) {
            console.error("No matching record found in the database.");
            return;
        }

        const DST_PK = row["DST_PK"];
        const SRC_ADDR = row["SRC_ADDR"];
        const DST_GATEWAY = row["DST_GATEWAY"];

        const DST_BRIDGE = row["DST_BRIDGE"];
        const RESOURCE_ID = row["RESOURCE_ID"];

        const command = `node chainbridge-deploy/cb-sol-cli/index.js ---url ${DST_GATEWAY} --privateKey ${DST_PK} --gasPrice 10000000000 erc20 deposit --amount 1000000000000000000 --dest 0 --bridge ${DST_BRIDGE} --recipient ${SRC_ADDR} --resourceId ${RESOURCE_ID}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Command execution error: ${error.message}`);
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