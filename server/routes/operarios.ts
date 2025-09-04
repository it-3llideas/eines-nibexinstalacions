import { RequestHandler } from "express";
import { db } from "../db/config";
import { operarios, tools } from "../db/schema";
import { eq, desc, count } from "drizzle-orm";

// Get all operarios
export const getAllOperarios: RequestHandler = async (req, res) => {
  try {
    const allOperarios = await db.select({
      id: operarios.id,
      name: operarios.name,
      email: operarios.email,
      role: operarios.role,
      active: operarios.active,
      createdAt: operarios.createdAt
    })
    .from(operarios)
    .orderBy(desc(operarios.createdAt));

    // Get tool counts for each operario
    const operariosWithToolCounts = await Promise.all(
      allOperarios.map(async (operario) => {
        const [toolCount] = await db.select({ count: count() })
          .from(tools)
          .where(eq(tools.assignedTo, operario.id));
        
        return {
          ...operario,
          assignedToolsCount: toolCount.count
        };
      })
    );

    res.json(operariosWithToolCounts);
  } catch (error) {
    console.error('Error fetching operarios:', error);
    res.status(500).json({ error: 'Failed to fetch operarios' });
  }
};

// Get operario by ID
export const getOperarioById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const operario = await db.select().from(operarios)
      .where(eq(operarios.id, parseInt(id)))
      .limit(1);

    if (operario.length === 0) {
      return res.status(404).json({ error: 'Operario not found' });
    }

    // Get assigned tools
    const assignedTools = await db.select().from(tools)
      .where(eq(tools.assignedTo, parseInt(id)));

    res.json({
      ...operario[0],
      assignedTools
    });
  } catch (error) {
    console.error('Error fetching operario:', error);
    res.status(500).json({ error: 'Failed to fetch operario' });
  }
};

// Create new operario
export const createOperario: RequestHandler = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [newOperario] = await db.insert(operarios).values({
      name,
      email: email || null,
      role: role || 'operario',
      active: true
    });

    res.status(201).json({ 
      success: true, 
      message: 'Operario created successfully',
      id: newOperario.insertId
    });
  } catch (error) {
    console.error('Error creating operario:', error);
    res.status(500).json({ error: 'Failed to create operario' });
  }
};

// Update operario
export const updateOperario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, active } = req.body;

    const updatedOperario = await db.update(operarios)
      .set({
        name,
        email,
        role,
        active,
        updatedAt: new Date()
      })
      .where(eq(operarios.id, parseInt(id)));

    if (updatedOperario.affectedRows === 0) {
      return res.status(404).json({ error: 'Operario not found' });
    }

    res.json({ 
      success: true, 
      message: 'Operario updated successfully'
    });
  } catch (error) {
    console.error('Error updating operario:', error);
    res.status(500).json({ error: 'Failed to update operario' });
  }
};
