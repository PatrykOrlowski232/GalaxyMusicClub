import { getSessionUser, loadUserRoles, type SessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { hasDoorRole, hasStaffRole } from "@/lib/roles";

export function isStaff(user: SessionUser | null | undefined): user is SessionUser {
  return hasStaffRole(user);
}

/** Admin/Owner/Barman/Manager — wejście / skaner drzwi. */
export function canDoorCheckIn(user: SessionUser | null | undefined): user is SessionUser {
  return hasDoorRole(user);
}

/** Sesja + świeże role z DB (odwołanie Admina działa od razu). */
export async function requireStaff() {
  const session = await getSessionUser();
  if (!session) {
    return { user: null, error: jsonError("Wymagane logowanie.", 401) };
  }
  const roles = await loadUserRoles(session.id);
  const user: SessionUser = { ...session, roles };
  if (!isStaff(user)) {
    return { user: null, error: jsonError("Brak uprawnień Admin/Owner.", 403) };
  }
  return { user, error: null };
}

export async function requireDoorStaff() {
  const session = await getSessionUser();
  if (!session) {
    return { user: null, error: jsonError("Wymagane logowanie.", 401) };
  }
  const roles = await loadUserRoles(session.id);
  const user: SessionUser = { ...session, roles };
  if (!canDoorCheckIn(user)) {
    return {
      user: null,
      error: jsonError("Brak uprawnień do skanera wejścia.", 403),
    };
  }
  return { user, error: null };
}
