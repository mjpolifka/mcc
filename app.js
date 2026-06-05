const express = require('express');
const app = express();
const port = 3000;

const { checkCard } = require('./mcc');


app.get('/', (req, res) => {res.send('I think I can serve the frontend from here later.');})

app.get('/card/:name', async (req, res)  => {
  // TODO: validate input before using it
  const name = req.params['name'];
  const data = await checkCard(name);
  if (data == -1) {res.send(`${name}: error`);}
  else if (data == 0) {res.send(`${name}: legal`);}
  else if (data == 1) {res.send(`${name}: banned`);}
  else {res.send("Error: return value out of scope");}
})

app.get('/deck/:id', (req, res) => {
  res.send(`deck id: ${req.params['id']}`);
})

app.get('/banlist', (req, res) => {
  res.send('banlist coming soon');
})

app.listen(port, () => {console.log(`Example app listening on port ${port}`);})