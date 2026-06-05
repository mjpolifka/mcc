// const { writeFile } = require("node:fs/promises");

async function searchScryfall(query) {
  const encodedQuery = encodeURI(`(st:core or st:expansion) r>u ${query}`);
  const url = `https://api.scryfall.com/cards/search?q=${encodedQuery}`;
  // const url = `https://api.scryfall.com/cards/search?unique=prints&order=set&q=${encodedQuery}`;
  // const url = 'https://api.scryfall.com/cards/search?unique=prints&order=set&q=command';
  // const url = 'https://api.scryfall.com/cards/search?format=json&include_extras=false&include_multilingual=false&include_variations=false&order=set&page=2&q=command&unique=prints';
  const response = await fetch(
    url,
    {
      method: 'GET',
      headers: {
        'User-Agent': 'MiddleClassCommander/1.0',
        'Accepts': 'application/json',
      },
    });
  
  if (!response.ok) {
    if (response.status != "404") {
      throw new Error(`Bad Scryfall response: ${response.status}, ${response.statusText}`); // rejected promise, not necessarily thrown error
    }
  }

  const data = await response.json();
  return data;
}

async function checkCard(query) {
  const data = await searchScryfall(query);
  const json = JSON.stringify(data, null, 2);

  console.log(`-- query for: ${query} --`);

  if (data.object == "error") {
    if (data.code == "not_found") {
      console.log("Search returned no results");
      return 0;
    } else {
      console.log("Error:");
      console.log(`code: ${data.code}`);
      console.log(`status: ${data.status}`); // should be 404 if we got here
      console.log(`warnings: ${data.warnings}`);
      console.log(`details: ${data.details}`);
    }
  } else {
    console.log(`object: ${data.object}`);
    console.log(`total_cards: ${data.total_cards}`);
    console.log(`has_more: ${data.has_more}`);
    if (data.has_more) {console.log(`next_page: ${data.next_page}`)};
  }

  return -1;

  // await writeFile("test.json", json, "utf8");
  // console.log("test.json written");
}

module.exports = { checkCard };