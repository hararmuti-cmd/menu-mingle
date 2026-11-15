import { queryOptions } from "@tanstack/react-query";
import { getMenu, getDashboard } from "./menu.functions";
export const menuQuery = queryOptions({ queryKey: ["menu"], queryFn: () => getMenu() });
export const dashboardQuery = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });