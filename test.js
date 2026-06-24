const { checkCard } = require("./mcc");

async function main(query) {
  const banned = await checkCard(query);
  if (banned == -1) {console.log("Error");}
  else if (banned == 1) {console.log(`${query}: banned`);}
  else {console.log(`${query}: legal`);}
}

main("smothering tithe");