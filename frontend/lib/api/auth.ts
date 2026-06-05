import { apiRequest, setAuthTokens, type TokenPair } from "./client";
import type { User } from "@/lib/types";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = TokenPair & {
  user: User;
};

export async function login(payload: LoginRequest) {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: payload,
  });
  setAuthTokens(response);
  return response;
}
