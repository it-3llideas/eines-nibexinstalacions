#!/usr/bin/env tsx

import { resetDatabase } from '../db/reset';

async function main() {
  console.log('🚀 Iniciando reset de base de datos...');
  
  const success = await resetDatabase();
  
  if (success) {
    console.log('✅ Reset completado exitosamente');
    process.exit(0);
  } else {
    console.log('❌ Error durante el reset');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error ejecutando reset:', error);
  process.exit(1);
});
