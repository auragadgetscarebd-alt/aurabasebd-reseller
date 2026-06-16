import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const isAdmin =
    req.session.userId && (req.session.role === "admin" || req.session.role === "reseller");

  const products = await db.select().from(productsTable);
  const filtered = isAdmin ? products : products.filter((p) => p.isActive);
  res.json(filtered.map(formatProduct));
});

router.post("/products", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { name, description, price, stock, imageUrl } = req.body as {
    name: string;
    description?: string;
    price: string;
    stock: number;
    imageUrl?: string;
  };

  if (!name || !price) {
    res.status(400).json({ error: "name and price are required" });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ name, description, price, stock: stock ?? 0, imageUrl })
    .returning();

  res.status(201).json(formatProduct(product));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

router.patch("/products/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const { name, description, price, stock, imageUrl, isActive } = req.body as {
    name?: string;
    description?: string;
    price?: string;
    stock?: number;
    imageUrl?: string;
    isActive?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates["name"] = name;
  if (description !== undefined) updates["description"] = description;
  if (price !== undefined) updates["price"] = price;
  if (stock !== undefined) updates["stock"] = stock;
  if (imageUrl !== undefined) updates["imageUrl"] = imageUrl;
  if (isActive !== undefined) updates["isActive"] = isActive;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [product] = await db
    .update(productsTable)
    .set(updates)
    .where(eq(productsTable.id, id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

router.delete("/products/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [product] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
