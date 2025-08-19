export const BACKEND_URL = "http://localhost:3000"; // Update this to your backend URL
export const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_REDIRECT_URI = (import.meta as any).env?.VITE_GOOGLE_REDIRECT_URI || `http://localhost:5173/oauth/google/callback`;