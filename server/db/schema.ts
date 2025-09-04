import { 
  mysqlTable, 
  varchar, 
  int, 
  decimal, 
  datetime, 
  text, 
  boolean,
  mysqlEnum,
  timestamp
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// Operarios table
export const operarios = mysqlTable('operarios', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  role: mysqlEnum('role', ['operario', 'supervisor', 'warehouse_manager']).default('operario'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tool categories table
export const toolCategories = mysqlTable('tool_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: mysqlEnum('type', ['individual', 'common']).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Tools table
export const tools = mysqlTable('tools', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['individual', 'common']).notNull(),
  categoryId: int('category_id'),
  assignedTo: int('assigned_to'),
  location: varchar('location', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['available', 'in_use', 'maintenance', 'missing']).default('available'),
  lastSeen: datetime('last_seen'),
  nextReview: datetime('next_review'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  qrCode: varchar('qr_code', { length: 255 }).unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tool checkout history table
export const toolCheckouts = mysqlTable('tool_checkouts', {
  id: int('id').primaryKey().autoincrement(),
  toolId: int('tool_id').notNull(),
  operarioId: int('operario_id').notNull(),
  checkedOutAt: datetime('checked_out_at').notNull(),
  checkedInAt: datetime('checked_in_at'),
  project: varchar('project', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow()
});

// Relations
export const operariosRelations = relations(operarios, ({ many }) => ({
  assignedTools: many(tools),
  checkouts: many(toolCheckouts),
}));

export const toolCategoriesRelations = relations(toolCategories, ({ many }) => ({
  tools: many(tools),
}));

export const toolsRelations = relations(tools, ({ one, many }) => ({
  category: one(toolCategories, {
    fields: [tools.categoryId],
    references: [toolCategories.id],
  }),
  assignedOperario: one(operarios, {
    fields: [tools.assignedTo],
    references: [operarios.id],
  }),
  checkouts: many(toolCheckouts),
}));

export const toolCheckoutsRelations = relations(toolCheckouts, ({ one }) => ({
  tool: one(tools, {
    fields: [toolCheckouts.toolId],
    references: [tools.id],
  }),
  operario: one(operarios, {
    fields: [toolCheckouts.operarioId],
    references: [operarios.id],
  }),
}));
