import { RequestHandler } from 'express';
import { connection } from '../db/config';

// Fix inventory quantities based on transactions
export const fixInventoryQuantities: RequestHandler = async (req, res) => {
  try {
    const { toolId } = req.params;
    
    // Get tool data
    const [tools] = await connection.execute(
      'SELECT * FROM tools_inventory WHERE id = ?',
      [toolId]
    );
    
    if ((tools as any[]).length === 0) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }
    
    const tool = (tools as any[])[0];
    
    // Calculate quantities based on transactions
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
    
    (transactions as any[]).forEach((t: any) => {
      if (t.transaction_type === 'checkout') {
        totalCheckout = t.total_quantity;
      } else if (t.transaction_type === 'checkin') {
        totalCheckin = t.total_quantity;
      }
    });
    
    // Calculate correct quantities
    const currentInUse = totalCheckout - totalCheckin;
    const currentAvailable = tool.total_quantity - currentInUse;
    
    // Update tool with correct quantities
    await connection.execute(
      'UPDATE tools_inventory SET available_quantity = ?, in_use_quantity = ? WHERE id = ?',
      [currentAvailable, currentInUse, toolId]
    );
    
    res.json({
      success: true,
      message: 'Cantidades corregidas',
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
    console.error('Error fixing inventory quantities:', error);
    res.status(500).json({ 
      error: 'Error al corregir cantidades',
      details: error.message 
    });
  }
};
