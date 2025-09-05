import { RequestHandler } from "express";
import { connection } from '../db/config';

// Checkout tool
export const checkoutTool: RequestHandler = async (req, res) => {
  try {
    const { toolCode, operarioName, project } = req.body;

    if (!toolCode) {
      return res.status(400).json({ error: 'Tool code is required' });
    }

    // Check if tool exists (for now we'll create it if it doesn't exist)
    const [existingTool] = await connection.execute(
      'SELECT * FROM tools WHERE qr_code = ? OR name LIKE ?',
      [toolCode, `%${toolCode}%`]
    );

    let toolId: number;

    if ((existingTool as any[]).length === 0) {
      // Create new tool
      const [result] = await connection.execute(
        'INSERT INTO tools (name, type, location, status, qr_code) VALUES (?, ?, ?, ?, ?)',
        [toolCode, 'individual', 'En uso', 'in_use', toolCode]
      );
      toolId = (result as any).insertId;
    } else {
      const tool = (existingTool as any[])[0];
      toolId = tool.id;
      
      if (tool.status === 'in_use') {
        return res.status(400).json({ error: 'Tool is already in use' });
      }

      // Update tool status
      await connection.execute(
        'UPDATE tools SET status = ?, location = ? WHERE id = ?',
        ['in_use', 'En uso', toolId]
      );
    }

    // Find or create operario
    let operarioId = 1; // Default operario
    if (operarioName) {
      const [existingOperario] = await connection.execute(
        'SELECT * FROM operarios WHERE name = ?',
        [operarioName]
      );

      if ((existingOperario as any[]).length === 0) {
        const [result] = await connection.execute(
          'INSERT INTO operarios (name, role, active) VALUES (?, ?, ?)',
          [operarioName, 'operario', true]
        );
        operarioId = (result as any).insertId;
      } else {
        operarioId = (existingOperario as any[])[0].id;
      }
    }

    // Create checkout record
    await connection.execute(
      'INSERT INTO tool_checkouts (tool_id, operario_id, checked_out_at, project) VALUES (?, ?, NOW(), ?)',
      [toolId, operarioId, project || null]
    );

    res.json({ 
      success: true, 
      message: 'Tool checked out successfully',
      tool: toolCode,
      operario: operarioName || 'Unknown'
    });
  } catch (error) {
    console.error('Error checking out tool:', error);
    res.status(500).json({ 
      error: 'Failed to checkout tool',
      details: error.message 
    });
  }
};

// Checkin tool
export const checkinTool: RequestHandler = async (req, res) => {
  try {
    const { toolCode } = req.body;

    if (!toolCode) {
      return res.status(400).json({ error: 'Tool code is required' });
    }

    // Find tool
    const [tool] = await connection.execute(
      'SELECT * FROM tools WHERE qr_code = ? OR name LIKE ?',
      [toolCode, `%${toolCode}%`]
    );

    if ((tool as any[]).length === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const foundTool = (tool as any[])[0];

    if (foundTool.status !== 'in_use') {
      return res.status(400).json({ error: 'Tool is not currently checked out' });
    }

    // Update tool status
    await connection.execute(
      'UPDATE tools SET status = ?, location = ? WHERE id = ?',
      ['available', 'Almacén Central', foundTool.id]
    );

    // Update most recent checkout record
    await connection.execute(
      'UPDATE tool_checkouts SET checked_in_at = NOW() WHERE tool_id = ? AND checked_in_at IS NULL ORDER BY checked_out_at DESC LIMIT 1',
      [foundTool.id]
    );

    res.json({ 
      success: true, 
      message: 'Tool checked in successfully',
      tool: foundTool.name
    });
  } catch (error) {
    console.error('Error checking in tool:', error);
    res.status(500).json({ 
      error: 'Failed to checkin tool',
      details: error.message 
    });
  }
};

// Get dashboard stats
export const getDashboardStats: RequestHandler = async (req, res) => {
  try {
    const [totalTools] = await connection.execute('SELECT COUNT(*) as count FROM tools');
    const [individualTools] = await connection.execute('SELECT COUNT(*) as count FROM tools WHERE type = "individual"');
    const [commonTools] = await connection.execute('SELECT COUNT(*) as count FROM tools WHERE type = "common"');
    const [toolsInUse] = await connection.execute('SELECT COUNT(*) as count FROM tools WHERE status = "in_use"');
    const [toolsInMaintenance] = await connection.execute('SELECT COUNT(*) as count FROM tools WHERE status = "maintenance"');
    const [missingTools] = await connection.execute('SELECT COUNT(*) as count FROM tools WHERE status = "missing"');
    const [activeOperarios] = await connection.execute('SELECT COUNT(*) as count FROM operarios WHERE active = 1');

    const stats = {
      totalTools: (totalTools as any[])[0].count,
      individualTools: (individualTools as any[])[0].count,
      commonTools: (commonTools as any[])[0].count,
      toolsInUse: (toolsInUse as any[])[0].count,
      toolsInMaintenance: (toolsInMaintenance as any[])[0].count,
      missingTools: (missingTools as any[])[0].count,
      activeOperarios: (activeOperarios as any[])[0].count,
      overdueReviews: 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats',
      details: error.message 
    });
  }
};

// Get recent activity
export const getRecentActivity: RequestHandler = async (req, res) => {
  try {
    const [activities] = await connection.execute(`
      SELECT 
        tc.id,
        tc.checked_out_at,
        tc.checked_in_at,
        tc.project,
        t.name as tool_name,
        t.type as tool_type,
        o.name as operario_name
      FROM tool_checkouts tc
      LEFT JOIN tools t ON tc.tool_id = t.id
      LEFT JOIN operarios o ON tc.operario_id = o.id
      ORDER BY tc.checked_out_at DESC
      LIMIT 20
    `);

    // Transform data for frontend
    const transformedActivities = (activities as any[]).map(activity => ({
      id: activity.id.toString(),
      type: activity.checked_in_at ? 'checkin' : 'checkout',
      tool: activity.tool_name || 'Unknown Tool',
      operario: activity.operario_name || 'Unknown Operario',
      timestamp: formatTimestamp(activity.checked_in_at || activity.checked_out_at),
      status: 'success',
      details: activity.project ? `Proyecto: ${activity.project}` : undefined
    }));

    res.json(transformedActivities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activity',
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
