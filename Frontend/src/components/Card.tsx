import DocumentIcon from "../icons/DocumentIcon";
import NotionIcon from "../icons/NotionIcon";
import DeleteIcon from "../icons/DeleteIcon";
import Tags from "./Tags";
import { format } from 'date-fns'
import { type JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TwitterIcon from "../icons/TwitterIcon";


interface CardProps {
  type: string
  tag: string[];
  title: string;
  link: string; 
  reload?: ()=> void,
  date?: string; // Optional date prop for displaying creation date
}

const Card = (props: CardProps) => {
//   const navigate = useNavigate();
const date = format(new Date(), 'dd MMM yyyy');
const [thumbnail, setThumbnail] = useState<string | null>(null);
let contentPreview: JSX.Element = <p className="text-gray-500">No content available</p>;



const getYoutubeId = (url: string): string | null => {
  const regularFormat = url.split("v=");
  if (regularFormat.length > 1) {
    const videoId = regularFormat[1].split("&")[0];
    return videoId;
  }

  const shortFormat = url.split("youtu.be/");
  if (shortFormat.length > 1) {
    const videoId = shortFormat[1].split("?")[0];
    return videoId;
  }

  return null; 
};
  
if (props.type === "youtube") {
  contentPreview = (
    <div className="flex justify-center pt-6 items-center">
      {thumbnail ? (
        <a href={props.link} target="_blank" rel="noopener noreferrer">
          <img src={thumbnail} alt={props.title} className="w-[90%] rounded-lg ml-3" />
        </a>
      ) : (
        <p className="text-gray-500">No thumbnail available</p>
      )}
      <p>{props.date}</p>
    </div>
  );
} else if (props.type === "twiter") {
  contentPreview = (
    <div className="flex justify-center pt-6 items-center">
        {/* <a href={props.link} target="_blank" rel="noopener noreferrer">
          <div className="w-[90%] rounded-lg ml-3">
            <TwitterIcon />
          </div>
        </a> */}

        <blockquote className="twitter-tweet">
          <a href={props.link} target="_blank">
            {props.title}
            <TwitterIcon />
          </a>
          <p>{props.date}</p>
        </blockquote>
    </div>
  );
} else if(props.type === "Notion"){
  contentPreview = (
    <div className="flex justify-center pt-6 items-center">
        <a href={props.link} target="_blank" rel="noopener noreferrer">
          <div className="w-[90%] rounded-lg ml-3">
            <NotionIcon />
          </div>
        </a>
        <p>{props.date}</p>
    </div>
  );
} else if (props.type === "text") {
  contentPreview = (
    <div className="p-4">
      <p className="text-gray-700">{props.title}</p>
      <p>{props.date}</p>
    </div>
  );
} else if (props.type === "image") {
  contentPreview = (
    <div className="flex justify-center pt-6 items-center">
      <a href={props.link} target="_blank" rel="noopener noreferrer">
        <img src={props.link} alt={props.title} className="w-[90%] rounded-lg ml-3" />
      </a>
      <p>{props.date}</p>
    </div>
  );
} else if (props.type === "audio") {
  contentPreview = (
    <div className="flex justify-center pt-6 items-center">
      <a href={props.link} target="_blank" rel="noopener noreferrer">
        <audio controls className="w-[90%] rounded-lg ml-3">
          <source src={props.link} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </a>
      <p>{props.date}</p>
    </div>
  );
} else if (props.type === "url") {
  contentPreview = (
    <div className="flex justify-center pt-6 items-center"> 
      <a href={props.link} target="_blank" rel="noopener noreferrer">
        <div className="w-[90%] rounded-lg ml-3">
          <p className="text-blue-500 underline">{props.title}</p>
        </div>
      </a>
      <p>{props.date}</p>
    </div>
  );
}



  useEffect(() => {
    const videoId = getYoutubeId(props.link);
    if (videoId) {
      setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    } else {
      setThumbnail(null);
    }
  }, [props.link]);
  
  async function deleteHandle(){
    try{
      const token = localStorage.getItem("token");
      if(!token){
        alert("Please log in first");
        // navigate("/"); 
        return;
      }

      const res = await fetch(`http://localhost:5000/api/v1/delete/${props.title}`, {
        method: "Delete",
        headers: {
          "token": token
        },
        credentials: "include"
      });
      if(res.ok){
        alert("Item deleted");
        props.reload && props.reload();
        return;
      }
    }catch(err){
      console.log("item not deleted");
      return;
    }
  }

  return (
    <div className="border-2 w-[19vw] h-[50vh] rounded-md relative bg-white shadow-md ">
      <div className="flex justify-between pt-4 pl-2 pr-4 items-center pb-2 border-b-2 border-slate-300 shadow-md rounded-2xl">
        <div className="flex gap-2">
          <span className="pt-1"><DocumentIcon /></span>
          <span className="font-semibold text-2xl">{props.title}</span>
        </div>
        <div className="cursor-pointer hover:bg-red-600 hover:text-white rounded" onClick={deleteHandle}>
          <DeleteIcon />
        </div>
      </div>
      <div>
        {contentPreview}
      </div>
      <div className="flex gap-3 pt-4 pl-5">
        {props.tag.map((tag: string, index: number) => (
          <Tags key={index} tagTypes={tag} />
        ))}
      </div>

    </div>
  );
};

export default Card;