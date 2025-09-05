import { RequestHandler } from "express";
import { connection } from '../db/config';

// Get all categories
export const getAllCategories: RequestHandler = async (req, res) => {
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
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error.message 
    });
  }
};

// Get categories by type
export const getCategoriesByType: RequestHandler = async (req, res) => {
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
    console.error('Error fetching categories by type:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error.message 
    });
  }
};

// Create new category
export const createCategory: RequestHandler = async (req, res) => {
  try {
    const { name, description, type, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    }

    if (!['individual', 'common'].includes(type)) {
      return res.status(400).json({ error: 'Tipo debe ser "individual" o "common"' });
    }

    // Check if category with same name and type already exists
    const [existing] = await connection.execute(
      'SELECT id FROM tool_categories WHERE name = ? AND type = ? AND active = TRUE',
      [name, type]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'Ya existe una categoría con este nombre para este tipo' });
    }

    const [result] = await connection.execute(
      'INSERT INTO tool_categories (name, description, type, color, active, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, description || null, type, color || '#E2372B', true]
    );

    res.status(201).json({
      success: true,
      message: `Categoría "${name}" creada correctamente`,
      id: (result as any).insertId
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      error: 'Error al crear categoría',
      details: error.message 
    });
  }
};

// Update category
export const updateCategory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, color, active } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    }

    if (!['individual', 'common'].includes(type)) {
      return res.status(400).json({ error: 'Tipo debe ser "individual" o "common"' });
    }

    // Check if category exists
    const [existing] = await connection.execute(
      'SELECT id FROM tool_categories WHERE id = ?',
      [id]
    );

    if ((existing as any[]).length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Check if another category with same name and type exists
    const [duplicate] = await connection.execute(
      'SELECT id FROM tool_categories WHERE name = ? AND type = ? AND active = TRUE AND id != ?',
      [name, type, id]
    );

    if ((duplicate as any[]).length > 0) {
      return res.status(400).json({ error: 'Ya existe otra categoría con este nombre para este tipo' });
    }

    await connection.execute(
      'UPDATE tool_categories SET name = ?, description = ?, type = ?, color = ?, active = ?, updated_at = NOW() WHERE id = ?',
      [name, description || null, type, color || '#E2372B', active !== undefined ? active : true, id]
    );

    res.json({
      success: true,
      message: `Categoría "${name}" actualizada correctamente`
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ 
      error: 'Error al actualizar categoría',
      details: error.message 
    });
  }
};

// Delete category (soft delete)
export const deleteCategory: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const [existing] = await connection.execute(
      'SELECT name FROM tool_categories WHERE id = ? AND active = TRUE',
      [id]
    );

    if ((existing as any[]).length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const categoryName = (existing as any[])[0].name;

    // Check if category is being used by any tools
    const [tools] = await connection.execute(
      'SELECT COUNT(*) as count FROM tools_inventory WHERE category_id = ?',
      [id]
    );

    const toolCount = (tools as any[])[0].count;

    if (toolCount > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar la categoría "${categoryName}" porque tiene ${toolCount} herramienta(s) asignada(s)` 
      });
    }

    // Soft delete
    await connection.execute(
      'UPDATE tool_categories SET active = FALSE, updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `Categoría "${categoryName}" eliminada correctamente`
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      error: 'Error al eliminar categoría',
      details: error.message 
    });
  }
};

// Get category statistics
export const getCategoryStats: RequestHandler = async (req, res) => {
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
    console.error('Error fetching category stats:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas de categorías',
      details: error.message 
    });
  }
};
