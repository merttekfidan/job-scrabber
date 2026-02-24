'use server'

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(prevState, formData) {
    try {
        await signIn("credentials", formData)
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

export async function signOut() {
    const { signOut } = await import("@/auth");
    await signOut({ redirectTo: "/login" });
}
