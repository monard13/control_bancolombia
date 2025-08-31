import { log } from './utils/logger';

// Generar logs de prueba
log.info('Iniciando prueba de logging');
log.debug('Mensaje de debug de prueba');
log.warn('Advertencia de prueba');
log.error('Error de prueba', new Error('Este es un error de prueba'));

// Simular una transacción
log.info('Nueva transacción creada', {
  transactionId: 'test-123',
  amount: 100.50,
  type: 'income',
  timestamp: new Date().toISOString()
});

// Simular un error de autenticación
log.error('Error de autenticación', {
  userId: 'user-456',
  attempt: 3,
  timestamp: new Date().toISOString()
});

console.log('Logs de prueba generados. Revisa el directorio logs/');
