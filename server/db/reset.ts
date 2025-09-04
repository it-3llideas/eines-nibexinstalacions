import mysql from 'mysql2/promise';
import { encryptPassword } from '../utils/password';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

export async function cleanDatabase() {
  try {
    console.log('🗑️  Limpiando base de datos...');

    // Disable foreign key checks to allow dropping tables in any order
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Drop all existing tables
    const tablesToDrop = [
      'tool_transactions',
      'tools_inventory',
      'operarios_inventory',
      'admin_users',
      'tool_categories',
      'tool_checkouts',
      'tools',
      'operarios',
      'users',
      'activities',
      'assignments',
      'locations',
      'maintenance_records',
      'notifications',
      'operators',
      'reviews',
      'system_config'
    ];

    for (const table of tablesToDrop) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`  ✓ Tabla ${table} eliminada`);
      } catch (error) {
        console.log(`  ! Error eliminando tabla ${table}:`, error.message);
      }
    }

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Base de datos limpiada');
    return true;
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    return false;
  }
}

export async function recreateDatabase() {
  try {
    console.log('🏗️  Recreando estructura de base de datos...');

    // Create users table (for system administrators)
    await connection.execute(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Tabla users creada');

    // Create operarios table (for field operators)
    await connection.execute(`
      CREATE TABLE operarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        operario_code VARCHAR(20) UNIQUE NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Tabla operarios creada');

    // Create tool categories table
    await connection.execute(`
      CREATE TABLE tool_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('individual', 'common') NOT NULL,
        color VARCHAR(7) DEFAULT '#E2372B',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Tabla tool_categories creada');

    // Create tools inventory table
    await connection.execute(`
      CREATE TABLE tools_inventory (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INT,
        type ENUM('individual', 'common') NOT NULL,
        total_quantity INT NOT NULL DEFAULT 0,
        available_quantity INT NOT NULL DEFAULT 0,
        in_use_quantity INT NOT NULL DEFAULT 0,
        maintenance_quantity INT NOT NULL DEFAULT 0,
        unit_cost DECIMAL(10, 2),
        location VARCHAR(255) DEFAULT 'Almacén Central',
        minimum_stock INT DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Tabla tools_inventory creada');

    // Create transactions table
    await connection.execute(`
      CREATE TABLE tool_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tool_id INT NOT NULL,
        operario_id INT NOT NULL,
        transaction_type ENUM('checkout', 'checkin', 'maintenance', 'add_stock', 'remove_stock') NOT NULL,
        quantity INT NOT NULL,
        previous_available INT NOT NULL,
        new_available INT NOT NULL,
        project VARCHAR(255),
        destination VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Tabla tool_transactions creada');

    // Insert only the specified admin user with encrypted password
    const encryptedPassword = encryptPassword('C@t4luny4');
    await connection.execute(`
      INSERT INTO users (username, email, password_hash, active) VALUES
      ('admin', 'admin@nibexinstalacions.com', ?, TRUE)
    `, [encryptedPassword]);
    console.log('  ✓ Usuario administrador creado');
    console.log('    - admin@nibexinstalacions.com / C@t4luny4');

    console.log('✅ Base de datos recreada exitosamente (sin datos de ejemplo)');
    return true;
  } catch (error) {
    console.error('❌ Error recreando base de datos:', error);
    return false;
  }
}

export async function resetDatabase() {
  const cleanSuccess = await cleanDatabase();
  if (!cleanSuccess) {
    return false;
  }

  const recreateSuccess = await recreateDatabase();
  return recreateSuccess;
}
