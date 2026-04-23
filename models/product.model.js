class ProductModel {
  constructor(db) {
    this.db = db;
  }

  getAll() {
    return this.db.prepare("SELECT * FROM products ORDER BY id DESC").all();
  }

  getById(id) {
    return this.db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  }

  create({ name, price, stock = 0 }) {
    const result = this.db
      .prepare("INSERT INTO products (name, price, stock) VALUES (?, ?, ?)")
      .run(name, Number(price), Number(stock));

    return this.getById(result.lastInsertRowid);
  }

  decreaseStock(id, quantity) {
    return this.db
      .prepare("UPDATE products SET stock = stock - ? WHERE id = ?")
      .run(quantity, id);
  }
}

module.exports = ProductModel;
