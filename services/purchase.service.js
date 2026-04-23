/* eslint-disable @typescript-eslint/no-require-imports */
const CustomerModel = require("../models/customer.model");
const ProductModel = require("../models/product.model");
const PurchaseModel = require("../models/purchase.model");

class PurchaseService {
  constructor(db) {
    this.db = db;
    this.customerModel = new CustomerModel(db);
    this.productModel = new ProductModel(db);
    this.purchaseModel = new PurchaseModel(db);
  }

  getAllPurchases() {
    return this.purchaseModel.getAllDetailed();
  }

  createPurchase(payload) {
    const customerId = Number(payload?.customer_id);
    const productId = Number(payload?.product_id);
    const quantity = Number(payload?.quantity);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error("Invalid customer id");
    }
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error("Invalid product id");
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Quantity must be a positive integer");
    }

    const customer = this.customerModel.getById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const product = this.productModel.getById(productId);
    if (!product) {
      throw new Error("Product not found");
    }
    if (product.stock < quantity) {
      throw new Error("Insufficient stock");
    }

    const totalPrice = product.price * quantity;

    const runTransaction = this.db.transaction(() => {
      const purchase = this.purchaseModel.create({
        customer_id: customerId,
        product_id: productId,
        quantity,
        total_price: totalPrice,
      });

      this.productModel.decreaseStock(productId, quantity);
      return purchase;
    });

    return runTransaction();
  }
}

module.exports = PurchaseService;
