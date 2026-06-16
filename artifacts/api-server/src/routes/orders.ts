import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    customerId: o.customerId,
    resellerId: o.resellerId,
    status: o.status,
    totalAmount: o.totalAmount,
    shippingAddress: o.shippingAddress,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const role = req.session.role;
  const userId = req.session.userId!;
  const { status } = req.query as { status?: string };

  let orders: (typeof ordersTable.$inferSelect)[];

  if (role === "admin") {
    orders = await db.select().from(ordersTable);
  } else if (role === "reseller") {
    orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.resellerId, userId));
  } else {
    orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerId, userId));
  }

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  res.json(orders.map(formatOrder));
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const { resellerId, shippingAddress, notes, items } = req.body as {
    resellerId?: number;
    shippingAddress?: string;
    notes?: string;
    items: Array<{ productId: number; quantity: number }>;
  };

  if (!items || items.length === 0) {
    res.status(400).json({ error: "Order must have at least one item" });
    return;
  }

  let totalAmount = 0;
  const itemsWithPrices: Array<{
    productId: number;
    quantity: number;
    unitPrice: string;
  }> = [];

  for (const item of items) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, item.productId));

    if (!product || !product.isActive) {
      res.status(400).json({ error: `Product ${item.productId} not found or inactive` });
      return;
    }

    if (product.stock < item.quantity) {
      res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      return;
    }

    const price = parseFloat(product.price);
    totalAmount += price * item.quantity;
    itemsWithPrices.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
    });
  }

  const [order] = await db
    .insert(ordersTable)
    .values({
      customerId: req.session.userId!,
      resellerId: resellerId ?? null,
      status: "pending",
      totalAmount: totalAmount.toFixed(2),
      shippingAddress,
      notes,
    })
    .returning();

  for (const item of itemsWithPrices) {
    await db.insert(orderItemsTable).values({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });

    await db
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
      .where(eq(productsTable.id, item.productId));
  }

  res.status(201).json(formatOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const role = req.session.role;
  const userId = req.session.userId!;
  if (
    role !== "admin" &&
    order.customerId !== userId &&
    order.resellerId !== userId
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(formatOrder(order));
});

router.patch("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const role = req.session.role;

  const { status, notes, shippingAddress } = req.body as {
    status?: string;
    notes?: string;
    shippingAddress?: string;
  };

  if (role === "customer" && status && status !== "cancelled") {
    res.status(403).json({ error: "Customers can only cancel orders" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates["status"] = status;
  if (notes !== undefined) updates["notes"] = notes;
  if (shippingAddress !== undefined) updates["shippingAddress"] = shippingAddress;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set(updates)
    .where(eq(ordersTable.id, id))
    .returning();

  res.json(formatOrder(order));
});

router.get("/orders/:id/items", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, id));

  res.json(
    items.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  );
});

export default router;
