import type { UserRole } from "./types";

export const STAFF_ROLES: UserRole[] = ["SuperAdmin", "Admin", "Staff"];
export const ADMIN_ROLES: UserRole[] = ["SuperAdmin", "Admin"];

/** Landing page after login for each role. */
export function homeFor(role: UserRole): string {
  switch (role) {
    case "SuperAdmin":
    case "Admin":
    case "Staff":
      return "/admin";
    case "Hawker":
      return "/hawker";
    case "Delivery":
      return "/delivery";
    default:
      return "/account/orders";
  }
}
