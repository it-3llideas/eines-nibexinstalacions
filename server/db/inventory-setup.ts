import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

export async function setupInventoryTables() {
  try {
    console.log('Creating inventory management tables...');

    // Create operarios table with unique codes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS operarios_inventory (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        operario_code VARCHAR(20) UNIQUE NOT NULL,
        role ENUM('operario', 'supervisor', 'warehouse_manager') DEFAULT 'operario',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create tools inventory table with quantities
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tools_inventory (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('individual', 'common') NOT NULL,
        subcategory VARCHAR(255),
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

    // Create tool transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tool_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tool_id INT NOT NULL,
        operario_id INT NOT NULL,
        transaction_type ENUM('checkout', 'checkin', 'maintenance', 'add_stock', 'remove_stock') NOT NULL,
        quantity INT NOT NULL,
        previous_available INT NOT NULL,
        new_available INT NOT NULL,
        project VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin users table (separate from operarios)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'warehouse_manager') DEFAULT 'admin',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Inventory management tables created successfully');

    // Insert sample data
    await insertInventorySampleData();

    console.log('✓ Inventory database setup completed');
    return true;
  } catch (error) {
    console.error('Inventory database setup failed:', error);
    return false;
  }
}

async function insertInventorySampleData() {
  try {
    // Check if data already exists
    const [existingOperarios] = await connection.execute('SELECT COUNT(*) as count FROM operarios_inventory');
    const operarioCount = (existingOperarios as any)[0].count;

    if (operarioCount > 0) {
      console.log('Sample inventory data already exists, skipping...');
      return;
    }

    console.log('Inserting sample inventory data...');

    // Insert sample operarios with unique codes
    await connection.execute(`
      INSERT INTO operarios_inventory (name, email, operario_code, role, active) VALUES
      ('Carlos Martínez', 'carlos.martinez@empresa.com', 'OP001', 'operario', TRUE),
      ('Ana García', 'ana.garcia@empresa.com', 'OP002', 'operario', TRUE),
      ('Miguel López', 'miguel.lopez@empresa.com', 'OP003', 'operario', TRUE),
      ('Laura Fernández', 'laura.fernandez@empresa.com', 'SUP01', 'supervisor', TRUE),
      ('Pedro Ruiz', 'pedro.ruiz@empresa.com', 'WH001', 'warehouse_manager', TRUE)
    `);

    // Insert sample admin user (password: admin123)
    await connection.execute(`
      INSERT INTO admin_users (username, email, password_hash, role) VALUES
      ('admin', 'admin@empresa.com', '$2a$10$XnAPFrNNOeXmDQEgLzqF2.kCXm5wYBGwK.Ik8nBpO3FtVWY6rH7uC', 'admin'),
      ('almacen', 'almacen@empresa.com', '$2a$10$XnAPFrNNOeXmDQEgLzqF2.kCXm5wYBGwK.Ik8nBpO3FtVWY6rH7uC', 'warehouse_manager')
    `);

    console.log('✓ Sample inventory data inserted');
  } catch (error) {
    console.error('Error inserting sample inventory data:', error);
  }
}
