import { RequestHandler } from "express";
import { db } from "../db/config";
import { tools, toolCategories, operarios, toolCheckouts } from "../db/schema";
import { eq, desc, count, and } from "drizzle-orm";

// Get all tools
export const getAllTools: RequestHandler = async (req, res) => {
  try {
    const allTools = await db.select({
      id: tools.id,
      name: tools.name,
      type: tools.type,
      status: tools.status,
      location: tools.location,
      serialNumber: tools.serialNumber,
      qrCode: tools.qrCode,
      cost: tools.cost,
      lastSeen: tools.lastSeen,
      nextReview: tools.nextReview,
      category: toolCategories.name,
      assignedOperario: operarios.name
    })
    .from(tools)
    .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
    .leftJoin(operarios, eq(tools.assignedTo, operarios.id))
    .orderBy(desc(tools.updatedAt));

    res.json(allTools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
};

// Get tools by type
export const getToolsByType: RequestHandler = async (req, res) => {
  try {
    const { type } = req.params;
    
    const toolsByType = await db.select({
      id: tools.id,
      name: tools.name,
      type: tools.type,
      status: tools.status,
      location: tools.location,
      serialNumber: tools.serialNumber,
      qrCode: tools.qrCode,
      cost: tools.cost,
      lastSeen: tools.lastSeen,
      nextReview: tools.nextReview,
      category: toolCategories.name,
      assignedOperario: operarios.name
    })
    .from(tools)
    .leftJoin(toolCategories, eq(tools.categoryId, toolCategories.id))
    .leftJoin(operarios, eq(tools.assignedTo, operarios.id))
    .where(eq(tools.type, type as 'individual' | 'common'))
    .orderBy(desc(tools.updatedAt));

    res.json(toolsByType);
  } catch (error) {
    console.error('Error fetching tools by type:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
};

// Get dashboard stats
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    // Get total counts
    const [totalTools] = await db.select({ count: count() }).from(tools);
    const [individualTools] = await db.select({ count: count() }).from(tools).where(eq(tools.type, 'individual'));
    const [commonTools] = await db.select({ count: count() }).from(tools).where(eq(tools.type, 'common'));
    const [toolsInUse] = await db.select({ count: count() }).from(tools).where(eq(tools.status, 'in_use'));
    const [toolsInMaintenance] = await db.select({ count: count() }).from(tools).where(eq(tools.status, 'maintenance'));
    const [missingTools] = await db.select({ count: count() }).from(tools).where(eq(tools.status, 'missing'));
    const [activeOperarios] = await db.select({ count: count() }).from(operarios).where(eq(operarios.active, true));

    // Get overdue reviews count (simplified - tools with nextReview in the past)
    const overdueReviews = await db.select({ count: count() }).from(tools)
      .where(and(
        eq(tools.type, 'individual'),
        // This is a simplified check - in production you'd use proper date comparison
      ));

    const stats = {
      totalTools: totalTools.count,
      individualTools: individualTools.count,
      commonTools: commonTools.count,
      toolsInUse: toolsInUse.count,
      toolsInMaintenance: toolsInMaintenance.count,
      missingTools: missingTools.count,
      activeOperarios: activeOperarios.count,
      overdueReviews: 0 // Simplified for now
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Checkout tool
export const checkoutTool: RequestHandler = async (req, res) => {
  try {
    const { toolCode, operarioName, project } = req.body;

    if (!toolCode) {
      return res.status(400).json({ error: 'Tool code is required' });
    }

    // Find tool by QR code or name
    const tool = await db.select().from(tools)
      .where(eq(tools.qrCode, toolCode))
      .limit(1);

    if (tool.length === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    if (tool[0].status === 'in_use') {
      return res.status(400).json({ error: 'Tool is already in use' });
    }

    // Find or create operario
    let operario = await db.select().from(operarios)
      .where(eq(operarios.name, operarioName))
      .limit(1);

    let operarioId = null;
    if (operario.length === 0 && operarioName) {
      const [newOperario] = await db.insert(operarios).values({
        name: operarioName,
        role: 'operario',
        active: true
      });
      operarioId = newOperario.insertId;
    } else if (operario.length > 0) {
      operarioId = operario[0].id;
    }

    // Update tool status
    await db.update(tools)
      .set({
        status: 'in_use',
        lastSeen: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tools.id, tool[0].id));

    // Create checkout record
    await db.insert(toolCheckouts).values({
      toolId: tool[0].id,
      operarioId: operarioId || 1, // Default to first operario if none specified
      checkedOutAt: new Date(),
      project: project || null
    });

    res.json({ 
      success: true, 
      message: 'Tool checked out successfully',
      tool: tool[0].name,
      operario: operarioName || 'Unknown'
    });
  } catch (error) {
    console.error('Error checking out tool:', error);
    res.status(500).json({ error: 'Failed to checkout tool' });
  }
};

// Checkin tool
export const checkinTool: RequestHandler = async (req, res) => {
  try {
    const { toolCode } = req.body;

    if (!toolCode) {
      return res.status(400).json({ error: 'Tool code is required' });
    }

    // Find tool by QR code
    const tool = await db.select().from(tools)
      .where(eq(tools.qrCode, toolCode))
      .limit(1);

    if (tool.length === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    if (tool[0].status !== 'in_use') {
      return res.status(400).json({ error: 'Tool is not currently checked out' });
    }

    // Update tool status
    await db.update(tools)
      .set({
        status: 'available',
        lastSeen: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tools.id, tool[0].id));

    // Update checkout record
    const activeCheckout = await db.select().from(toolCheckouts)
      .where(and(
        eq(toolCheckouts.toolId, tool[0].id),
        eq(toolCheckouts.checkedInAt, null)
      ))
      .limit(1);

    if (activeCheckout.length > 0) {
      await db.update(toolCheckouts)
        .set({ checkedInAt: new Date() })
        .where(eq(toolCheckouts.id, activeCheckout[0].id));
    }

    res.json({ 
      success: true, 
      message: 'Tool checked in successfully',
      tool: tool[0].name
    });
  } catch (error) {
    console.error('Error checking in tool:', error);
    res.status(500).json({ error: 'Failed to checkin tool' });
  }
};
