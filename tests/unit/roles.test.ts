import { describe, expect, it } from "vitest";
import { getRoleHome, isAdminRole, isSuperAdminRole } from "@/lib/roles";

describe("roles", () => {
  it("treats admin and super admin as staff, customers and unknowns as not", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("customer")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });

  it("only the super admin is a super admin", () => {
    expect(isSuperAdminRole("super_admin")).toBe(true);
    expect(isSuperAdminRole("admin")).toBe(false);
    expect(isSuperAdminRole("customer")).toBe(false);
  });

  it("sends each role to its own home", () => {
    expect(getRoleHome("super_admin")).toBe("/super-admin");
    expect(getRoleHome("admin")).toBe("/admin");
    expect(getRoleHome("customer")).toBe("/account");
    expect(getRoleHome(null)).toBe("/account");
  });
});
