import { RequestHandler } from "express";
import { db } from "../db/config";
import { toolCheckouts, tools, operarios } from "../db/schema";
import { eq, desc, limit } from "drizzle-orm";

// Get recent activity
export const getRecentActivity: RequestHandler = async (req, res) => {
  try {
    const recentActivity = await db.select({
      id: toolCheckouts.id,
      checkedOutAt: toolCheckouts.checkedOutAt,
      checkedInAt: toolCheckouts.checkedInAt,
      project: toolCheckouts.project,
      notes: toolCheckouts.notes,
      toolName: tools.name,
      toolType: tools.type,
      operarioName: operarios.name
    })
    .from(toolCheckouts)
    .leftJoin(tools, eq(toolCheckouts.toolId, tools.id))
    .leftJoin(operarios, eq(toolCheckouts.operarioId, operarios.id))
    .orderBy(desc(toolCheckouts.checkedOutAt))
    .limit(20);

    // Transform data for frontend
    const activities = recentActivity.map(activity => ({
      id: activity.id.toString(),
      type: activity.checkedInAt ? 'checkin' : 'checkout',
      tool: activity.toolName || 'Unknown Tool',
      operario: activity.operarioName || 'Unknown Operario',
      timestamp: formatTimestamp(activity.checkedInAt || activity.checkedOutAt),
      status: 'success',
      details: activity.project ? `Proyecto: ${activity.project}` : undefined
    }));

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};

// Helper function to format timestamp
function formatTimestamp(date: Date | null): string {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('es-ES');
}

// Get tool checkout history
export const getToolHistory: RequestHandler = async (req, res) => {
  try {
    const { toolId } = req.params;
    
    const history = await db.select({
      id: toolCheckouts.id,
      checkedOutAt: toolCheckouts.checkedOutAt,
      checkedInAt: toolCheckouts.checkedInAt,
      project: toolCheckouts.project,
      notes: toolCheckouts.notes,
      operarioName: operarios.name
    })
    .from(toolCheckouts)
    .leftJoin(operarios, eq(toolCheckouts.operarioId, operarios.id))
    .where(eq(toolCheckouts.toolId, parseInt(toolId)))
    .orderBy(desc(toolCheckouts.checkedOutAt));

    res.json(history);
  } catch (error) {
    console.error('Error fetching tool history:', error);
    res.status(500).json({ error: 'Failed to fetch tool history' });
  }
};
