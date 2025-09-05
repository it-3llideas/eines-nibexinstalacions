import crypto from 'crypto';

import crypto from 'node:crypto';

import 'dotenv/config';
// Current secret from env
const SECRET = process.env.NEXT_AUTH_SECRET || 'NjAFELjMxFZRngffrSylau0suRtRZ/fIMdmB6UQ6Ie8=';
// Legacy secret used in anteriores despliegues
const LEGACY_SECRET = 'NjAFELjMxFZRngffrSylau0suRtRZ/fIMdmB6UQ6Ie8=';

/**
 * Encrypts a password using HMAC-SHA256 with the NEXT_AUTH_SECRET
 */
export function encryptPassword(password: string, secret: string = SECRET): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(password);
  return hmac.digest('hex');
}

/**
 * Verifies a password against an encrypted hash
 */
export function verifyPassword(password: string, encryptedPassword: string): boolean {
  // Try current secret first
  if (encryptPassword(password, SECRET) === encryptedPassword) return true;
  // Then allow legacy hashes to pass (for smooth migration)
  if (encryptPassword(password, LEGACY_SECRET) === encryptedPassword) return true;
  return false;
}

/**
 * Generates an encrypted password for 'C@t4luny4'
 */
export function getDefaultAdminPassword(): string {
  return encryptPassword('C@t4luny4');
}
