const CustomerModel = require("../models/customer.model");

class CustomerService {
  constructor(db) {
    this.customerModel = new CustomerModel(db);
  }

  getAllCustomers() {
    return this.customerModel.getAll();
  }

  getCustomerById(id) {
    const customerId = Number(id);
    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error("Invalid customer id");
    }

    return this.customerModel.getById(customerId);
  }

  createCustomer(payload) {
    const name = payload?.name?.trim();
    if (!name) {
      throw new Error("Customer name is required");
    }

    return this.customerModel.create({
      name,
      phone: payload?.phone ?? null,
      email: payload?.email ?? null,
    });
  }
}

module.exports = CustomerService;
