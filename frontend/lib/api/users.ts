import { apiRequest } from "./client";
import type { User } from "@/lib/types";

export type CreateUserRequest = {
  email: string;
  full_name: string;
  password: string;
};

export function getCurrentUser() {
  return apiRequest<User>("/users/me");
}

export function createUser(payload: CreateUserRequest) {
  return apiRequest<User>("/users/", {
    method: "POST",
    auth: false,
    body: payload,
  });
}
