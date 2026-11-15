import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { itemSchema, categorySchema, canManageMenu } from "./menu-schema";

export const getMenu = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error("Menü bağlantısı kurulamadı.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const [categories, items] = await Promise.all([
    client.from("menu_categories").select("*").order("position"),
    client.from("menu_items").select("*").eq("available", true).order("position"),
  ]);
  if (categories.error || items.error) throw new Error("Menü yüklenemedi.");
  return { categories: categories.data ?? [], items: items.data ?? [] };
});

export const getDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: role, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error) throw new Error("Yetki kontrol edilemedi.");
  const [categories, items] = await Promise.all([
    context.supabase.from("menu_categories").select("*").order("position"),
    context.supabase.from("menu_items").select("*").order("position"),
  ]);
  if (categories.error || items.error) throw new Error("Panel yüklenemedi.");
  return { isAdmin: canManageMenu(role ?? false), categories: categories.data ?? [], items: items.data ?? [] };
});

export const saveItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => itemSchema.parse(input)).handler(async ({ context, data }) => {
  const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!canManageMenu(role ?? false)) throw new Error("Yönetici yetkisi gerekiyor.");
  const { id, ...values } = data;
  const result = id ? await context.supabase.from("menu_items").update(values).eq("id", id).select("id").single() : await context.supabase.from("menu_items").insert(values).select("id").single();
  if (result.error) throw new Error("Ürün kaydedilemedi.");
  return result.data;
});
export const saveCategory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => categorySchema.parse(input)).handler(async ({ context, data }) => {
  const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!canManageMenu(role ?? false)) throw new Error("Yönetici yetkisi gerekiyor.");
  const { id, ...values } = data;
  const result = id ? await context.supabase.from("menu_categories").update(values).eq("id", id).select("id").single() : await context.supabase.from("menu_categories").insert(values).select("id").single();
  if (result.error) throw new Error("Kategori kaydedilemedi.");
  return result.data;
});
export const deleteEntry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ id: z.string(), kind: z.enum(["item", "category"]) }).parse(input)).handler(async ({ context, data }) => {
  const { data: role } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!canManageMenu(role ?? false)) throw new Error("Yönetici yetkisi gerekiyor.");
  const result = await context.supabase.from(data.kind === "item" ? "menu_items" : "menu_categories").delete().eq("id", data.id).select("id").single();
  if (result.error) throw new Error(data.kind === "category" ? "Önce bu kategorideki ürünleri taşıyın veya silin." : "Ürün silinemedi.");
  return { ok: true };
});