import { RequestHandler } from "express";
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

// Get all operarios
export const getOperarios: RequestHandler = async (req, res) => {
  try {
    const [operarios] = await connection.execute(
      'SELECT id, name, email, operario_code, active, created_at FROM operarios ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      operarios
    });
  } catch (error) {
    console.error('Error getting operarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Create new operario
export const createOperario: RequestHandler = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Generate unique operario code (4 digits)
    const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();
    let operarioCode = generateCode();

    // Ensure code is unique
    let codeExists = true;
    while (codeExists) {
      const [existing] = await connection.execute(
        'SELECT COUNT(*) as count FROM operarios WHERE operario_code = ?',
        [operarioCode]
      );
      
      if ((existing as any[])[0].count === 0) {
        codeExists = false;
      } else {
        operarioCode = generateCode();
      }
    }

    // Insert new operario
    await connection.execute(
      'INSERT INTO operarios (name, email, operario_code, active) VALUES (?, ?, ?, TRUE)',
      [name, email || null, operarioCode]
    );

    res.json({
      success: true,
      message: 'Operario creado exitosamente',
      operario: {
        name,
        email: email || null,
        operario_code: operarioCode
      }
    });
  } catch (error) {
    console.error('Error creating operario:', error);
    
    if ((error as any).code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El email ya está en uso' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

// Update operario
export const updateOperario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, active } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    await connection.execute(
      'UPDATE operarios SET name = ?, email = ?, active = ? WHERE id = ?',
      [name, email || null, active !== false, id]
    );

    res.json({
      success: true,
      message: 'Operario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating operario:', error);
    
    if ((error as any).code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El email ya está en uso' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

// Delete operario
export const deleteOperario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if operario has any transactions
    const [transactions] = await connection.execute(
      'SELECT COUNT(*) as count FROM tool_transactions WHERE operario_id = ?',
      [id]
    );

    if ((transactions as any[])[0].count > 0) {
      // Don't delete, just deactivate
      await connection.execute(
        'UPDATE operarios SET active = FALSE WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Operario desactivado exitosamente (tiene historial de transacciones)'
      });
    } else {
      // Safe to delete
      await connection.execute(
        'DELETE FROM operarios WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Operario eliminado exitosamente'
      });
    }
  } catch (error) {
    console.error('Error deleting operario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Regenerate operario code
export const regenerateCode: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Generate new unique code
    const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();
    let operarioCode = generateCode();

    // Ensure code is unique
    let codeExists = true;
    while (codeExists) {
      const [existing] = await connection.execute(
        'SELECT COUNT(*) as count FROM operarios WHERE operario_code = ? AND id != ?',
        [operarioCode, id]
      );
      
      if ((existing as any[])[0].count === 0) {
        codeExists = false;
      } else {
        operarioCode = generateCode();
      }
    }

    // Update operario code
    await connection.execute(
      'UPDATE operarios SET operario_code = ? WHERE id = ?',
      [operarioCode, id]
    );

    res.json({
      success: true,
      message: 'Código regenerado exitosamente',
      operario_code: operarioCode
    });
  } catch (error) {
    console.error('Error regenerating code:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
