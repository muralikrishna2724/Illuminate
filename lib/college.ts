/**
 * Registrants type their college freely ("CVR", "cvr college", "CVR COLLEGE OF
 * ENGGINEERING", "Cvr clg of eng", "CVR College of Engineering (CVRCE), Rangareddi"…).
 * Every spelling of the host college seen so far starts with "CVR", and no other
 * college does, so that is the test.
 */
export function isCvrCollege(college: string | null | undefined): boolean {
  if (!college) return false;
  return /^cvr/.test(college.toLowerCase().replace(/[^a-z0-9]/g, ""));
}
