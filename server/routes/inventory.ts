import { RequestHandler } from "express";
import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

// Get all tools with quantities
export const getAllTools: RequestHandler = async (req, res) => {
  try {
    const [tools] = await connection.execute(`
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

    res.json({
      success: true,
      tools: tools
    });
  } catch (error) {
    console.error('Error fetching tools inventory:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tools inventory',
      details: error.message 
    });
  }
};

// Get available tools (with stock > 0)
export const getAvailableTools: RequestHandler = async (req, res) => {
  try {
    const [tools] = await connection.execute(`
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

    res.json({
      success: true,
      tools: tools
    });
  } catch (error) {
    console.error('Error fetching available tools:', error);
    res.status(500).json({ 
      error: 'Failed to fetch available tools',
      details: error.message 
    });
  }
};

// Authenticate operario by code
export const authenticateOperario: RequestHandler = async (req, res) => {
  try {
    const { operarioCode } = req.body;

    if (!operarioCode) {
      return res.status(400).json({ error: 'Código de operario requerido' });
    }

    const [operario] = await connection.execute(
      'SELECT id, name, operario_code, role, active FROM operarios WHERE operario_code = ? AND active = TRUE',
      [operarioCode]
    );

    if ((operario as any[]).length === 0) {
      return res.status(401).json({ error: 'Código de operario inválido' });
    }

    res.json({
      success: true,
      operario: (operario as any[])[0]
    });
  } catch (error) {
    console.error('Error authenticating operario:', error);
    res.status(500).json({ 
      error: 'Error de autenticación',
      details: error.message 
    });
  }
};

// Checkout tool (reduce quantity)
export const checkoutTool: RequestHandler = async (req, res) => {
  try {
    const { toolId, operarioCode, quantity, project } = req.body;

    if (!toolId || !operarioCode || !quantity) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Authenticate operario
    const [operario] = await connection.execute(
      'SELECT id, name FROM operarios WHERE operario_code = ? AND active = TRUE',
      [operarioCode]
    );

    if ((operario as any[]).length === 0) {
      return res.status(401).json({ error: 'Código de operario inválido' });
    }

    const operarioData = (operario as any[])[0];

    // Get tool current quantities
    const [tool] = await connection.execute(
      'SELECT * FROM tools_inventory WHERE id = ?',
      [toolId]
    );

    if ((tool as any[]).length === 0) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    const toolData = (tool as any[])[0];

    if (toolData.available_quantity < quantity) {
      return res.status(400).json({ 
        error: `Cantidad insuficiente. Disponible: ${toolData.available_quantity}` 
      });
    }

    // Update quantities
    const newAvailable = toolData.available_quantity - quantity;
    const newInUse = toolData.in_use_quantity + quantity;

    await connection.execute(
      'UPDATE tools_inventory SET available_quantity = ?, in_use_quantity = ?, updated_at = NOW() WHERE id = ?',
      [newAvailable, newInUse, toolId]
    );

    // Record transaction
    await connection.execute(
      'INSERT INTO tool_transactions (tool_id, operario_id, transaction_type, quantity, previous_available, new_available, project, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [toolId, operarioData.id, 'checkout', quantity, toolData.available_quantity, newAvailable, project || null]
    );

    res.json({
      success: true,
      message: `${quantity} unidad(es) de ${toolData.name} asignada(s) correctamente`,
      tool: toolData.name,
      operario: operarioData.name,
      quantity: quantity,
      remainingStock: newAvailable
    });
  } catch (error) {
    console.error('Error checking out tool:', error);
    res.status(500).json({ 
      error: 'Error al asignar herramienta',
      details: error.message 
    });
  }
};

// Checkin tool (increase quantity)
export const checkinTool: RequestHandler = async (req, res) => {
  try {
    const { toolId, operarioCode, quantity, project } = req.body;

    if (!toolId || !operarioCode || !quantity) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Authenticate operario
    const [operario] = await connection.execute(
      'SELECT id, name FROM operarios WHERE operario_code = ? AND active = TRUE',
      [operarioCode]
    );

    if ((operario as any[]).length === 0) {
      return res.status(401).json({ error: 'Código de operario inválido' });
    }

    const operarioData = (operario as any[])[0];

    // Get tool current quantities
    const [tool] = await connection.execute(
      'SELECT * FROM tools_inventory WHERE id = ?',
      [toolId]
    );

    if ((tool as any[]).length === 0) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    const toolData = (tool as any[])[0];

    if (toolData.in_use_quantity < quantity) {
      return res.status(400).json({ 
        error: `Cantidad inválida. En uso: ${toolData.in_use_quantity}` 
      });
    }

    // Update quantities
    const newAvailable = toolData.available_quantity + quantity;
    const newInUse = toolData.in_use_quantity - quantity;

    await connection.execute(
      'UPDATE tools_inventory SET available_quantity = ?, in_use_quantity = ?, updated_at = NOW() WHERE id = ?',
      [newAvailable, newInUse, toolId]
    );

    // Record transaction
    await connection.execute(
      'INSERT INTO tool_transactions (tool_id, operario_id, transaction_type, quantity, previous_available, new_available, project, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [toolId, operarioData.id, 'checkin', quantity, toolData.available_quantity, newAvailable, project || null]
    );

    res.json({
      success: true,
      message: `${quantity} unidad(es) de ${toolData.name} devuelta(s) correctamente`,
      tool: toolData.name,
      operario: operarioData.name,
      quantity: quantity,
      newStock: newAvailable
    });
  } catch (error) {
    console.error('Error checking in tool:', error);
    res.status(500).json({ 
      error: 'Error al devolver herramienta',
      details: error.message 
    });
  }
};

// Add new tool to inventory
export const addTool: RequestHandler = async (req, res) => {
  try {
    const { name, description, category_id, type, total_quantity, unit_cost, location, minimum_stock, notes } = req.body;

    if (!name || !category_id || !type || !total_quantity) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    await connection.execute(
      'INSERT INTO tools_inventory (name, description, category_id, type, total_quantity, available_quantity, in_use_quantity, maintenance_quantity, unit_cost, location, minimum_stock, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, NOW(), NOW())',
      [
        name,
        description || null,
        category_id,
        type,
        total_quantity,
        total_quantity, // available_quantity starts as total_quantity
        unit_cost || 0,
        location || 'Almacén Central',
        minimum_stock || 1,
        notes || null
      ]
    );

    res.json({
      success: true,
      message: `Herramienta ${name} añadida al inventario con ${total_quantity} unidades`
    });
  } catch (error) {
    console.error('Error adding tool to inventory:', error);
    res.status(500).json({ 
      error: 'Error al añadir herramienta',
      details: error.message 
    });
  }
};

// Get inventory dashboard stats
export const getInventoryStats: RequestHandler = async (req, res) => {
  try {
    const [totalTools] = await connection.execute('SELECT COUNT(*) as count FROM tools_inventory');
    const [totalQuantity] = await connection.execute('SELECT SUM(total_quantity) as total FROM tools_inventory');
    const [availableQuantity] = await connection.execute('SELECT SUM(available_quantity) as available FROM tools_inventory');
    const [inUseQuantity] = await connection.execute('SELECT SUM(in_use_quantity) as inUse FROM tools_inventory');
    const [maintenanceQuantity] = await connection.execute('SELECT SUM(maintenance_quantity) as maintenance FROM tools_inventory');
    const [lowStockTools] = await connection.execute('SELECT COUNT(*) as count FROM tools_inventory WHERE available_quantity <= minimum_stock');
    const [activeOperarios] = await connection.execute('SELECT COUNT(*) as count FROM operarios WHERE active = 1');

    const stats = {
      totalToolTypes: (totalTools as any[])[0].count,
      totalQuantity: (totalQuantity as any[])[0].total || 0,
      availableQuantity: (availableQuantity as any[])[0].available || 0,
      inUseQuantity: (inUseQuantity as any[])[0].inUse || 0,
      maintenanceQuantity: (maintenanceQuantity as any[])[0].maintenance || 0,
      lowStockTools: (lowStockTools as any[])[0].count,
      activeOperarios: (activeOperarios as any[])[0].count
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      details: error.message 
    });
  }
};

// Get recent transactions
export const getRecentTransactions: RequestHandler = async (req, res) => {
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
        oi.name as operario_name,
        oi.email as operario_email
      FROM tool_transactions tt
      LEFT JOIN tools_inventory ti ON tt.tool_id = ti.id
      LEFT JOIN operarios oi ON tt.operario_id = oi.id
      ORDER BY tt.created_at DESC
      LIMIT 20
    `);

    const formattedTransactions = (transactions as any[]).map(t => ({
      id: t.id,
      type: t.transaction_type,
      tool: t.tool_name || 'Unknown Tool',
      operario: t.operario_name || 'Unknown Operario',
      operarioEmail: t.operario_email || 'Sin email',
      quantity: t.quantity,
      timestamp: formatTimestamp(t.created_at),
      project: t.project,
      stockChange: `${t.previous_available} → ${t.new_available}`
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({ 
      error: 'Error al obtener transacciones',
      details: error.message 
    });
  }
};

// Update tool
export const updateTool: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, total_quantity, unit_cost, location, minimum_stock, notes } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
    }

    // Get current tool data to calculate new available quantity
    const [currentTool] = await connection.execute(
      'SELECT total_quantity, in_use_quantity, maintenance_quantity FROM tools_inventory WHERE id = ?',
      [id]
    );

    if ((currentTool as any[]).length === 0) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    const toolData = (currentTool as any[])[0];

    // Calculate new available quantity
    const newAvailableQuantity = total_quantity - toolData.in_use_quantity - toolData.maintenance_quantity;

    if (newAvailableQuantity < 0) {
      return res.status(400).json({
        error: 'La cantidad total no puede ser menor que las herramientas en uso y mantenimiento'
      });
    }

    await connection.execute(
      'UPDATE tools_inventory SET name = ?, description = ?, category_id = ?, total_quantity = ?, available_quantity = ?, unit_cost = ?, location = ?, minimum_stock = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [name, description || null, category_id, total_quantity, newAvailableQuantity, unit_cost || 0, location || 'Almacén Central', minimum_stock || 1, notes || null, id]
    );

    res.json({
      success: true,
      message: `Herramienta ${name} actualizada exitosamente`
    });
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({
      error: 'Error al actualizar herramienta',
      details: error.message
    });
  }
};

// Delete tool
export const deleteTool: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tool has any transactions
    const [transactions] = await connection.execute(
      'SELECT COUNT(*) as count FROM tool_transactions WHERE tool_id = ?',
      [id]
    );

    const transactionCount = (transactions as any[])[0].count;

    // Check if tool is currently in use
    const [tool] = await connection.execute(
      'SELECT name, in_use_quantity FROM tools_inventory WHERE id = ?',
      [id]
    );

    if ((tool as any[]).length === 0) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }

    const toolData = (tool as any[])[0];

    if (toolData.in_use_quantity > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar una herramienta que está en uso'
      });
    }

    // If has transactions, keep for history but mark as deleted
    if (transactionCount > 0) {
      await connection.execute(
        'UPDATE tools_inventory SET total_quantity = 0, available_quantity = 0, notes = CONCAT(COALESCE(notes, ""), " [ELIMINADA]"), updated_at = NOW() WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: `Herramienta ${toolData.name} marcada como eliminada (tiene historial de transacciones)`
      });
    } else {
      // Safe to delete completely
      await connection.execute('DELETE FROM tools_inventory WHERE id = ?', [id]);

      res.json({
        success: true,
        message: `Herramienta ${toolData.name} eliminada exitosamente`
      });
    }
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({
      error: 'Error al eliminar herramienta',
      details: error.message
    });
  }
};

// Helper function to format timestamp
function formatTimestamp(date: Date | string | null): string {
  if (!date) return 'Unknown';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;

  return dateObj.toLocaleDateString('es-ES');
}
