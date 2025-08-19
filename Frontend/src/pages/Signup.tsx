import { useRef, useState } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import axios from "axios";
import { BACKEND_URL, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from "../config";

export function Signup(){
    const nameRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const signupWithGoogle = () => {
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

    const signup = async () => {
        const name = nameRef.current?.value ?? "";
        const username = usernameRef.current?.value ?? "";
        const password = passwordRef.current?.value ?? "";
        
        if (!name || !username || !password) {
            setError("Please fill in all fields");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                name,
                username,
                password
            });
            
            console.log("Sign up successful:", response.data);
            setSuccess("Account created successfully! Redirecting to sign in...");
            
            // Redirect after a short delay to show success message
            setTimeout(() => {
                window.location.href = "/signin";
            }, 2000);
        } catch (error: any) {
            console.error("Error signing up:", error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError("An error occurred during sign up. Please try again.");
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-gray-300">Join Second Brain and start organizing your knowledge</p>
                </div>

                {/* Sign Up Form */}
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

                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-800">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={signupWithGoogle}
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
                                Full Name
                            </label>
                            <Input 
                                placeholder="Enter your full name" 
                                type="text" 
                                reference={nameRef}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <Input 
                                placeholder="Choose a username" 
                                type="text" 
                                reference={usernameRef}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <Input 
                                placeholder="Create a password (min. 6 characters)" 
                                type="password" 
                                reference={passwordRef}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Password must be at least 6 characters long
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button 
                            text={loading ? "Creating Account..." : "Sign Up"} 
                            onClick={signup} 
                            variant="primary" 
                            size="lg"
                        />
                        
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <a href="/signin" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                    Sign in
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Terms and Privacy */}
                    <div className="text-center pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            By creating an account, you agree to our{" "}
                            <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
                            {" "}and{" "}
                            <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-400">
                        Join thousands of users organizing their digital knowledge
                    </p>
                </div>
            </div>
        </div>
    )
}