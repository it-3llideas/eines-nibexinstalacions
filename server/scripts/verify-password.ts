#!/usr/bin/env tsx

import mysql from 'mysql2/promise';
import { encryptPassword, verifyPassword } from '../utils/password';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

async function verifyCurrentPassword() {
  try {
    console.log('🔍 Verificando contraseña en base de datos...');
    
    // Get current password hash from database
    const [users] = await connection.execute(
      'SELECT email, password_hash FROM admin_users WHERE email = ?',
      ['admin@nibexinstalacions.com']
    );

    if ((users as any[]).length === 0) {
      console.log('❌ Usuario no encontrado en la base de datos');
      return;
    }

    const user = (users as any[])[0];
    console.log('\n📊 Estado actual:');
    console.log(`Email: ${user.email}`);
    console.log(`Password hash en DB: ${user.password_hash}`);
    
    // Test what the encrypted version should be
    const expectedHash = encryptPassword('C@t4luny4');
    console.log(`Hash esperado: ${expectedHash}`);
    
    // Check if they match
    const matches = user.password_hash === expectedHash;
    console.log(`¿Coinciden?: ${matches ? '✅ SÍ' : '❌ NO'}`);
    
    // Test verification function
    const verifies = verifyPassword('C@t4luny4', user.password_hash);
    console.log(`¿Función verifyPassword funciona?: ${verifies ? '✅ SÍ' : '❌ NO'}`);
    
    if (!matches) {
      console.log('\n🔄 Actualizando contraseña...');
      await connection.execute(
        'UPDATE admin_users SET password_hash = ? WHERE email = ?',
        [expectedHash, 'admin@nibexinstalacions.com']
      );
      console.log('✅ Contraseña actualizada exitosamente');
    }
    
  } catch (error) {
    console.error('Error verificando contraseña:', error);
  } finally {
    await connection.end();
  }
}

verifyCurrentPassword();
