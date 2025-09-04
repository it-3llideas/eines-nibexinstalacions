import { RequestHandler } from "express";
import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

export const getTableStructure: RequestHandler = async (req, res) => {
  try {
    const { table } = req.params;
    const [columns] = await connection.execute(`DESCRIBE ${table}`);
    res.json(columns);
  } catch (error) {
    console.error('Error getting table structure:', error);
    res.status(500).json({ 
      error: 'Failed to get table structure',
      details: error.message 
    });
  }
};

export const getAllTables: RequestHandler = async (req, res) => {
  try {
    const [tables] = await connection.execute('SHOW TABLES');
    res.json(tables);
  } catch (error) {
    console.error('Error getting tables:', error);
    res.status(500).json({ 
      error: 'Failed to get tables',
      details: error.message 
    });
  }
};
