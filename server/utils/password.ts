import crypto from 'crypto';

// Use the provided NEXT_AUTH_SECRET
const SECRET = 'NjAFELjMxFZRngffrSylau0suRtRZ/fIMdmB6UQ6Ie8=';

/**
 * Encrypts a password using HMAC-SHA256 with the NEXT_AUTH_SECRET
 */
export function encryptPassword(password: string): string {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(password);
  return hmac.digest('hex');
}

/**
 * Verifies a password against an encrypted hash
 */
export function verifyPassword(password: string, encryptedPassword: string): boolean {
  const encrypted = encryptPassword(password);
  return encrypted === encryptedPassword;
}

/**
 * Generates an encrypted password for 'C@t4luny4'
 */
export function getDefaultAdminPassword(): string {
  return encryptPassword('C@t4luny4');
}
