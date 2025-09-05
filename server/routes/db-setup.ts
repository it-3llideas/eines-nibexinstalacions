import { RequestHandler } from "express";
import { connection } from '../db/config';

async function tableExists(table: string): Promise<boolean> {
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return (rows as any[]).length > 0;
}

export const setupDatabase: RequestHandler = async (_req, res) => {
  try {
    const created: string[] = [];

    // users
    if (!(await tableExists('users'))) {
      await connection.execute(`
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push('users');
    }

    // operarios
    if (!(await tableExists('operarios'))) {
      await connection.execute(`
        CREATE TABLE operarios (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          operario_code VARCHAR(20) UNIQUE NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push('operarios');
    }

    // tool_categories
    if (!(await tableExists('tool_categories'))) {
      await connection.execute(`
        CREATE TABLE tool_categories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type ENUM('individual','common') NOT NULL,
          color VARCHAR(7) DEFAULT '#E2372B',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push('tool_categories');
    }

    // tools_inventory
    if (!(await tableExists('tools_inventory'))) {
      await connection.execute(`
        CREATE TABLE tools_inventory (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category_id INT,
          type ENUM('individual','common') NOT NULL,
          total_quantity INT NOT NULL DEFAULT 0,
          available_quantity INT NOT NULL DEFAULT 0,
          in_use_quantity INT NOT NULL DEFAULT 0,
          maintenance_quantity INT NOT NULL DEFAULT 0,
          unit_cost DECIMAL(10,2),
          location VARCHAR(255) DEFAULT 'Almacén Central',
          minimum_stock INT DEFAULT 1,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push('tools_inventory');
    }

    // tool_transactions
    if (!(await tableExists('tool_transactions'))) {
      await connection.execute(`
        CREATE TABLE tool_transactions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          tool_id INT NOT NULL,
          operario_id INT NOT NULL,
          transaction_type ENUM('checkout','checkin','maintenance','add_stock','remove_stock') NOT NULL,
          quantity INT NOT NULL,
          previous_available INT NOT NULL,
          new_available INT NOT NULL,
          project VARCHAR(255),
          destination VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      created.push('tool_transactions');
    }

    res.json({ success: true, created });
  } catch (err: any) {
    console.error('DB setup error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
