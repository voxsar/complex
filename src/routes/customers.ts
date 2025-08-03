import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Customer } from "../entities/Customer";
import { CustomerStatus } from "../enums/customer_status";
import { validate } from "class-validator";

const router = Router();

// Get all customers
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const customerRepository = AppDataSource.getRepository(Customer);
    
    // Build MongoDB query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get customers
    const [customers, total] = await Promise.all([
      customerRepository.find({
        where: query,
        skip,
        take: Number(limit),
        order: { [sortBy as string]: sortOrder === "desc" ? "DESC" : "ASC" }
      }),
      customerRepository.count({ where: query })
    ]);

    res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get customer by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Create customer
router.post("/", async (req: Request, res: Response) => {
  try {
    const customerRepository = AppDataSource.getRepository(Customer);
    
    const customer = customerRepository.create(req.body);
    
    // Validate
    const errors = await validate(customer);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const savedCustomer = await customerRepository.save(customer);
    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Update customer
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Update fields
    Object.assign(customer, req.body);
    
    // Validate
    const errors = await validate(customer);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedCustomer = await customerRepository.save(customer);
    res.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Delete customer
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const result = await customerRepository.delete({ id });

    if (result.affected === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Add address to customer
router.post("/:id/addresses", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const address = {
      id: require("uuid").v4(),
      ...req.body,
    };

    if (!customer.addresses) {
      customer.addresses = [];
    }

    customer.addresses.push(address);
    
    const updatedCustomer = await customerRepository.save(customer);
    res.status(201).json(address);
  } catch (error) {
    console.error("Error adding customer address:", error);
    res.status(500).json({ error: "Failed to add customer address" });
  }
});

// Update customer address
router.put("/:id/addresses/:addressId", async (req: Request, res: Response) => {
  try {
    const { id, addressId } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const addressIndex = customer.addresses?.findIndex(a => a.id === addressId);
    
    if (addressIndex === -1 || addressIndex === undefined) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Update address
    customer.addresses![addressIndex] = {
      ...customer.addresses![addressIndex],
      ...req.body,
    };

    await customerRepository.save(customer);
    res.json(customer.addresses![addressIndex]);
  } catch (error) {
    console.error("Error updating customer address:", error);
    res.status(500).json({ error: "Failed to update customer address" });
  }
});

// Delete customer address
router.delete("/:id/addresses/:addressId", async (req: Request, res: Response) => {
  try {
    const { id, addressId } = req.params;
    const customerRepository = AppDataSource.getRepository(Customer);

    const customer = await customerRepository.findOne({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (!customer.addresses) {
      return res.status(404).json({ error: "Address not found" });
    }

    const initialLength = customer.addresses.length;
    customer.addresses = customer.addresses.filter(a => a.id !== addressId);

    if (customer.addresses.length === initialLength) {
      return res.status(404).json({ error: "Address not found" });
    }

    await customerRepository.save(customer);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting customer address:", error);
    res.status(500).json({ error: "Failed to delete customer address" });
  }
});

export default router;
