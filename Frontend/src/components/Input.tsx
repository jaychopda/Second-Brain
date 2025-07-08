import React from "react";

// Defining the InputProps interface to specify the types for the props
interface InputProps { 
    placeholder: string; // Placeholder text for the input field
    reference: React.RefObject<HTMLInputElement | null>; // Optional reference to the input field for accessing its value or methods
    type?: string;
}

// Input component definition
export function Input({placeholder, reference, type}: InputProps) {
    return (
        <div>
            {/* Input field with the provided placeholder and reference */}
            <input 
                ref={reference} // Attaching the reference to the input field
                placeholder={placeholder} // Setting the placeholder text for the input field
                type={type ? type : "text"} // Defining the input type as text
                className="px-4 py-2 border rounded m-2" // Tailwind CSS classes for styling the input field
            />
        </div>
    );
}