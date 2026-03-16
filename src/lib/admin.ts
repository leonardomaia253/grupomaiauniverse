/**
 * Utility to check if a user is an administrator based on their email.
 * Administrators are defined in the ADMIN_EMAILS environment variable.
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  
  const adminEmailsVar = process.env.ADMIN_EMAILS;
  if (!adminEmailsVar) return false;
  
  const admins = adminEmailsVar.split(",").map(e => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}
