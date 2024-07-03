const { faker } = require("@faker-js/faker");
const fs = require("fs");

let inventory = {};
inventory.store = [];

for (let i = 1; i <= 30; i++) {
  inventory.store.push({
    productId: "bs_auction_" + i,
    productName: faker.commerce.product(),
    productBasePrice: faker.commerce.price(),
  });
}

fs.writeFile("inventory.json", JSON.stringify(inventory), function (err) {
  if (err) throw err;
});
