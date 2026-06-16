import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const role = req.query["role"] as string | undefined;
  const users = role
    ? await db.select().from(usersTable).where(eq(usersTable.role, role))
    : await db.select().from(usersTable);

  const safe = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));
  res.json(safe);
});

router.post("/users", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { name, email, password, role, phone } = req.body as {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
  };

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "name, email, password, and role are required" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role, phone })
    .returning();

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { name, email, password, role, phone, isActive } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    phone?: string;
    isActive?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates["name"] = name;
  if (email !== undefined) updates["email"] = email;
  if (role !== undefined) updates["role"] = role;
  if (phone !== undefined) updates["phone"] = phone;
  if (isActive !== undefined) updates["isActive"] = isActive;
  if (password) updates["passwordHash"] = await bcrypt.hash(password, 10);

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  });
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
