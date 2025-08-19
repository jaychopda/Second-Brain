import { useRef, useState } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import axios from "axios";
import { BACKEND_URL, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from "../config";

export function SignIn(){
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const signinWithGoogle = () => {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
            setError("Google sign-in is not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_REDIRECT_URI.");
            return;
        }
        const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            response_type: "code",
            scope: "openid email profile",
            prompt: "select_account"
        });
        window.location.href = `${baseUrl}?${params.toString()}`;
    }

    const signin = async () => {
        const username = usernameRef.current?.value ?? "";
        const password = passwordRef.current?.value ?? "";
        
        if (!username || !password) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
                username,
                password
            });
            
            console.log("Sign in successful:", response.data);
            localStorage.setItem("token", response.data.token);
            window.location.href = "/"; // Redirect to Dashboard after successful sign-in
        } catch (error: any) {
            console.error("Error signing in:", error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError("An error occurred during sign in. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0114 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-gray-300">Sign in to your Second Brain account</p>
                </div>

                {/* Sign In Form */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={signinWithGoogle}
                            className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 hover:bg-gray-50"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-xs text-gray-400">or</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <Input 
                                placeholder="Enter your username" 
                                type="text" 
                                reference={usernameRef}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <Input 
                                placeholder="Enter your password" 
                                type="password" 
                                reference={passwordRef}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button 
                            text={loading ? "Signing In..." : "Sign In"} 
                            onClick={signin} 
                            variant="primary" 
                            size="lg"
                        />
                        
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                    Sign up
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-400">
                        Secure login powered by Second Brain
                    </p>
                </div>
            </div>
        </div>
    )
}