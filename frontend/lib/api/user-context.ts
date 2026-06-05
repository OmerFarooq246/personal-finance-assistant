import { apiRequest } from "./client";
import type { UserContext } from "@/lib/types";

export function listUserContext() {
  return apiRequest<UserContext[]>("/user-context/");
}
