const { checkCard } = require("./mcc");

async function main() {
  const value = await checkCard("commander");
  console.log(`---\nreturn value: ${value}`);
}

main();