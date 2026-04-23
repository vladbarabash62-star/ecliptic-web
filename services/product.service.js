/* eslint-disable @typescript-eslint/no-require-imports */
const ProductModel = require("../models/product.model");

class ProductService {
  constructor(db) {
    this.productModel = new ProductModel(db);
  }

  getAllProducts() {
    return this.productModel.getAll();
  }

  getProductById(id) {
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error("Invalid product id");
    }

    return this.productModel.getById(productId);
  }

  createProduct(payload) {
    const name = payload?.name?.trim();
    const price = Number(payload?.price);
    const stock = payload?.stock == null ? 0 : Number(payload.stock);

    if (!name) {
      throw new Error("Product name is required");
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Product price must be a non-negative number");
    }
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("Product stock must be a non-negative integer");
    }

    return this.productModel.create({ name, price, stock });
  }
}

module.exports = ProductService;
