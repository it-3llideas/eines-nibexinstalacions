import { RequestHandler } from "express";
import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

export const testConnection: RequestHandler = async (req, res) => {
  try {
    // Test basic connection
    const [result] = await connection.execute('SELECT 1 as test');
    
    // Get table info
    const [tables] = await connection.execute('SHOW TABLES');
    
    // Get operarios count
    const [operarios] = await connection.execute('SELECT COUNT(*) as count FROM operarios');
    
    res.json({
      success: true,
      connection: 'OK',
      testQuery: result,
      tables: tables,
      operariosCount: operarios
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      error: 'Database test failed',
      details: error.message 
    });
  }
};

export const getSimpleOperarios: RequestHandler = async (req, res) => {
  try {
    const [operarios] = await connection.execute('SELECT * FROM operarios ORDER BY created_at DESC');
    res.json(operarios);
  } catch (error) {
    console.error('Error fetching operarios:', error);
    res.status(500).json({ 
      error: 'Failed to fetch operarios',
      details: error.message 
    });
  }
};

export const getSimpleTools: RequestHandler = async (req, res) => {
  try {
    const [tools] = await connection.execute('SELECT * FROM tools_inventory ORDER BY id DESC LIMIT 20');
    res.json(tools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({
      error: 'Failed to fetch tools',
      details: error.message
    });
  }
};
