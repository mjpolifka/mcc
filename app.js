const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {res.send('I think I can serve the frontend from here later.');})

app.get('/card/:id', async (req, res)  => {
  // TODO: validate input before using it
  const data = await getCardStatus(req.params['id']);
  res.send(`card data: ${data}`);
})

app.get('/deck/:id', (req, res) => {
  res.send(`deck id: ${req.params['id']}`);
})

app.get('/banlist', (req, res) => {
  res.send('banlist coming soon');
})

app.listen(port, () => {console.log(`Example app listening on port ${port}`);})



async function getCardStatus(id) {
  const url = 'https://api.scryfall.com/cards/named?exact=' + id;
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
    throw new Error(`Bad Scryfall response: ${response.status}, ${response.statusText}`);
  }

  const data = await response.json();
  return data['oracle_id'];
}