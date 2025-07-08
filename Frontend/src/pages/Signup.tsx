import { useRef } from "react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import axios from "axios";

export function Signup(){
    const usernameRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)

    const signup = () => {
        console.log("Sign up clicked");
        const username = usernameRef.current?.value ?? "";
        const password = passwordRef.current?.value ?? "";
        console.log("Username:", username);
        console.log("Password:", password);

        axios.post("http://localhost:3000/api/v1/signup", {
            username,
            password
        }).then(response => {
            console.log("Sign up successful:", response.data);
            window.location.href = "/signin";
        }).catch(error => {
            console.error("Error signing up:", error);
        });
    }

    return <>
      <div className="h-screen w-screen flex items-center justify-center text-black">
        <div className="bg-white rounded-2xl shadow-lg w-96 p-8">
            <div className="text-xl font-bold mb-2">
                <Input placeholder={"Username"} type={"text"} reference={usernameRef}/>
            </div>
            <div className="text-xl font-bold mb-2">
                <Input placeholder={"Password"} type={"password"} reference={passwordRef}/>
            </div>
            <div className="text-xl font-bold pl-28 w-full">

            <Button text={"Sign Up"} onClick={() => signup()} variant="primary" size="sm"/>
            </div>
        </div>
      </div>
    </>
}