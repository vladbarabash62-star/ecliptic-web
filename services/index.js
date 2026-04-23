/* eslint-disable @typescript-eslint/no-require-imports */
const CustomerService = require("./customer.service");
const ProductService = require("./product.service");
const PurchaseService = require("./purchase.service");

function createServices(db) {
  return {
    customerService: new CustomerService(db),
    productService: new ProductService(db),
    purchaseService: new PurchaseService(db),
  };
}

module.exports = {
  CustomerService,
  ProductService,
  PurchaseService,
  createServices,
};
