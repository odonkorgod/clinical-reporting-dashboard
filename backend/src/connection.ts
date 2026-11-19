/**
 * Neon connection strings use `sslmode=require`. node-postgres now warns that
 * this will change meaning, and today it already verifies the certificate.
 * Make that explicit with `verify-full` (Neon's certificates chain to a public
 * CA, so Node's default trust store validates them).
 */
export function withVerifiedSsl(connectionString: string): string {
  const url = new URL(connectionString);
  if (url.searchParams.get('sslmode') === 'require') url.searchParams.set('sslmode', 'verify-full');
  return url.toString();
}
