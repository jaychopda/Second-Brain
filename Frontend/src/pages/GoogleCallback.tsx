import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export default function GoogleCallback() {
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        
        if (error) {
            setError(`Google authentication failed: ${error}`);
            setTimeout(() => {
                window.location.replace('/signin');
            }, 3000);
            return;
        }
        
        if (!code) {
            setError('No authorization code received from Google');
            setTimeout(() => {
                window.location.replace('/signin');
            }, 3000);
            return;
        }
        
        (async () => {
            try {
                const res = await axios.post(`${BACKEND_URL}/api/v1/auth/google`, { code });
                if (res.data?.token) {
                    localStorage.setItem('token', res.data.token);
                    // Store user info if provided
                    if (res.data.user) {
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                    }
                    window.location.replace('/');
                } else {
                    setError(res.data?.message || 'Unknown error');
                }
            } catch (e: any) {
                const errorMessage = e?.response?.data?.message || e?.message || 'Google authentication failed';
                setError(errorMessage);
                setTimeout(() => {
                    window.location.replace('/signin');
                }, 3000);
            }
        })();
    }, []);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                {error ? (
                    <div className="text-red-600">
                        <div className="text-lg font-semibold mb-2">Google sign-in failed</div>
                        <div className="text-sm mb-4">{error}</div>
                        <div className="text-xs text-gray-500">Redirecting to sign-in...</div>
                    </div>
                ) : (
                    <div className="text-gray-600">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <div>Signing you in with Google...</div>
                    </div>
                )}
            </div>
        </div>
    );
}


