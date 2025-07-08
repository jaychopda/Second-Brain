import { useRef } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import axios from "axios";

export function SignIn(){
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const signin = () => {
        const username = usernameRef.current?.value ?? "";
        const password = passwordRef.current?.value ?? "";
        console.log("Username:", username);
        console.log("Password:", password);

        axios.post("http://localhost:3000/api/v1/signin", {
            username,
            password
        }).then(response => {   
            console.log("Sign in successful:", response.data);
            localStorage.setItem("token", response.data.token);
            window.location.href = "/Dashboard"; // Redirect to Dashboard after successful sign-in
        }).catch(error => {
            console.error("Error signing in:", error);
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            } else if (error.request) {
                // The request was made but no response was received
                console.error("Request data:", error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("Error message:", error.message);
            }
        });
    }

    return <>
      <div className="h-screen w-screen flex items-center justify-center text-black">
        <div className="bg-white rounded-2xl shadow-lg w-96 p-8">
            <div className="text-xl font-bold mb-2">
                <Input placeholder={"Username"} type={"text"} reference={usernameRef} />
            </div>
            <div className="text-xl font-bold mb-2">
                <Input placeholder={"Password"} type={"password"} reference={passwordRef} />
            </div>
            <div className="text-xl font-bold pl-28 w-full">

            <Button text={"Sign In"} onClick={() => signin()} variant="primary" size="sm"/>
            </div>
        </div>
      </div>
    </>
}