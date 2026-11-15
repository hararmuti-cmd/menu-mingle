import { describe, expect, it } from "vitest";
import { itemSchema, canManageMenu } from "@/lib/menu-schema";
const item = { name: "Espresso", category_id: "sicak", description: "", price: 65, old_price: 80, image: "espresso", available: true, position: 1 };
describe("Menu management rules", () => {
  it("only admins can manage menu prices and categories", () => {
    expect(canManageMenu(false)).toBe(false);
    expect(canManageMenu(true)).toBe(true);
  });
  it("preserves entered prices", () => { expect(itemSchema.parse(item).price).toBe(65); });
  it("rejects negative prices", () => { expect(itemSchema.safeParse({ ...item, price: -1 }).success).toBe(false); });
  it("rejects an old price below the selling price", () => { expect(itemSchema.safeParse({ ...item, old_price: 60 }).success).toBe(false); });
});