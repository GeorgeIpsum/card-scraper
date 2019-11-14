import { Request, Response } from "express";
import { Pool } from "pg";
import * as data from './config/default.json';

const express = require('express');
const bodyParser = require('body-parser');
const APP = express();
const PORT = 3000;

const pool: Pool = new Pool({
  user: data.db.user,
  host: data.db.host,
  database: data.db.database,
  password: data.db.password,
  port: data.db.port
});

pool.query('SELECT * FROM banks', (error, results) => {
  if(error) throw error;
  if(results.rowCount == 0) addInitialBanks();
  else init();
});

const addInitialBanks = () => {
  const query = "INSERT INTO banks(name,defaultUrl,parseMethod) VALUES('Chase'),('American Express')";
  pool.query(query, (error, results) => {
    if(error) throw error;
    console.log(`COMMAND '${results.command}' succeeded.`);
    init();
  });
}

const init = () => {
  
}

APP.use(bodyParser.json());
APP.use(
  bodyParser.urlencoded({
    extended: true
  })
);

APP.get('/', (req: Request, res: Response) => {
  res.json({
    info: 'API'
  });
});

APP.listen(PORT, () => console.log(`Express Server running on port ${PORT}`));
