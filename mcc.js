// const { writeFile } = require("node:fs/promises");

async function searchScryfallForBanned(query) {
  const encodedQuery = encodeURI(`(st:core or st:expansion) r>u ${query}`);
  const url = `https://api.scryfall.com/cards/search?q=${encodedQuery}`;
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
      throw new Error(`Bad Scryfall response: ${response.status}, ${response.statusText}, ${response.json}`); // rejected promise, not necessarily thrown error
    }
  }

  const data = await response.json();
  return data;
}

async function checkCard(query) {
  // TODO: if the query doesn't match an existing card, return -1 or maybe 2 or maybe we change to strings at this point
  query = query.toLowerCase();
  const data = await searchScryfallForBanned(query);

  if (data.object == "error") {
    if (data.code == "not_found") {
      return 0;
    } else {
      console.log("Error:");
      console.log(`code: ${data.code}`);
      console.log(`status: ${data.status}`); // should be 404 if we got here
      console.log(`warnings: ${data.warnings}`);
      console.log(`details: ${data.details}`);
      return -1;
    }
  } else {
    for (card of data.data) {
      if (card.name.toLowerCase() == query) {return 1;}
    }
    return 0;
  }

  return -1;
}

module.exports = { checkCard };