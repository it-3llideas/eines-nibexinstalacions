import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL no configurada');

  const connection = mysql.createPool({ uri, ssl: false });

  const required = new Set([
    'users',
    'operarios',
    'tool_categories',
    'tools_inventory',
    'tool_transactions',
  ]);
  const deprecated = ['categories', 'inventory_transactions'];

  const exec = (sql, params = []) => connection.execute(sql, params);

  for (const tbl of deprecated) {
    await exec(`DROP TABLE IF EXISTS ${tbl}`);
  }

  const exists = async (table) => {
    const [rows] = await exec(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table]
    );
    return rows.length > 0;
  };

  if (!(await exists('users'))) {
    await exec(`
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
  }

  if (!(await exists('operarios'))) {
    await exec(`
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
  }

  if (!(await exists('tool_categories'))) {
    await exec(`
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
  }

  if (!(await exists('tools_inventory'))) {
    await exec(`
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
  }

  if (!(await exists('tool_transactions'))) {
    await exec(`
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
  }

  await connection.end();
}

main().catch((e) => {
  console.error('[ensure-database] error:', e.message);
  process.exit(1);
});
