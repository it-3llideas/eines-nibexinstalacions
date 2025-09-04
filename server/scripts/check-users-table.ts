#!/usr/bin/env tsx

import mysql from 'mysql2/promise';
import { encryptPassword } from '../utils/password';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

async function checkAndFixUsersTable() {
  try {
    console.log('📋 Verificando tabla users...');
    
    // Check if users table exists
    const [tables] = await connection.execute('SHOW TABLES LIKE "users"');
    if ((tables as any[]).length === 0) {
      console.log('❌ Tabla users no existe');
      return;
    }
    
    // Show table structure
    const [structure] = await connection.execute('DESCRIBE users');
    console.log('📊 Estructura de tabla users:');
    console.table(structure);
    
    // Show table content
    const [content] = await connection.execute('SELECT * FROM users');
    console.log('\n📄 Contenido de tabla users:');
    console.table(content);
    
    // Check if any user has plain text password
    for (const user of (content as any[])) {
      if (user.password === 'C@t4luny4') {
        console.log(`\n🔄 Actualizando contraseña encriptada para: ${user.email}`);
        const encryptedPassword = encryptPassword('C@t4luny4');
        await connection.execute(
          'UPDATE users SET password = ? WHERE id = ?',
          [encryptedPassword, user.id]
        );
        console.log('✅ Contraseña actualizada');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkAndFixUsersTable();
