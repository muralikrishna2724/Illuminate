/**
 * Authoritative payable amount for one registration: fee per person × people
 * covered by the registration. Pure function so it can be unit-tested; the
 * server always calls it with the Event row from the database.
 */
export function calculateRegistrationAmount(event: { feePerPersonInr: number; teamSize: number }): number {
  if (!Number.isInteger(event.feePerPersonInr) || event.feePerPersonInr <= 0) {
    throw new Error("Invalid event fee configuration");
  }
  if (!Number.isInteger(event.teamSize) || event.teamSize < 1) {
    throw new Error("Invalid event team size configuration");
  }
  return event.feePerPersonInr * event.teamSize;
}
