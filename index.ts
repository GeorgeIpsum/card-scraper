import { Pool } from "pg";
import * as data from './config/default.json';
import { Browser, Page, ElementHandle } from "puppeteer";
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
  "foreign",
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
]

interface Bank {
  id: number,
  name: string,
  defaulturl: string,
  queryselector: string,
  cardname: number, //bit of a misnomer, its the url parameter selector for credit cards for said bank
  cardpageselector: string,
  createdAt: Date
};

interface Card {
  name: string,
  bankid: number,
  defaulturl: string,
  benefits: any,
  other: string
}

let cardsCompleted = 0;
let totalCards = 0;

const pool: Pool = data ? new Pool({
  user: data.db.user,
  host: data.db.host,
  database: data.db.database,
  password: data.db.password,
  port: data.db.port
}) : new Pool();

pool.query('SELECT * FROM banks', (error, results) => {
  if(error) throw error;
  if(results.rowCount == 0) addInitialBanks();
  else init(results.rows);
});

const addInitialBanks = () => {
  let query = {
    text: "INSERT INTO banks(name,defaulturl,queryselector,cardname,cardpageselector) VALUES($1,$2,$3,$4,$5),($6,$7,$8,$9,$10) RETURNING *",
    values: [
      'Chase','https://creditcards.chase.com/all-credit-cards','a.add-jpaid',2,'div.offer-details',
      'American Express','https://www.americanexpress.com/us/credit-cards/?category=all','div[data-qe-id=\"card-grid\"] a[title=\"Offer & Benefit Terms\"]',7,'div.terms-content'
    ]
  };

  pool.query(query, (error, results) => {
    if(error) throw error;
    init(results.rows);
  });
}

const init = (banks: Bank[]) => {
  for(let bank of banks) {
    findCards(bank);
  }
}

const findCards = async (bank: Bank) => {
  if(bank.defaulturl && bank.queryselector) {
    const browser: Browser = await puppeteer.launch({args: ['--no-sandbox', '--disable']});
    const page: Page = await browser.newPage();
    await page.goto(bank.defaulturl, {
      waitUntil: 'networkidle2'
    });

    let linkElements = await page.$$(bank.queryselector);
    let links: string[] = [];
    for(let i=0; i < linkElements.length; i++) {
      let link = await (await linkElements[i].getProperty('href')).jsonValue();
      links = [link, ...links];
    }

    await page.close();

    if(links.length == linkElements.length) {
      totalCards += links.length;
      let cards = await findCardData(browser, links, bank);
      await insertCardData(cards, bank);
    } else console.log('Element href mismatch');
  } else console.log('Bank URL or selector missing!');
}

const insertCardData = async (cards: Card[], bank: Bank) => {
  for(let rawCard of cards) {
    let spending = {} as any;
    let travel = {} as any;
    let entertainment = {} as any;
    let security = {} as any;
    let other = {} as any;
    for(let benefit of rawCard.benefits) {
      if(benefit.type && benefit.title && benefit.content) {
        switch(benefit.type) {
          case "spending": spending[benefit.title] = benefit.content; break;
          case "travel": travel[benefit.title] = benefit.content; break;
          case "entertainment": entertainment[benefit.title] = benefit.content; break;
          case "security": security[benefit.title] = benefit.content; break;
          default: other[benefit.title] = benefit.content; break;
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
      if(error) throw error;
    });
  }
}

const findCardData = async (browser: Browser, links: string[], bank: Bank) => {
  let cardsData: Card[] = [];
  console.log(`Getting card data: ${bank.name}`);

  for(let i=0; i<links.length; i++) {
    const link = links[i];

    const page: Page = await browser.newPage();
    await page.goto(link, {
      waitUntil: 'networkidle2'
    });

    let cardData: Card = await parsePage(page, bank);

    cardsData = [cardData, ...cardsData];
    cardsCompleted++;
    console.log(`Fetching data: (${cardData.name}) ${cardsCompleted}/${totalCards}`);

    await page.close();
    
    if(i == links.length-1) {
      await browser.close();
    }
  }

  return cardsData;
}

const parsePage = async (page: Page, bank: Bank): Promise<Card> => {
  const url = page.url();
  let cardName = url.split('/')[bank.cardname+2].split('?')[0];
  cardName = cardName.split('-').map(s => s.replace(/^./, s[0].toUpperCase())).join(' ');
  cardName += cardName.toUpperCase().endsWith("CARD") ? "" : " Card";
  let parsedBenefits;

  if(bank.cardpageselector) {
    const part = await page.$(bank.cardpageselector);
    parsedBenefits = bank.name == 'Chase' ? await parseChase(cardName, part) : await parseAmex(cardName, part);
  } else {
    parsedBenefits = {};
  }

  return {
    name: cardName,
    bankid: bank.id,
    defaulturl: url,
    benefits: parsedBenefits,
  } as Card;
}

const parseChase = async (name: string, part: ElementHandle<Element> | null) => {
  if(part) {
    const segments = await part.$$('p');
    let benefits: any[] = [];
    for(let i=0; i<segments.length; i++) {
      const segment = segments[i];
      let innerHtml: string = await getProperty(segment, 'innerHTML');
      let titles = innerHtml.match(/<strong>\n*(.*)\n*\s*<\/strong>/gm);
      let title = titles ? titles[0].replace(/(<([^>]+)>)/ig, '').replace(/\n/ig, '').trim() : null;
      
      let contents = innerHtml.match(/<\/strong>(.*)/gm);
      if(!contents || contents[0].endsWith('</strong>')) {
        contents = innerHtml.match(/<\/strong>\n*\s*<br>\n*(.*)/gm);
      }
      let content = contents ? contents[0].replace(/(<([^>]+)>)/ig, '').replace(/\n/ig, '').trim() : null;

      if(title && content) {
        const parsedBenefit = determineCategory(title, content);
        benefits = [parsedBenefit, ...benefits];
      }
    }
    return benefits;
  } else console.log(`Could not properly parse ${name}`);
  return null;
}

const parseAmex = async (name: string, part: ElementHandle<Element> | null) => {
  if(part) {
    const segments = await part.$$(':scope > div.margin-bottom-tnc:not(.conditions-terms)');
    let benefits: any[] = [];
    for(let i=0; i<segments.length; i++) {
      const segment = segments[i];
      let innerHtml: string = await getProperty(segment, 'innerHTML');
      let titles = innerHtml.match(/<h2>(.*)<\/h2>/gm);
      if(!titles) {
        titles = innerHtml.match(/<b>(.*)<\/b>/gm);
      }
      let title = titles ? titles[0].replace(/(<([^>]+)>)/ig, '').replace(/\n/ig, '').trim() : null;

      let contents = innerHtml.match(/<\/h2>(.*)/gm);
      let content = contents ? contents[0].replace(/(<([^>]+)>)/ig, '').replace(/\n/ig, '').trim() : null;

      if(title && content) {
        const parsedBenefit = determineCategory(title, content);
        benefits = [parsedBenefit, ...benefits];
      }
    }
    return benefits;
  } else console.log(`Could not properly parse ${name}`);
  return null;
}

const determineCategory = (title: string, content: string) => {
  const stringsToTest = [title, content];
  let category = {
    type: 'other',
    title,
    content
  };
  if(rgx(TRAVEL_KEYWORDS, stringsToTest)) {
    category.type = 'travel';
  } else if(rgx(ENTERTAINMENT_KEYWORDS, stringsToTest)) {
    category.type = 'entertainment'
  } else if(rgx(SPENDING_KEYWORDS, stringsToTest)) {
    category.type = 'spending';
  } else if(rgx(SECURITY_KEYWORDS, stringsToTest)) {
    category.type = 'security';
  }

  return category;
}

const rgx = (keywords: string[], stringsToTest: string[]): boolean => {
  for(let i=0; i<stringsToTest.length; i++) {
    if(new RegExp(keywords.join("|")).test(stringsToTest[i].toLowerCase())) return true;
  } return false;
}

async function getProperty(element: ElementHandle | null, property: string) {
  if(element) {
    return await(await element.getProperty(property)).jsonValue();
  }
}
