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
const puppeteer = require('puppeteer');
const TRAVEL_KEYWORDS = [
    "travel",
    "airline",
    "flyer",
    "fly",
    "tsa",
    "destination",
    "seating",
    "hotel",
    "booking",
    "resort",
    "vacation",
    "airport",
    "concierge",
    "miles",
    "airways",
    "american airlines",
    "delta",
    "frontier",
    "jetblue",
    "southwest",
    "spirit airlines",
    "united airlines",
    "hilton",
    "disney"
];
const ENTERTAINMENT_KEYWORDS = [
    "entertainment",
    "concert",
    "seat",
    "event",
    "presale"
];
const SPENDING_KEYWORDS = [
    "reward",
    "dollars",
    "cash",
    "store",
    "market",
    "merchant",
    "starbucks",
    "shop"
];
const SECURITY_KEYWORDS = [
    "security",
    "liability",
    "alert",
    "fraud",
    "validate",
    "assist"
];
;
let cardsCompleted = 0;
let totalCards = 0;
const pool = data ? new pg_1.Pool({
    user: data.db.user,
    host: data.db.host,
    database: data.db.database,
    password: data.db.password,
    port: data.db.port
}) : new pg_1.Pool();
pool.query('SELECT * FROM banks', (error, results) => {
    if (error)
        throw error;
    if (results.rowCount == 0)
        addInitialBanks();
    else
        init(results.rows);
});
const addInitialBanks = () => {
    let query = {
        text: "INSERT INTO banks(name,defaulturl,queryselector,cardname,cardpageselector) VALUES($1,$2,$3,$4,$5),($6,$7,$8,$9,$10) RETURNING *",
        values: [
            'Chase', 'https://creditcards.chase.com/all-credit-cards', 'a.add-jpaid', 2, 'div.offer-details',
            'American Express', 'https://www.americanexpress.com/us/credit-cards/?category=all', 'div[data-qe-id=\"card-grid\"] a[title=\"Offer & Benefit Terms\"]', 7, 'div.terms-content'
        ]
    };
    pool.query(query, (error, results) => {
        if (error)
            throw error;
        init(results.rows);
    });
};
const init = (banks) => {
    for (let bank of banks) {
        findCards(bank);
    }
};
const findCards = async (bank) => {
    if (bank.defaulturl && bank.queryselector) {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable'] });
        const page = await browser.newPage();
        await page.goto(bank.defaulturl, {
            waitUntil: 'networkidle2'
        });
        let linkElements = await page.$$(bank.queryselector);
        let links = [];
        for (let i = 0; i < linkElements.length; i++) {
            let link = await (await linkElements[i].getProperty('href')).jsonValue();
            links = [link, ...links];
        }
        await page.close();
        if (links.length == linkElements.length) {
            totalCards += links.length;
            let cards = await findCardData(browser, links, bank);
            await insertCardData(cards, bank);
        }
        else
            console.log('Element href mismatch');
    }
    else
        console.log('Bank URL or selector missing!');
};
const insertCardData = async (cards, bank) => {
    for (let rawCard of cards) {
        let spending = {};
        let travel = {};
        let entertainment = {};
        let security = {};
        let other = {};
        for (let benefit of rawCard.benefits) {
            if (benefit.type && benefit.title && benefit.content) {
                switch (benefit.type) {
                    case "spending":
                        spending[benefit.title] = benefit.content;
                        break;
                    case "travel":
                        travel[benefit.title] = benefit.content;
                        break;
                    case "entertainment":
                        entertainment[benefit.title] = benefit.content;
                        break;
                    case "security":
                        security[benefit.title] = benefit.content;
                        break;
                    default:
                        other[benefit.title] = benefit.content;
                        break;
                }
            }
        }
        const query = {
            text: "INSERT INTO cards(bankid,name,defaulturl,spending,travel,entertainment,security,other) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
            values: [
                bank.id,
                rawCard.name,
                rawCard.defaulturl,
                spending,
                travel,
                entertainment,
                security,
                other
            ],
        };
        pool.query(query, (error, results) => {
            if (error)
                throw error;
        });
    }
};
const findCardData = async (browser, links, bank) => {
    let cardsData = [];
    console.log(`Getting card data: ${bank.name}`);
    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const page = await browser.newPage();
        await page.goto(link, {
            waitUntil: 'networkidle2'
        });
        let cardData = await parsePage(page, bank);
        cardsData = [cardData, ...cardsData];
        cardsCompleted++;
        console.log(`Fetching data: (${cardData.name}) ${cardsCompleted}/${totalCards}`);
        await page.close();
        if (i == links.length - 1) {
            await browser.close();
        }
    }
    return cardsData;
};
const parsePage = async (page, bank) => {
    const url = page.url();
    let cardName = url.split('/')[bank.cardname + 2].split('?')[0];
    cardName = cardName.split('-').map(s => s.replace(/^./, s[0].toUpperCase())).join(' ');
    cardName += cardName.toUpperCase().endsWith("CARD") ? "" : " Card";
    let parsedBenefits;
    if (bank.cardpageselector) {
        const part = await page.$(bank.cardpageselector);
        parsedBenefits = bank.name == 'Chase' ? await parseChase(cardName, part) : await parseAmex(cardName, part);
    }
    else {
        parsedBenefits = {};
    }
    return {
        name: cardName,
        bankid: bank.id,
        defaulturl: url,
        benefits: parsedBenefits,
    };
};
const parseChase = async (name, part) => {
    if (part) {
        const segments = await part.$$('p');
        let benefits = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            let innerHtml = await getProperty(segment, 'innerHTML');
            let titles = innerHtml.match(/<strong>\n*(.*)\n*\s*<\/strong>/gm);
            let title = titles ? titles[0].replace(/(<([^>]+)>)/ig, '').replace(/\n/ig, '').trim() : null;
            let contents = innerHtml.match(/<\/strong>(.*)/gm);
            if (!contents || contents[0].endsWith('</strong>')) {
                contents = innerHtml.match(/<\/strong>\n*\s*<br>\n*(.*)/gm);
            }
            let content = contents ? contents[0].replace(/(<([^>]+)>)/ig, '').replace(/\n/ig, '').trim() : null;
            if (title && content) {
                const parsedBenefit = determineCategory(title, content);
                benefits = [parsedBenefit, ...benefits];
            }
        }
        return benefits;
    }
    else
        console.log(`Could not properly parse ${name}`);
    return null;
};
const parseAmex = async (name, part) => {
    if (part) {
        const segments = await part.$$(':scope > div.margin-bottom-tnc:not(.conditions-terms)');
        let benefits = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            let innerHtml = await getProperty(segment, 'innerHTML');
            let titles = innerHtml.match(/<h2>(.*)<\/h2>/gm);
            if (!titles) {
                titles = innerHtml.match(/<b>(.*)<\/b>/gm);
            }
            let title = titles ? titles[0].replace(/(<([^>]+)>)/ig, '').replace(/\n/ig, '').trim() : null;
            let contents = innerHtml.match(/<\/h2>(.*)/gm);
            let content = contents ? contents[0].replace(/(<([^>]+)>)/ig, '').replace(/\n/ig, '').trim() : null;
            if (title && content) {
                const parsedBenefit = determineCategory(title, content);
                benefits = [parsedBenefit, ...benefits];
            }
        }
        return benefits;
    }
    else
        console.log(`Could not properly parse ${name}`);
    return null;
};
const determineCategory = (title, content) => {
    const stringsToTest = [title, content];
    let category = {
        type: 'other',
        title,
        content
    };
    if (rgx(TRAVEL_KEYWORDS, stringsToTest)) {
        category.type = 'travel';
    }
    else if (rgx(ENTERTAINMENT_KEYWORDS, stringsToTest)) {
        category.type = 'entertainment';
    }
    else if (rgx(SPENDING_KEYWORDS, stringsToTest)) {
        category.type = 'spending';
    }
    else if (rgx(SECURITY_KEYWORDS, stringsToTest)) {
        category.type = 'security';
    }
    return category;
};
const rgx = (keywords, stringsToTest) => {
    for (let i = 0; i < stringsToTest.length; i++) {
        if (new RegExp(keywords.join("|")).test(stringsToTest[i].toLowerCase()))
            return true;
    }
    return false;
};
async function getProperty(element, property) {
    if (element) {
        return await (await element.getProperty(property)).jsonValue();
    }
}
