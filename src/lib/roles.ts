/** Sprawdzanie ról — bez zależności serwerowych, używane też w komponentach klienta. */
type WithRoles = { roles: string[] } | null | undefined;

const STAFF_ROLES = ["Admin", "Owner"];
const DOOR_ROLES = ["Admin", "Owner", "Barman", "Manager"];

export function hasStaffRole(user: WithRoles): boolean {
  return !!user && user.roles.some((r) => STAFF_ROLES.includes(r));
}

export function hasDoorRole(user: WithRoles): boolean {
  return !!user && user.roles.some((r) => DOOR_ROLES.includes(r));
}
