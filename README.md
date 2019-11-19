# card-scraper
a tool to scrape bank credit card websites


## Setup

1. Run npm install in the `card-scraper` directory
2. Create the postgresql db by running `psql -U [username] -d postgres -a -f setup.sql`
3. Rename `config/default.test.json` to `config/default.json` and then change the config to match your postgresql login (keep the database as "cards" so it matches the `setup.sql` script)
4. Start the script with `npm start`
