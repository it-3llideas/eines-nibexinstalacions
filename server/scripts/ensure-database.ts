import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL no configurada');

  const connection = mysql.createPool({ uri, ssl: false });

  const requiredTables = new Set([
    'users',
    'operarios',
    'tool_categories',
    'tools_inventory',
    'tool_transactions',
  ]);

  const deprecatedTables = [
    // Tablas que no deben existir según el backend actual
    'categories',
    'inventory_transactions',
  ];

  const exec = async (sql: string, params: any[] = []) => {
    await connection.execute(sql, params);
  };

  console.log('🔧 Verificando base de datos...');

  // Drop deprecated tables (si existen)
  for (const tbl of deprecatedTables) {
    console.log(`🧹 Eliminando tabla obsoleta si existe: ${tbl}`);
    await exec(`DROP TABLE IF EXISTS ${tbl}`);
  }

  // Helper: comprobar si existe tabla
  const tableExists = async (table: string) => {
    const [rows] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table]
    );
    return (rows as any[]).length > 0;
  };

  // Crear tablas requeridas si faltan
  if (!(await tableExists('users'))) {
    console.log('➕ Creando tabla: users');
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

  if (!(await tableExists('operarios'))) {
    console.log('➕ Creando tabla: operarios');
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

  if (!(await tableExists('tool_categories'))) {
    console.log('➕ Creando tabla: tool_categories');
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

  if (!(await tableExists('tools_inventory'))) {
    console.log('➕ Creando tabla: tools_inventory');
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

  if (!(await tableExists('tool_transactions'))) {
    console.log('➕ Creando tabla: tool_transactions');
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

  // Opcional: avisar si existen tablas desconocidas (no las borramos por seguridad)
  const [all] = await connection.execute('SHOW TABLES');
  const tableKey = Object.keys(all[0] || {})[0] as string | undefined;
  if (tableKey) {
    const existing = new Set((all as any[]).map(r => r[tableKey] as string));
    const unknown = Array.from(existing).filter(t => !requiredTables.has(t));
    if (unknown.length) {
      console.log('⚠️  Tablas adicionales presentes (no se eliminan automáticamente):', unknown.join(', '));
    }
  }

  console.log('✅ Base de datos verificada/actualizada');
  await connection.end();
}

main().catch(err => {
  console.error('❌ Error preparando la base de datos:', err.message);
  process.exit(1);
});
