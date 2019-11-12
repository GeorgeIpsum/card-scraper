"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const data = __importStar(require("./config/default.json"));
const express = require('express');
const bodyParser = require('body-parser');
const APP = express();
const PORT = 3000;
const pool = new pg_1.Pool({
    user: data.db.user,
    host: data.db.host,
    database: data.db.database,
    password: data.db.password,
    port: data.db.port
});
pool.query('SELECT * FROM banks', (error, results) => {
    if (error)
        throw error;
    if (results.rowCount == 0)
        addInitialBanks();
    else
        init();
});
const addInitialBanks = () => {
    const query = "INSERT INTO banks(name) VALUES('Chase'),('American Express')";
    pool.query(query, (error, results) => {
        if (error)
            throw error;
        console.log(`COMMAND '${results.command}' succeeded.`);
        init();
    });
};
const init = () => {
    console.log('we did it');
};
APP.use(bodyParser.json());
APP.use(bodyParser.urlencoded({
    extended: true
}));
APP.get('/', (req, res) => {
    res.json({
        info: 'API'
    });
});
APP.listen(PORT, () => console.log(`running on port ${PORT}`));
