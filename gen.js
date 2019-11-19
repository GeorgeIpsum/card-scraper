"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const data = __importStar(require("./config/default.json"));
const pg_1 = require("pg");
const fs = require('fs');
const filename = 'output.html';
const pool = data ? new pg_1.Pool({
    user: data.db.user,
    host: data.db.host,
    database: data.db.database,
    password: data.db.password,
    port: data.db.port
}) : new pg_1.Pool();
const buildHtml = async () => {
    let htmlstring = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      table, th, td { border: 1px solid black; }
      th, td { padding: 8px; }
      th { text-align: left; }
      td { vertical-align: top; }
    </style>
  </head>
  <body>
  `;
    let bankQuery = "SELECT * from banks;";
    let cardsQuery = "SELECT * from cards;";
    const banks = await pool.query(bankQuery);
    const cards = await pool.query(cardsQuery);
    const bankMatcher = (id) => {
        for (let b of banks.rows) {
            if (b.id === id)
                return b.name;
        }
    };
    htmlstring += "BANKS<br><br><table>";
    htmlstring += "<tr><th>id</th><th>name</th><th>default url</th><th>query selector</th><th>card name param</th><th>card page selector</th></tr>";
    for (let bank of banks.rows) {
        htmlstring += "<tr>";
        htmlstring += `<td>${bank.id}</td>`;
        htmlstring += `<td>${bank.name}</td>`;
        htmlstring += `<td>${bank.defaulturl}</td>`;
        htmlstring += `<td>${bank.queryselector}</td>`;
        htmlstring += `<td>${bank.cardname}</td>`;
        htmlstring += `<td>${bank.cardpageselector}</td>`;
        htmlstring += "</tr>";
    }
    htmlstring += "</table><br><br><br>CARDS<br><br>";
    for (let card of cards.rows) {
        htmlstring += "<table>";
        for (let field in card) {
            htmlstring += "<tr>";
            htmlstring += `<td>${field}</td>`;
            if (typeof card[field] === 'object') {
                let object = card[field];
                htmlstring += "<td>";
                for (let key in object) {
                    htmlstring += `<strong>${key}</strong><br>`;
                    htmlstring += `${object[key]}<br><br>`;
                }
                htmlstring += "</td>";
            }
            else if (field === 'bankid') {
                htmlstring += `<td>${bankMatcher(card.bankid)}</td>`;
            }
            else {
                htmlstring += `<td>${card[field]}</td>`;
            }
            htmlstring += "</tr>";
        }
        htmlstring += "</table><br><br>";
    }
    htmlstring += "</body></html>";
    const stream = fs.createWriteStream(filename);
    stream.once('open', async (fd) => {
        let html = htmlstring;
        stream.end(html);
    });
};
buildHtml();
