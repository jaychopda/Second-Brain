export const BACKEND_URL = "http://localhost:3000"; // Update this to your backend URL
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "535999537603-mhdimfbc9ighvbc3hj4cvrriqmq6l68i.apps.googleusercontent.com"
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || "http://localhost:5173/oauth/google/callback"

// Note: GOOGLE_CLIENT_SECRET should only be used on the backend, never in frontend code
