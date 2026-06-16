import { Router, type IRouter } from "express";
import { db, paymentsTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatPayment(p: typeof paymentsTable.$inferSelect) {
  return {
    id: p.id,
    orderId: p.orderId,
    userId: p.userId,
    method: p.method,
    transactionId: p.transactionId,
    amount: p.amount,
    status: p.status,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/payments", requireAuth, async (req, res): Promise<void> => {
  const { status, orderId } = req.query as {
    status?: string;
    orderId?: string;
  };

  const role = req.session.role;
  const userId = req.session.userId!;

  let payments: (typeof paymentsTable.$inferSelect)[];

  if (role === "admin") {
    payments = await db.select().from(paymentsTable);
  } else {
    payments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.userId, userId));
  }

  if (status) payments = payments.filter((p) => p.status === status);
  if (orderId) payments = payments.filter((p) => p.orderId === parseInt(orderId, 10));

  res.json(payments.map(formatPayment));
});

router.post("/payments", requireAuth, async (req, res): Promise<void> => {
  const { orderId, method, transactionId, amount } = req.body as {
    orderId: number;
    method: string;
    transactionId: string;
    amount: string;
  };

  if (!orderId || !method || !transactionId || !amount) {
    res.status(400).json({ error: "orderId, method, transactionId, and amount are required" });
    return;
  }

  const validMethods = ["bkash", "nagad", "rocket"];
  if (!validMethods.includes(method)) {
    res.status(400).json({ error: "method must be bkash, nagad, or rocket" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      orderId,
      userId: req.session.userId!,
      method,
      transactionId,
      amount,
      status: "pending",
    })
    .returning();

  res.status(201).json(formatPayment(payment));
});

router.get("/payments/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, id));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const role = req.session.role;
  const userId = req.session.userId!;
  if (role !== "admin" && payment.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(formatPayment(payment));
});

router.patch("/payments/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { status, notes } = req.body as { status?: string; notes?: string };

  const validStatuses = ["pending", "verified", "rejected"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: "status must be pending, verified, or rejected" });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates["status"] = status;
  if (notes !== undefined) updates["notes"] = notes;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [payment] = await db
    .update(paymentsTable)
    .set(updates)
    .where(eq(paymentsTable.id, id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  res.json(formatPayment(payment));
});

export default router;
