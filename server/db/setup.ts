import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

export async function setupTables() {
  try {
    console.log('Creating database tables...');

    // Create operarios table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS operarios (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        role ENUM('operario', 'supervisor', 'warehouse_manager') DEFAULT 'operario',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create tool_categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tool_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('individual', 'common') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tools table (without foreign keys initially)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tools (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        type ENUM('individual', 'common') NOT NULL,
        category_id INT,
        assigned_to INT,
        location VARCHAR(255) NOT NULL,
        status ENUM('available', 'in_use', 'maintenance', 'missing') DEFAULT 'available',
        last_seen DATETIME,
        next_review DATETIME,
        cost DECIMAL(10, 2),
        serial_number VARCHAR(255),
        qr_code VARCHAR(255) UNIQUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create tool_checkouts table (without foreign keys initially)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tool_checkouts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tool_id INT NOT NULL,
        operario_id INT NOT NULL,
        checked_out_at DATETIME NOT NULL,
        checked_in_at DATETIME,
        project VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Database tables created successfully');

    // Insert sample data
    await insertSampleData();

    console.log('✓ Database setup completed');
    return true;
  } catch (error) {
    console.error('Database setup failed:', error);
    return false;
  }
}

async function insertSampleData() {
  try {
    // Check if data already exists
    const [existingOperarios] = await connection.execute('SELECT COUNT(*) as count FROM operarios');
    const operarioCount = (existingOperarios as any)[0].count;

    if (operarioCount > 0) {
      console.log('Sample data already exists, skipping...');
      return;
    }

    console.log('Inserting sample data...');

    // Insert categories
    await connection.execute(`
      INSERT INTO tool_categories (name, description, type) VALUES
      ('Taladros y Perforadoras', 'Herramientas de perforación y taladrado', 'individual'),
      ('Herramientas de Medición', 'Testers, multímetros y herramientas de medida', 'individual'),
      ('Escaleras y Andamios', 'Escaleras de baja altura y andamios', 'individual'),
      ('Grupos Electrógenos', 'Generadores eléctricos portátiles', 'common'),
      ('Prensadoras', 'Prensadoras de tuberías y cables', 'common'),
      ('Herramientas Grandes', 'Llaves grandes, guías pasacables, etc.', 'common')
    `);

    // Insert operarios
    await connection.execute(`
      INSERT INTO operarios (name, email, role, active) VALUES
      ('Carlos Martínez', 'carlos.martinez@empresa.com', 'operario', TRUE),
      ('Ana García', 'ana.garcia@empresa.com', 'operario', TRUE),
      ('Miguel López', 'miguel.lopez@empresa.com', 'operario', TRUE),
      ('Laura Fernández', 'laura.fernandez@empresa.com', 'supervisor', TRUE),
      ('Pedro Ruiz', 'pedro.ruiz@empresa.com', 'warehouse_manager', TRUE)
    `);

    // Insert sample tools
    await connection.execute(`
      INSERT INTO tools (name, type, category_id, location, status, qr_code, cost) VALUES
      ('Taladro Bosch GSB 13 RE', 'individual', 1, 'Almacén Central', 'available', 'TDR001', 89.99),
      ('Taladro Makita HP457D', 'individual', 1, 'Almacén Central', 'available', 'TDR002', 125.50),
      ('Tester Digital Fluke 117', 'individual', 2, 'Almacén Central', 'available', 'TST001', 289.99),
      ('Escalera Aluminio 3m', 'individual', 3, 'Almacén Central', 'available', 'ESC001', 145.00),
      ('Grupo Electrógeno Honda EU20i', 'common', 4, 'Taller', 'available', 'GEN001', 1299.99),
      ('Prensadora Rems Power-Press SE', 'common', 5, 'Taller', 'available', 'PRE001', 2850.00)
    `);

    console.log('✓ Sample data inserted');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}
