import "server-only";

import { authFetch, unwrapList, unwrapObject } from "@/lib/api/client";
import type { AssignCustomerCategoriesRequest, CreateCustomerCategoryRequest, CustomerCategory } from "@/lib/api/types";

/** GET /api/customer-categories — see the role-restriction note on `CustomerCategory`. */
export async function getAllCustomerCategories(): Promise<CustomerCategory[]> {
  const data = await authFetch<unknown>("/api/customer-categories", { cache: "no-store" });
  return unwrapList<CustomerCategory>(data);
}

/** POST /api/customer-categories — see the role-restriction note on `CustomerCategory`. */
export async function createCustomerCategory(data: CreateCustomerCategoryRequest): Promise<CustomerCategory> {
  const result = await authFetch<unknown>("/api/customer-categories", {
    method: "POST",
    body: data,
    cache: "no-store",
  });
  return unwrapObject<CustomerCategory>(result);
}

/**
 * PUT /api/customer-categories/customer/{customerId} — see the doc comment
 * on `AssignCustomerCategoriesRequest` re: replace-vs-add semantics.
 */
export async function assignCustomerCategories(customerId: string, data: AssignCustomerCategoriesRequest): Promise<void> {
  await authFetch<unknown>(`/api/customer-categories/customer/${customerId}`, {
    method: "PUT",
    body: data,
    cache: "no-store",
  });
}
