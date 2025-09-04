import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  checkoutTool,
  checkinTool,
  getDashboardStats,
  getRecentActivity
} from "./routes/simple-tools";
import { testConnection, getSimpleOperarios, getSimpleTools } from "./routes/test";
import { getTableStructure, getAllTables } from "./routes/debug";
import {
  getAllTools,
  getAvailableTools,
  authenticateOperario,
  checkoutTool as inventoryCheckout,
  checkinTool as inventoryCheckin,
  addTool,
  updateTool,
  deleteTool,
  getInventoryStats,
  getRecentTransactions
} from "./routes/inventory";
import { loginUser, getCurrentUser, logoutUser, createDefaultAdmin } from "./routes/auth";
import {
  getAllCategories,
  getCategoriesByType,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} from "./routes/categories";
import { checkAndCreateAdmin, getAllAdminUsers, testLogin } from "./routes/admin-setup";
import { createUserInUsersTable, getAllUsersFromUsersTable } from "./routes/user-setup";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from "./routes/users";
import {
  getOperarios,
  createOperario,
  updateOperario,
  deleteOperario,
  regenerateCode
} from "./routes/operarios-management";
import { fixInventoryQuantities } from "./routes/fix-inventory";
import { setupInventoryTables } from "./db/inventory-setup";
import { resetDatabase } from "./db/reset";
import { initializeDatabase } from "./db/init";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Setup admin user on server start
  fetch('http://localhost:8080/api/admin/setup')
    .then(response => response.json())
    .then(data => console.log('Admin setup result:', data.message))
    .catch(error => console.log('Admin setup will be available via API'));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Test endpoints
  app.get("/api/test/connection", testConnection);
  app.get("/api/test/operarios", getSimpleOperarios);
  app.get("/api/test/tools", getSimpleTools);

  // Debug endpoints
  app.get("/api/debug/tables", getAllTables);
  app.get("/api/debug/table/:table", getTableStructure);

  // Authentication routes
  app.post("/api/auth/login", loginUser);
  app.get("/api/auth/user/:userId", getCurrentUser);
  app.post("/api/auth/logout", logoutUser);

  // Admin setup routes
  app.get("/api/admin/setup", checkAndCreateAdmin);
  app.post("/api/admin/test-login", testLogin);

  // Operarios management routes
  app.get("/api/operarios", getOperarios);
  app.post("/api/operarios", createOperario);
  app.put("/api/operarios/:id", updateOperario);
  app.delete("/api/operarios/:id", deleteOperario);
  app.post("/api/operarios/:id/regenerate-code", regenerateCode);

  // Users management routes
  app.get("/api/admin/users", getAllUsers);
  app.post("/api/admin/users", createUser);
  app.put("/api/admin/users/:id", updateUser);
  app.delete("/api/admin/users/:id", deleteUser);

  // Categories API routes
  app.get("/api/categories", getAllCategories);
  app.get("/api/categories/type/:type", getCategoriesByType);
  app.get("/api/categories/stats", getCategoryStats);
  app.post("/api/categories", createCategory);
  app.put("/api/categories/:id", updateCategory);
  app.delete("/api/categories/:id", deleteCategory);

  // Inventory API routes
  app.get("/api/inventory/tools", getAllTools);
  app.get("/api/inventory/available", getAvailableTools);
  app.post("/api/inventory/auth", authenticateOperario);
  app.post("/api/inventory/checkout", inventoryCheckout);
  app.post("/api/inventory/checkin", inventoryCheckin);
  app.post("/api/inventory/add", addTool);
  app.put("/api/inventory/tools/:id", updateTool);
  app.delete("/api/inventory/tools/:id", deleteTool);
  app.get("/api/inventory/stats", getInventoryStats);
  app.get("/api/inventory/transactions", getRecentTransactions);

  // Fix inventory quantities
  app.post("/api/inventory/fix/:toolId", fixInventoryQuantities);

  return app;
}
