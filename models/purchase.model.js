class PurchaseModel {
  constructor(db) {
    this.db = db;
  }

  getAllDetailed() {
    return this.db
      .prepare(`
        SELECT p.id, p.quantity, p.total_price, p.created_at,
               c.id as customer_id, c.name as customer_name,
               pr.id as product_id, pr.name as product_name
        FROM purchases p
        JOIN customers c ON c.id = p.customer_id
        JOIN products pr ON pr.id = p.product_id
        ORDER BY p.id DESC
      `)
      .all();
  }

  create({ customer_id, product_id, quantity, total_price }) {
    const result = this.db
      .prepare(
        "INSERT INTO purchases (customer_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)"
      )
      .run(customer_id, product_id, quantity, total_price);

    return this.db
      .prepare("SELECT * FROM purchases WHERE id = ?")
      .get(result.lastInsertRowid);
  }
}

module.exports = PurchaseModel;
