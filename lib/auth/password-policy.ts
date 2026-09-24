/** Admin password policy (pure module — also used by scripts/create-admin.ts). */
export function passwordPolicyError(password: string): string | null {
  if (password.length < 12) return "Password must be at least 12 characters long.";
  if (password.length > 128) return "Password must be at most 128 characters long.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must include upper-case, lower-case letters and a number.";
  }
  return null;
}
