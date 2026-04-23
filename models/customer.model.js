class CustomerModel {
  constructor(db) {
    this.db = db;
  }

  getAll() {
    return this.db.prepare("SELECT * FROM customers ORDER BY id DESC").all();
  }

  getById(id) {
    return this.db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  }

  create({ name, phone = null, email = null }) {
    const result = this.db
      .prepare("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)")
      .run(name, phone, email);

    return this.getById(result.lastInsertRowid);
  }
}

module.exports = CustomerModel;
