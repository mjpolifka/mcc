const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {res.send('I think I can serve the frontend from here later.');})

app.get('/card/:id', (req, res)  => {
  res.send(`card id: ${req.params['id']}`);
})

app.get('/deck/:id', (req, res) => {
  res.send(`deck id: ${req.params['id']}`);
})

app.get('/banlist', (req, res) => {
  res.send('banlist coming soon');
})

app.listen(port, () => {console.log(`Example app listening on port ${port}`);})