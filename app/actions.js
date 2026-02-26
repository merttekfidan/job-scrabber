'use server'

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(prevState, formData) {
    try {
        await signIn("credentials", { ...Object.fromEntries(formData), redirectTo: "/" })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return error.cause?.err?.message || "Invalid credentials."
                default:
                    return error.cause?.err?.message || "Something went wrong."
            }
        }
        throw error
    }
}

