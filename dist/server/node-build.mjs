import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { mysqlTable, timestamp, boolean, mysqlEnum, varchar, int, text, decimal, datetime } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import crypto from "node:crypto";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const operarios = mysqlTable("operarios", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  role: mysqlEnum("role", ["operario", "supervisor", "warehouse_manager"]).default("operario"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const toolCategories = mysqlTable("tool_categories", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["individual", "common"]).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
const tools = mysqlTable("tools", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["individual", "common"]).notNull(),
  categoryId: int("category_id"),
  assignedTo: int("assigned_to"),
  location: varchar("location", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["available", "in_use", "maintenance", "missing"]).default("available"),
  lastSeen: datetime("last_seen"),
  nextReview: datetime("next_review"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  serialNumber: varchar("serial_number", { length: 255 }),
  qrCode: varchar("qr_code", { length: 255 }).unique(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
const toolCheckouts = mysqlTable("tool_checkouts", {
  id: int("id").primaryKey().autoincrement(),
  toolId: int("tool_id").notNull(),
  operarioId: int("operario_id").notNull(),
  checkedOutAt: datetime("checked_out_at").notNull(),
  checkedInAt: datetime("checked_in_at"),
  project: varchar("project", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});
const operariosRelations = relations(operarios, ({ many }) => ({
  assignedTools: many(tools),
  checkouts: many(toolCheckouts)
}));
const toolCategoriesRelations = relations(toolCategories, ({ many }) => ({
  tools: many(tools)
}));
const toolsRelations = relations(tools, ({ one, many }) => ({
  category: one(toolCategories, {
    fields: [tools.categoryId],
    references: [toolCategories.id]
  }),
  assignedOperario: one(operarios, {
    fields: [tools.assignedTo],
    references: [operarios.id]
  }),
  checkouts: many(toolCheckouts)
}));
const toolCheckoutsRelations = relations(toolCheckouts, ({ one }) => ({
  tool: one(tools, {
    fields: [toolCheckouts.toolId],
    references: [tools.id]
  }),
  operario: one(operarios, {
    fields: [toolCheckouts.operarioId],
    references: [operarios.id]
  })
}));
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  operarios,
  operariosRelations,
  toolCategories,
  toolCategoriesRelations,
  toolCheckouts,
  toolCheckoutsRelations,
  tools,
  toolsRelations
}, Symbol.toStringTag, { value: "Module" }));
const uri = process.env.DATABASE_URL;
if (!uri) {
  throw new Error("DATABASE_URL no configurada");
}
const connection = mysql.createPool({ uri, ssl: false });
drizzle(connection, { schema, mode: "default" });
const testConnection = async (req, res) => {
  try {
    const [result] = await connection.execute("SELECT 1 as test");
    const [tables] = await connection.execute("SHOW TABLES");
    const [operarios2] = await connection.execute("SELECT COUNT(*) as count FROM operarios");
    res.json({
      success: true,
      connection: "OK",
      testQuery: result,
      tables,
      operariosCount: operarios2
    });
  } catch (error) {
    console.error("Database test failed:", error);
    res.status(500).json({
      error: "Database test failed",
      details: error.message
    });
  }
};
const getSimpleOperarios = async (req, res) => {
  try {
    const [operarios2] = await connection.execute("SELECT * FROM operarios ORDER BY created_at DESC");
    res.json(operarios2);
  } catch (error) {
    console.error("Error fetching operarios:", error);
    res.status(500).json({
      error: "Failed to fetch operarios",
      details: error.message
    });
  }
};
const getSimpleTools = async (req, res) => {
  try {
    const [tools2] = await connection.execute("SELECT * FROM tools_inventory ORDER BY id DESC LIMIT 20");
    res.json(tools2);
  } catch (error) {
    console.error("Error fetching tools:", error);
    res.status(500).json({
      error: "Failed to fetch tools",
      details: error.message
    });
  }
};
const getTableStructure = async (req, res) => {
  try {
    const { table } = req.params;
    const [columns] = await connection.execute(`DESCRIBE ${table}`);
    res.json(columns);
  } catch (error) {
    console.error("Error getting table structure:", error);
    res.status(500).json({
      error: "Failed to get table structure",
      details: error.message
    });
  }
};
const getAllTables = async (req, res) => {
  try {
    const [tables] = await connection.execute("SHOW TABLES");
    res.json(tables);
  } catch (error) {
    console.error("Error getting tables:", error);
    res.status(500).json({
      error: "Failed to get tables",
      details: error.message
    });
  }
};
const getAllTools = async (req, res) => {
  try {
    const [tools2] = await connection.execute(`
      SELECT
        id,
        name,
        description,
        category_id,
        type,
        total_quantity,
        available_quantity,
        in_use_quantity,
        maintenance_quantity,
        unit_cost,
        location,
        minimum_stock,
        notes,
        created_at,
        updated_at
      FROM tools_inventory
      ORDER BY name ASC
    `);
    res.set({ "Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache", "Expires": "0" });
    res.json({
      success: true,
      tools: tools2
    });
  } catch (error) {
    console.error("Error fetching tools inventory:", error);
    res.status(500).json({
      error: "Failed to fetch tools inventory",
      details: error.message
    });
  }
};
const getAvailableTools = async (req, res) => {
  try {
    const [tools2] = await connection.execute(`
      SELECT
        id,
        name,
        description,
        category_id,
        type,
        available_quantity,
        unit_cost,
        location
      FROM tools_inventory
      WHERE available_quantity > 0
      ORDER BY category_id, name ASC
    `);
    res.set({ "Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache", "Expires": "0" });
    res.json({
      success: true,
      tools: tools2
    });
  } catch (error) {
    console.error("Error fetching available tools:", error);
    res.status(500).json({
      error: "Failed to fetch available tools",
      details: error.message
    });
  }
};
const authenticateOperario = async (req, res) => {
  try {
    const { operarioCode } = req.body;
    if (!operarioCode) {
      return res.status(400).json({ error: "Código de operario requerido" });
    }
    const [operario] = await connection.execute(
      "SELECT id, name, operario_code, role, active FROM operarios WHERE operario_code = ? AND active = TRUE",
      [operarioCode]
    );
    if (operario.length === 0) {
      return res.status(401).json({ error: "Código de operario inválido" });
    }
    res.json({
      success: true,
      operario: operario[0]
    });
  } catch (error) {
    console.error("Error authenticating operario:", error);
    res.status(500).json({
      error: "Error de autenticación",
      details: error.message
    });
  }
};
const checkoutTool = async (req, res) => {
  try {
    const { toolId, operarioCode, quantity, project } = req.body;
    if (!toolId || !operarioCode || !quantity) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    const [operario] = await connection.execute(
      "SELECT id, name FROM operarios WHERE operario_code = ? AND active = TRUE",
      [operarioCode]
    );
    if (operario.length === 0) {
      return res.status(401).json({ error: "Código de operario inválido" });
    }
    const operarioData = operario[0];
    const [tool] = await connection.execute(
      "SELECT * FROM tools_inventory WHERE id = ?",
      [toolId]
    );
    if (tool.length === 0) {
      return res.status(404).json({ error: "Herramienta no encontrada" });
    }
    const toolData = tool[0];
    if (toolData.available_quantity < quantity) {
      return res.status(400).json({
        error: `Cantidad insuficiente. Disponible: ${toolData.available_quantity}`
      });
    }
    const newAvailable = toolData.available_quantity - quantity;
    const newInUse = toolData.in_use_quantity + quantity;
    await connection.execute(
      "UPDATE tools_inventory SET available_quantity = ?, in_use_quantity = ?, updated_at = NOW() WHERE id = ?",
      [newAvailable, newInUse, toolId]
    );
    await connection.execute(
      "INSERT INTO tool_transactions (tool_id, operario_id, transaction_type, quantity, previous_available, new_available, project, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [toolId, operarioData.id, "checkout", quantity, toolData.available_quantity, newAvailable, project || null]
    );
    res.json({
      success: true,
      message: `${quantity} unidad(es) de ${toolData.name} asignada(s) correctamente`,
      tool: toolData.name,
      operario: operarioData.name,
      quantity,
      remainingStock: newAvailable
    });
  } catch (error) {
    console.error("Error checking out tool:", error);
    res.status(500).json({
      error: "Error al asignar herramienta",
      details: error.message
    });
  }
};
const checkinTool = async (req, res) => {
  try {
    const { toolId, operarioCode, quantity, project } = req.body;
    if (!toolId || !operarioCode || !quantity) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    const [operario] = await connection.execute(
      "SELECT id, name FROM operarios WHERE operario_code = ? AND active = TRUE",
      [operarioCode]
    );
    if (operario.length === 0) {
      return res.status(401).json({ error: "Código de operario inválido" });
    }
    const operarioData = operario[0];
    const [tool] = await connection.execute(
      "SELECT * FROM tools_inventory WHERE id = ?",
      [toolId]
    );
    if (tool.length === 0) {
      return res.status(404).json({ error: "Herramienta no encontrada" });
    }
    const toolData = tool[0];
    if (toolData.in_use_quantity < quantity) {
      return res.status(400).json({
        error: `Cantidad inválida. En uso: ${toolData.in_use_quantity}`
      });
    }
    const newAvailable = toolData.available_quantity + quantity;
    const newInUse = toolData.in_use_quantity - quantity;
    await connection.execute(
      "UPDATE tools_inventory SET available_quantity = ?, in_use_quantity = ?, updated_at = NOW() WHERE id = ?",
      [newAvailable, newInUse, toolId]
    );
    await connection.execute(
      "INSERT INTO tool_transactions (tool_id, operario_id, transaction_type, quantity, previous_available, new_available, project, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
      [toolId, operarioData.id, "checkin", quantity, toolData.available_quantity, newAvailable, project || null]
    );
    res.json({
      success: true,
      message: `${quantity} unidad(es) de ${toolData.name} devuelta(s) correctamente`,
      tool: toolData.name,
      operario: operarioData.name,
      quantity,
      newStock: newAvailable
    });
  } catch (error) {
    console.error("Error checking in tool:", error);
    res.status(500).json({
      error: "Error al devolver herramienta",
      details: error.message
    });
  }
};
const addTool = async (req, res) => {
  try {
    const { name, description, category_id, type, total_quantity, unit_cost, location, minimum_stock, notes } = req.body;
    if (!name || !category_id || !type || !total_quantity) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    await connection.execute(
      "INSERT INTO tools_inventory (name, description, category_id, type, total_quantity, available_quantity, in_use_quantity, maintenance_quantity, unit_cost, location, minimum_stock, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, NOW(), NOW())",
      [
        name,
        description || null,
        category_id,
        type,
        total_quantity,
        total_quantity,
        // available_quantity starts as total_quantity
        unit_cost || 0,
        location || "Almacén Central",
        minimum_stock || 1,
        notes || null
      ]
    );
    res.json({
      success: true,
      message: `Herramienta ${name} añadida al inventario con ${total_quantity} unidades`
    });
  } catch (error) {
    console.error("Error adding tool to inventory:", error);
    res.status(500).json({
      error: "Error al añadir herramienta",
      details: error.message
    });
  }
};
const getInventoryStats = async (req, res) => {
  try {
    const [totalTools] = await connection.execute("SELECT COUNT(*) as count FROM tools_inventory");
    const [totalQuantity] = await connection.execute("SELECT SUM(total_quantity) as total FROM tools_inventory");
    const [availableQuantity] = await connection.execute("SELECT SUM(available_quantity) as available FROM tools_inventory");
    const [inUseQuantity] = await connection.execute("SELECT SUM(in_use_quantity) as inUse FROM tools_inventory");
    const [maintenanceQuantity] = await connection.execute("SELECT SUM(maintenance_quantity) as maintenance FROM tools_inventory");
    const [lowStockTools] = await connection.execute("SELECT COUNT(*) as count FROM tools_inventory WHERE available_quantity <= minimum_stock");
    const [activeOperarios] = await connection.execute("SELECT COUNT(*) as count FROM operarios WHERE active = 1");
    const stats = {
      totalToolTypes: totalTools[0].count,
      totalQuantity: totalQuantity[0].total || 0,
      availableQuantity: availableQuantity[0].available || 0,
      inUseQuantity: inUseQuantity[0].inUse || 0,
      maintenanceQuantity: maintenanceQuantity[0].maintenance || 0,
      lowStockTools: lowStockTools[0].count,
      activeOperarios: activeOperarios[0].count
    };
    res.set({ "Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache", "Expires": "0" });
    res.json(stats);
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    res.status(500).json({
      error: "Error al obtener estadísticas",
      details: error.message
    });
  }
};
const getRecentTransactions = async (req, res) => {
  try {
    const [transactions] = await connection.execute(`
      SELECT
        tt.id,
        tt.transaction_type,
        tt.quantity,
        tt.previous_available,
        tt.new_available,
        tt.project,
        tt.created_at,
        ti.name as tool_name,
        ti.location as tool_location,
        ti.category_id as category_id,
        tc.name as category_name,
        tc.color as category_color,
        tc.type as category_type,
        oi.name as operario_name,
        oi.email as operario_email
      FROM tool_transactions tt
      LEFT JOIN tools_inventory ti ON tt.tool_id = ti.id
      LEFT JOIN tool_categories tc ON tc.id = ti.category_id
      LEFT JOIN operarios oi ON tt.operario_id = oi.id
      ORDER BY tt.created_at DESC
      LIMIT 20
    `);
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      type: t.transaction_type,
      tool: t.tool_name || "Unknown Tool",
      operario: t.operario_name || "Unknown Operario",
      operarioEmail: t.operario_email || "Sin email",
      location: t.tool_location || null,
      categoryId: t.category_id || null,
      categoryName: t.category_name || null,
      categoryColor: t.category_color || null,
      categoryType: t.category_type || null,
      quantity: t.quantity,
      timestamp: formatTimestamp(t.created_at),
      project: t.project,
      stockChange: `${t.previous_available} → ${t.new_available}`
    }));
    res.set({ "Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache", "Expires": "0" });
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({
      error: "Error al obtener transacciones",
      details: error.message
    });
  }
};
const getTypeCounters = async (_req, res) => {
  try {
    const [inUseRows] = await connection.execute(
      `SELECT type, COALESCE(SUM(in_use_quantity), 0) AS in_use
       FROM tools_inventory
       GROUP BY type`
    );
    const [returnedRows] = await connection.execute(
      `SELECT ti.type AS type, COALESCE(SUM(tt.quantity), 0) AS returned
       FROM tool_transactions tt
       JOIN tools_inventory ti ON ti.id = tt.tool_id
       WHERE tt.transaction_type = 'checkin'
       GROUP BY ti.type`
    );
    const counters = {
      individual: { inUse: 0, returned: 0 },
      common: { inUse: 0, returned: 0 }
    };
    inUseRows.forEach((r) => {
      if (r.type === "individual" || r.type === "common") {
        counters[r.type].inUse = Number(r.in_use) || 0;
      }
    });
    returnedRows.forEach((r) => {
      if (r.type === "individual" || r.type === "common") {
        counters[r.type].returned = Number(r.returned) || 0;
      }
    });
    res.json({ success: true, counters });
  } catch (error) {
    console.error("Error fetching type counters:", error);
    res.status(500).json({ error: "Error al obtener contadores por tipo", details: error.message });
  }
};
const updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, total_quantity, unit_cost, location, minimum_stock, notes } = req.body;
    if (!name || !category_id) {
      return res.status(400).json({ error: "Nombre y categoría son requeridos" });
    }
    const [currentTool] = await connection.execute(
      "SELECT total_quantity, in_use_quantity, maintenance_quantity FROM tools_inventory WHERE id = ?",
      [id]
    );
    if (currentTool.length === 0) {
      return res.status(404).json({ error: "Herramienta no encontrada" });
    }
    const toolData = currentTool[0];
    const newAvailableQuantity = total_quantity - toolData.in_use_quantity - toolData.maintenance_quantity;
    if (newAvailableQuantity < 0) {
      return res.status(400).json({
        error: "La cantidad total no puede ser menor que las herramientas en uso y mantenimiento"
      });
    }
    await connection.execute(
      "UPDATE tools_inventory SET name = ?, description = ?, category_id = ?, total_quantity = ?, available_quantity = ?, unit_cost = ?, location = ?, minimum_stock = ?, notes = ?, updated_at = NOW() WHERE id = ?",
      [name, description || null, category_id, total_quantity, newAvailableQuantity, unit_cost || 0, location || "Almacén Central", minimum_stock || 1, notes || null, id]
    );
    res.json({
      success: true,
      message: `Herramienta ${name} actualizada exitosamente`
    });
  } catch (error) {
    console.error("Error updating tool:", error);
    res.status(500).json({
      error: "Error al actualizar herramienta",
      details: error.message
    });
  }
};
const deleteTool = async (req, res) => {
  try {
    const { id } = req.params;
    const [tool] = await connection.execute(
      "SELECT name, in_use_quantity FROM tools_inventory WHERE id = ?",
      [id]
    );
    if (tool.length === 0) {
      return res.status(404).json({ error: "Herramienta no encontrada" });
    }
    const toolData = tool[0];
    if (toolData.in_use_quantity > 0) {
      return res.status(400).json({
        error: "No se puede eliminar una herramienta que está en uso"
      });
    }
    await connection.execute("DELETE FROM tool_transactions WHERE tool_id = ?", [id]);
    await connection.execute("DELETE FROM tools_inventory WHERE id = ?", [id]);
    res.json({
      success: true,
      message: `Herramienta ${toolData.name} y su historial fueron eliminados`
    });
  } catch (error) {
    console.error("Error deleting tool:", error);
    res.status(500).json({
      error: "Error al eliminar herramienta",
      details: error.message
    });
  }
};
function formatTimestamp(date) {
  if (!date) return "Unknown";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1e3 * 60));
  const diffInHours = Math.floor(diffInMs / (1e3 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1e3 * 60 * 60 * 24));
  if (diffInMinutes < 1) return "Ahora mismo";
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;
  return dateObj.toLocaleDateString("es-ES");
}
const SECRET = process.env.NEXT_AUTH_SECRET || "NjAFELjMxFZRngffrSylau0suRtRZ/fIMdmB6UQ6Ie8=";
const LEGACY_SECRET = "NjAFELjMxFZRngffrSylau0suRtRZ/fIMdmB6UQ6Ie8=";
function encryptPassword(password, secret = SECRET) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(password);
  return hmac.digest("hex");
}
function verifyPassword(password, encryptedPassword) {
  if (encryptPassword(password, SECRET) === encryptedPassword) return true;
  if (encryptPassword(password, LEGACY_SECRET) === encryptedPassword) return true;
  return false;
}
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }
    const [rows] = await connection.execute(
      "SELECT id, username, email, password_hash, active FROM users WHERE email = ? AND active = TRUE",
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    const user = rows[0];
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
const getCurrentUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const [users] = await connection.execute(
      "SELECT id, username, email, active FROM users WHERE id = ? AND active = TRUE",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const user = users[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
const logoutUser = async (req, res) => {
  res.json({ success: true, message: "Sesión cerrada correctamente" });
};
const getAllCategories = async (req, res) => {
  try {
    const [categories] = await connection.execute(`
      SELECT 
        id,
        name,
        description,
        type,
        color,
        active,
        created_at,
        updated_at
      FROM tool_categories 
      WHERE active = TRUE
      ORDER BY type, name ASC
    `);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message
    });
  }
};
const getCategoriesByType = async (req, res) => {
  try {
    const { type } = req.params;
    const [categories] = await connection.execute(`
      SELECT 
        id,
        name,
        description,
        type,
        color,
        active,
        created_at,
        updated_at
      FROM tool_categories 
      WHERE active = TRUE AND type = ?
      ORDER BY name ASC
    `, [type]);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories by type:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message
    });
  }
};
const createCategory = async (req, res) => {
  try {
    const { name, description, type, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Nombre y tipo son requeridos" });
    }
    if (!["individual", "common"].includes(type)) {
      return res.status(400).json({ error: 'Tipo debe ser "individual" o "common"' });
    }
    const [existing] = await connection.execute(
      "SELECT id FROM tool_categories WHERE name = ? AND type = ? AND active = TRUE",
      [name, type]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Ya existe una categoría con este nombre para este tipo" });
    }
    const [result] = await connection.execute(
      "INSERT INTO tool_categories (name, description, type, color, active, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [name, description || null, type, color || "#E2372B", true]
    );
    res.status(201).json({
      success: true,
      message: `Categoría "${name}" creada correctamente`,
      id: result.insertId
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      error: "Error al crear categoría",
      details: error.message
    });
  }
};
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, color, active } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Nombre y tipo son requeridos" });
    }
    if (!["individual", "common"].includes(type)) {
      return res.status(400).json({ error: 'Tipo debe ser "individual" o "common"' });
    }
    const [existing] = await connection.execute(
      "SELECT id FROM tool_categories WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    const [duplicate] = await connection.execute(
      "SELECT id FROM tool_categories WHERE name = ? AND type = ? AND active = TRUE AND id != ?",
      [name, type, id]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ error: "Ya existe otra categoría con este nombre para este tipo" });
    }
    await connection.execute(
      "UPDATE tool_categories SET name = ?, description = ?, type = ?, color = ?, active = ?, updated_at = NOW() WHERE id = ?",
      [name, description || null, type, color || "#E2372B", active !== void 0 ? active : true, id]
    );
    res.json({
      success: true,
      message: `Categoría "${name}" actualizada correctamente`
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      error: "Error al actualizar categoría",
      details: error.message
    });
  }
};
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await connection.execute(
      "SELECT name FROM tool_categories WHERE id = ? AND active = TRUE",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    const categoryName = existing[0].name;
    const [tools2] = await connection.execute(
      "SELECT COUNT(*) as count FROM tools_inventory WHERE category_id = ?",
      [id]
    );
    const toolCount = tools2[0].count;
    if (toolCount > 0) {
      return res.status(400).json({
        error: `No se puede eliminar la categoría "${categoryName}" porque tiene ${toolCount} herramienta(s) asignada(s)`
      });
    }
    await connection.execute(
      "UPDATE tool_categories SET active = FALSE, updated_at = NOW() WHERE id = ?",
      [id]
    );
    res.json({
      success: true,
      message: `Categoría "${categoryName}" eliminada correctamente`
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      error: "Error al eliminar categoría",
      details: error.message
    });
  }
};
const getCategoryStats = async (req, res) => {
  try {
    const [stats] = await connection.execute(`
      SELECT 
        tc.id,
        tc.name,
        tc.type,
        tc.color,
        COUNT(ti.id) as tool_count,
        COALESCE(SUM(ti.total_quantity), 0) as total_quantity,
        COALESCE(SUM(ti.available_quantity), 0) as available_quantity,
        COALESCE(SUM(ti.in_use_quantity), 0) as in_use_quantity
      FROM tool_categories tc
      LEFT JOIN tools_inventory ti ON tc.id = ti.category_id
      WHERE tc.active = TRUE
      GROUP BY tc.id, tc.name, tc.type, tc.color
      ORDER BY tc.type, tc.name
    `);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({
      error: "Error al obtener estadísticas de categorías",
      details: error.message
    });
  }
};
const checkAndCreateAdmin = async (req, res) => {
  try {
    console.log("🔍 Verificando usuario administrador...");
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'nibex' AND TABLE_NAME = 'users'
    `);
    if (tables.length === 0) {
      console.log("❌ Tabla users no existe. Creándola...");
      await connection.execute(`
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Tabla users creada");
    }
    const [existingAdmin] = await connection.execute(
      "SELECT id, email, username, password_hash FROM users WHERE email = ?",
      ["admin@nibexinstalacions.com"]
    );
    if (existingAdmin.length === 0) {
      console.log("❌ Usuario administrador no existe. Creándolo...");
      const hashedPassword = encryptPassword("C@t4luny4");
      await connection.execute(`
        INSERT INTO users (username, email, password_hash, active) VALUES
        ('admin', 'admin@nibexinstalacions.com', ?, TRUE)
      `, [hashedPassword]);
      console.log("✅ Usuario administrador creado");
      console.log("   Email: admin@nibexinstalacions.com");
      console.log("   Password: C@t4luny4");
      res.json({
        success: true,
        message: "Usuario administrador creado correctamente",
        user: {
          email: "admin@nibexinstalacions.com",
          username: "admin",
          role: "admin"
        }
      });
    } else {
      console.log("✅ Usuario administrador ya existe");
      const admin = existingAdmin[0];
      if (!admin.password_hash || admin.password_hash.length !== 64 || !/^[0-9a-f]+$/i.test(admin.password_hash)) {
        const newHash = encryptPassword(String(admin.password_hash || "C@t4luny4"));
        await connection.execute(
          "UPDATE users SET password_hash = ? WHERE id = ?",
          [newHash, admin.id]
        );
        admin.password_hash = newHash;
      }
      res.json({
        success: true,
        message: "Usuario administrador ya existe",
        user: {
          id: admin.id,
          email: admin.email,
          username: admin.username
        }
      });
    }
  } catch (error) {
    console.error("❌ Error configurando usuario administrador:", error);
    res.status(500).json({
      error: "Error configurando usuario administrador",
      details: error.message
    });
  }
};
const ensureAdminHash = async (_req, res) => {
  try {
    const [rows] = await connection.execute(
      "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
      ["admin@nibexinstalacions.com"]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Admin no existe" });
    }
    const admin = rows[0];
    const looksHashed = typeof admin.password_hash === "string" && /^[0-9a-f]{64}$/i.test(admin.password_hash);
    if (!looksHashed) {
      const newHash = encryptPassword("C@t4luny4");
      await connection.execute("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, admin.id]);
      return res.json({ success: true, updated: true });
    }
    return res.json({ success: true, updated: false });
  } catch (e) {
    console.error("ensureAdminHash error:", e);
    return res.status(500).json({ success: false, error: e.message });
  }
};
const testLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Testing login for:", email);
    const [users] = await connection.execute(
      "SELECT id, username, email, password_hash, active FROM users WHERE email = ? AND active = TRUE",
      [email]
    );
    if (users.length === 0) {
      console.log("❌ Usuario no encontrado:", email);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const user = users[0];
    console.log("✅ Usuario encontrado:", {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      stored_password: user.password_hash,
      provided_password: password
    });
    if (user.password_hash === password) {
      console.log("✅ Contraseña correcta");
      res.json({
        success: true,
        message: "Login exitoso",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } else {
      console.log("❌ Contraseña incorrecta");
      res.status(401).json({ error: "Contraseña incorrecta" });
    }
  } catch (error) {
    console.error("Error testing login:", error);
    res.status(500).json({
      error: "Error testing login",
      details: error.message
    });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const [users] = await connection.execute(`
      SELECT id, username, email,
             CASE WHEN active = 1 THEN 'ACTIVE' ELSE 'INACTIVE' END as active,
             created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener usuarios"
    });
  }
};
const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Nombre de usuario y contraseña son requeridos"
      });
    }
    const [existingUsername] = await connection.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        error: "El nombre de usuario ya existe"
      });
    }
    if (email) {
      const [existingEmail] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );
      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          error: "El email ya existe"
        });
      }
    }
    const hashedPassword = encryptPassword(password);
    const [result] = await connection.execute(
      "INSERT INTO users (username, email, password_hash, active) VALUES (?, ?, ?, TRUE)",
      [username, email, hashedPassword]
    );
    res.json({
      success: true,
      message: "Usuario creado exitosamente",
      userId: result.insertId
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "Error al crear usuario"
    });
  }
};
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;
    if (!username) {
      return res.status(400).json({
        success: false,
        error: "Nombre de usuario es requerido"
      });
    }
    const [existingUser] = await connection.execute(
      "SELECT id, username FROM users WHERE id = ?",
      [id]
    );
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }
    const [usernameCheck] = await connection.execute(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, id]
    );
    if (usernameCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: "El nombre de usuario ya está registrado"
      });
    }
    if (email) {
      const [emailCheck] = await connection.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );
      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          error: "El email ya está registrado"
        });
      }
    }
    let updateQuery = "UPDATE users SET username = ?, email = ?";
    let updateParams = [username, email];
    if (password) {
      const hashedPassword = encryptPassword(password);
      updateQuery += ", password_hash = ?";
      updateParams.push(hashedPassword);
    }
    updateQuery += " WHERE id = ?";
    updateParams.push(id);
    await connection.execute(updateQuery, updateParams);
    res.json({
      success: true,
      message: "Usuario actualizado exitosamente"
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Error al actualizar usuario"
    });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [existingUser] = await connection.execute(
      "SELECT id, username FROM users WHERE id = ?",
      [id]
    );
    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }
    const user = existingUser[0];
    if (user.username === "admin") {
      return res.status(400).json({
        success: false,
        error: "No se puede eliminar el usuario administrador principal"
      });
    }
    await connection.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({
      success: true,
      message: "Usuario eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar usuario"
    });
  }
};
const getOperarios = async (req, res) => {
  try {
    const [operarios2] = await connection.execute(
      "SELECT id, name, email, operario_code, active, created_at FROM operarios ORDER BY created_at DESC"
    );
    res.json({
      success: true,
      operarios: operarios2
    });
  } catch (error) {
    console.error("Error getting operarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
const createOperario = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }
    const generateCode = () => Math.floor(1e3 + Math.random() * 9e3).toString();
    let operarioCode = generateCode();
    let codeExists = true;
    while (codeExists) {
      const [existing] = await connection.execute(
        "SELECT COUNT(*) as count FROM operarios WHERE operario_code = ?",
        [operarioCode]
      );
      if (existing[0].count === 0) {
        codeExists = false;
      } else {
        operarioCode = generateCode();
      }
    }
    await connection.execute(
      "INSERT INTO operarios (name, email, operario_code, active) VALUES (?, ?, ?, TRUE)",
      [name, email || null, operarioCode]
    );
    res.json({
      success: true,
      message: "Operario creado exitosamente",
      operario: {
        name,
        email: email || null,
        operario_code: operarioCode
      }
    });
  } catch (error) {
    console.error("Error creating operario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "El email ya está en uso" });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
};
const updateOperario = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, active } = req.body;
    if (!name) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }
    await connection.execute(
      "UPDATE operarios SET name = ?, email = ?, active = ? WHERE id = ?",
      [name, email || null, active !== false, id]
    );
    res.json({
      success: true,
      message: "Operario actualizado exitosamente"
    });
  } catch (error) {
    console.error("Error updating operario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "El email ya está en uso" });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
};
const deleteOperario = async (req, res) => {
  try {
    const { id } = req.params;
    const [transactions] = await connection.execute(
      "SELECT COUNT(*) as count FROM tool_transactions WHERE operario_id = ?",
      [id]
    );
    if (transactions[0].count > 0) {
      await connection.execute(
        "UPDATE operarios SET active = FALSE WHERE id = ?",
        [id]
      );
      res.json({
        success: true,
        message: "Operario desactivado exitosamente (tiene historial de transacciones)"
      });
    } else {
      await connection.execute(
        "DELETE FROM operarios WHERE id = ?",
        [id]
      );
      res.json({
        success: true,
        message: "Operario eliminado exitosamente"
      });
    }
  } catch (error) {
    console.error("Error deleting operario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
const regenerateCode = async (req, res) => {
  try {
    const { id } = req.params;
    const generateCode = () => Math.floor(1e3 + Math.random() * 9e3).toString();
    let operarioCode = generateCode();
    let codeExists = true;
    while (codeExists) {
      const [existing] = await connection.execute(
        "SELECT COUNT(*) as count FROM operarios WHERE operario_code = ? AND id != ?",
        [operarioCode, id]
      );
      if (existing[0].count === 0) {
        codeExists = false;
      } else {
        operarioCode = generateCode();
      }
    }
    await connection.execute(
      "UPDATE operarios SET operario_code = ? WHERE id = ?",
      [operarioCode, id]
    );
    res.json({
      success: true,
      message: "Código regenerado exitosamente",
      operario_code: operarioCode
    });
  } catch (error) {
    console.error("Error regenerating code:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
const fixInventoryQuantities = async (req, res) => {
  try {
    const { toolId } = req.params;
    const [tools2] = await connection.execute(
      "SELECT * FROM tools_inventory WHERE id = ?",
      [toolId]
    );
    if (tools2.length === 0) {
      return res.status(404).json({ error: "Herramienta no encontrada" });
    }
    const tool = tools2[0];
    const [transactions] = await connection.execute(`
      SELECT 
        transaction_type,
        SUM(quantity) as total_quantity
      FROM tool_transactions 
      WHERE tool_id = ?
      GROUP BY transaction_type
    `, [toolId]);
    let totalCheckout = 0;
    let totalCheckin = 0;
    transactions.forEach((t) => {
      if (t.transaction_type === "checkout") {
        totalCheckout = t.total_quantity;
      } else if (t.transaction_type === "checkin") {
        totalCheckin = t.total_quantity;
      }
    });
    const currentInUse = totalCheckout - totalCheckin;
    const currentAvailable = tool.total_quantity - currentInUse;
    await connection.execute(
      "UPDATE tools_inventory SET available_quantity = ?, in_use_quantity = ? WHERE id = ?",
      [currentAvailable, currentInUse, toolId]
    );
    res.json({
      success: true,
      message: "Cantidades corregidas",
      tool: tool.name,
      before: {
        available_quantity: tool.available_quantity,
        in_use_quantity: tool.in_use_quantity
      },
      after: {
        available_quantity: currentAvailable,
        in_use_quantity: currentInUse
      },
      transactions: {
        total_checkout: totalCheckout,
        total_checkin: totalCheckin
      }
    });
  } catch (error) {
    console.error("Error fixing inventory quantities:", error);
    res.status(500).json({
      error: "Error al corregir cantidades",
      details: error.message
    });
  }
};
async function tableExists(table) {
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}
const setupDatabase = async (_req, res) => {
  try {
    const created = [];
    if (!await tableExists("users")) {
      await connection.execute(`
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push("users");
    }
    if (!await tableExists("operarios")) {
      await connection.execute(`
        CREATE TABLE operarios (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          operario_code VARCHAR(20) UNIQUE NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push("operarios");
    }
    if (!await tableExists("tool_categories")) {
      await connection.execute(`
        CREATE TABLE tool_categories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type ENUM('individual','common') NOT NULL,
          color VARCHAR(7) DEFAULT '#E2372B',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push("tool_categories");
    }
    if (!await tableExists("tools_inventory")) {
      await connection.execute(`
        CREATE TABLE tools_inventory (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category_id INT,
          type ENUM('individual','common') NOT NULL,
          total_quantity INT NOT NULL DEFAULT 0,
          available_quantity INT NOT NULL DEFAULT 0,
          in_use_quantity INT NOT NULL DEFAULT 0,
          maintenance_quantity INT NOT NULL DEFAULT 0,
          unit_cost DECIMAL(10,2),
          location VARCHAR(255) DEFAULT 'Almacén Central',
          minimum_stock INT DEFAULT 1,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push("tools_inventory");
    }
    if (!await tableExists("tool_transactions")) {
      await connection.execute(`
        CREATE TABLE tool_transactions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          tool_id INT NOT NULL,
          operario_id INT NOT NULL,
          transaction_type ENUM('checkout','checkin','maintenance','add_stock','remove_stock') NOT NULL,
          quantity INT NOT NULL,
          previous_available INT NOT NULL,
          new_available INT NOT NULL,
          project VARCHAR(255),
          destination VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push("tool_transactions");
    }
    res.json({ success: true, created });
  } catch (err) {
    console.error("DB setup error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
function createServer() {
  const app2 = express();
  app2.use(cors());
  app2.use(express.json());
  app2.use(express.urlencoded({ extended: true }));
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/demo", handleDemo);
  app2.get("/api/test/connection", testConnection);
  app2.get("/api/test/operarios", getSimpleOperarios);
  app2.get("/api/test/tools", getSimpleTools);
  app2.get("/api/debug/tables", getAllTables);
  app2.get("/api/debug/table/:table", getTableStructure);
  app2.post("/api/auth/login", loginUser);
  app2.get("/api/auth/user/:userId", getCurrentUser);
  app2.post("/api/auth/logout", logoutUser);
  app2.get("/api/admin/setup", checkAndCreateAdmin);
  app2.post("/api/admin/test-login", testLogin);
  app2.post("/api/admin/ensure-admin-hash", ensureAdminHash);
  app2.get("/api/admin/ensure-admin-hash", ensureAdminHash);
  app2.post("/api/db/setup", setupDatabase);
  app2.get("/api/db/setup", setupDatabase);
  app2.get("/api/operarios", getOperarios);
  app2.post("/api/operarios", createOperario);
  app2.put("/api/operarios/:id", updateOperario);
  app2.delete("/api/operarios/:id", deleteOperario);
  app2.post("/api/operarios/:id/regenerate-code", regenerateCode);
  app2.get("/api/admin/users", getAllUsers);
  app2.post("/api/admin/users", createUser);
  app2.put("/api/admin/users/:id", updateUser);
  app2.delete("/api/admin/users/:id", deleteUser);
  app2.get("/api/categories", getAllCategories);
  app2.get("/api/categories/type/:type", getCategoriesByType);
  app2.get("/api/categories/stats", getCategoryStats);
  app2.post("/api/categories", createCategory);
  app2.put("/api/categories/:id", updateCategory);
  app2.delete("/api/categories/:id", deleteCategory);
  app2.get("/api/inventory/tools", getAllTools);
  app2.get("/api/inventory/available", getAvailableTools);
  app2.post("/api/inventory/auth", authenticateOperario);
  app2.post("/api/inventory/checkout", checkoutTool);
  app2.post("/api/inventory/checkin", checkinTool);
  app2.post("/api/inventory/add", addTool);
  app2.put("/api/inventory/tools/:id", updateTool);
  app2.delete("/api/inventory/tools/:id", deleteTool);
  app2.get("/api/inventory/stats", getInventoryStats);
  app2.get("/api/inventory/transactions", getRecentTransactions);
  app2.get("/api/inventory/type-counters", getTypeCounters);
  app2.post("/api/inventory/fix/:toolId", fixInventoryQuantities);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
