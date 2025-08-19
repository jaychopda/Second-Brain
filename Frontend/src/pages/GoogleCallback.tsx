import { useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export default function GoogleCallback(){
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (!code) return;
        (async () => {
            try{
                const res = await axios.post(`${BACKEND_URL}/api/v1/auth/google`, { code });
                if(res.data?.token){
                    localStorage.setItem('token', res.data.token);
                    window.location.replace('/');
                }
            }catch(e){
                console.error('Google auth failed', e);
                window.location.replace('/signin');
            }
        })();
    }, []);
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-gray-600">Signing you in with Google...</div>
        </div>
    );
}


