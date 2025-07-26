import axios from "axios";
import { CloseIcon } from "../icons/CloseIcon"
import { useRef } from "react";
import React from "react";

export const CreateContentModel = ({open, onClose}: {open: boolean, onClose: () => void})=>{
    const titleRef = useRef<HTMLInputElement>(null);
    const linkRef = useRef<HTMLInputElement>(null);
    const tagsRef = useRef<HTMLInputElement>(null);
    const typeRef = useRef<HTMLSelectElement>(null);

    const handleSubmit = () => {
        const title = titleRef.current?.value;
        const link = linkRef.current?.value;
        const tags = tagsRef.current?.value;
        const type = typeRef.current?.value;

        const tagsArr = tags?.split(",").map(tag => tag.trim()) || []; 
        console.log(tagsArr)

        console.log("Title:", typeof title, title);
        console.log("Link:", typeof link, link);
        console.log("Tags:", typeof tagsArr, tagsArr);
        console.log("Type:", typeof type, type);

        axios.post("http://192.168.85.214:3000/api/v1/content", {
            title,
            link,
            tags: tagsArr,
            type
        }, {
            headers: {
                token: localStorage.getItem("token") || ""
            }
        }).then(response => {
            console.log("Content created successfully:", response.data);
            onClose(); // Close the modal after successful submission
        }).catch(error => {
            console.error("Error creating content:", error);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            } else if (error.request) {
                console.error("Request data:", error.request);
            } else {
                console.error("Error message:", error.message);
            }
        });

    };

    return <div>
        {open && <div className="w-screen h-screen bg-gray-600 fixed top-0 left-0 z-50 opacity-90 flex justify-center">
            <div className="flex flex-col justify-center">
                <span className="bg-white opacity-100 p-4 rounded-2xl">
                    <div className="flex justify-end">
                        <div onClick={onClose} className="cursor-pointer hover:bg-gray-200 p-2 rounded-full">
                        <CloseIcon />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div>
                            <Input placeholder="Enter title" ref={titleRef} />
                        </div>
                        <div>
                            <Input placeholder="Enter link" ref={linkRef} />
                        </div>
                        <div>
                            <Input placeholder="Enter tags (comma separated)" ref={tagsRef} />
                        </div>
                        <div>
                            <select className="w-md p-2 rounded-md border-2 border-gray-300 focus:outline-none focus:border-blue-500" ref={typeRef}>
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                                <option value="audio">Audio</option>
                                <option value="notion">Notion</option>
                                <option value="youtube">YouTube</option>
                                <option value="twitter">Twitter</option>
                                <option value="url">Other Link</option>
                            </select>
                        </div>
                        <button onClick={handleSubmit} type="submit" className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">Create Content</button>
                    </div>
                </span>
            </div>
        </div>}
    </div>
}


const Input = React.forwardRef<HTMLInputElement, { placeholder: string; onChange?: React.ChangeEventHandler<HTMLInputElement> }>(
    ({ onChange, placeholder }, ref) => (
        <input
            type="text"
            className="w-md p-2 rounded-md border-2 border-gray-300 focus:outline-none focus:border-blue-500"
            placeholder={placeholder}
            onChange={onChange}
            ref={ref}
        />
    )
);