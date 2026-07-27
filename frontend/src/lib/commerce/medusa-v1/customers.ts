import { request } from "./http-client"
import type { StoreCustomer, StoreUpdateCustomer } from "./types"
export interface CustomerRegistration extends StoreUpdateCustomer { email: string; password: string }
export const registerCustomerV1 = (body: CustomerRegistration) => request<{ customer: StoreCustomer }, CustomerRegistration>("register customer", "/store/customers", { method: "POST", body })
export const loginCustomerV1 = (email: string, password: string) => request<{ access_token: string }>("login customer", "/store/auth/token", { method: "POST", body: { email, password } })
export const retrieveCustomerV1 = (headers: HeadersInit) => request<{ customer: StoreCustomer }>("retrieve customer", "/store/customers/me", { headers, cache: "no-store" })

