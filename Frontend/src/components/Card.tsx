import DocumentIcon from "../icons/DocumentIcon";
import NotionIcon from "../icons/NotionIcon";
import DeleteIcon from "../icons/DeleteIcon";
import Tags from "./Tags";
import { type JSX, useEffect, useState } from "react";
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

  // Content preview based on type
  if (props.type === "youtube") {
    contentPreview = (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {thumbnail ? (
            <a href={props.link} target="_blank" rel="noopener noreferrer" className="w-full h-full">
              <img src={thumbnail} alt={props.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
            </a>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1m-6-8V6a2 2 0 012-2h4a2 2 0 012 2v4M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm mt-2">YouTube Video</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center">Click to watch video</p>
      </div>
    );
  } else if (props.type === "twitter") {
    contentPreview = (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-32 bg-blue-50 rounded-lg mb-3 flex items-center justify-center">
          <div className="text-center">
            <TwitterIcon />
            <p className="text-sm text-gray-600 mt-2">Twitter Post</p>
          </div>
        </div>
        <a href={props.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline text-center">
          View on Twitter
        </a>
      </div>
    );
  } else if (props.type === "notion") {
    contentPreview = (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-32 bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
          <div className="text-center">
            <NotionIcon />
            <p className="text-sm text-gray-600 mt-2">Notion Page</p>
          </div>
        </div>
        <a href={props.link} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline text-center">
          Open in Notion
        </a>
      </div>
    );
  } else if (props.type === "text") {
    contentPreview = (
      <div className="p-4">
        <div className="w-full h-32 bg-gray-50 rounded-lg mb-3 flex items-center justify-center p-3">
          <div className="text-center">
            <DocumentIcon />
            <p className="text-sm text-gray-600 mt-2">Text Content</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center line-clamp-2">{props.title}</p>
      </div>
    );
  } else if (props.type === "image") {
    contentPreview = (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
          <a href={props.link} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
            <img src={props.link} alt={props.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
          </a>
        </div>
        <p className="text-xs text-gray-500 text-center">Click to view full image</p>
      </div>
    );
  } else if (props.type === "audio") {
    contentPreview = (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-32 bg-purple-50 rounded-lg mb-3 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-8 h-8 text-purple-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-sm text-gray-600 mt-2">Audio File</p>
          </div>
        </div>
        <audio controls className="w-full text-xs">
          <source src={props.link} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  } else if (props.type === "url") {
    contentPreview = (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-32 bg-blue-50 rounded-lg mb-3 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-8 h-8 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-sm text-gray-600 mt-2">Web Link</p>
          </div>
        </div>
        <a href={props.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline text-center line-clamp-1">
          {props.link}
        </a>
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-80">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <DocumentIcon />
          <h3 
            className="font-semibold text-gray-900 truncate text-sm cursor-help" 
            title={props.title}
          >
            {props.title}
          </h3>
        </div>
        <button 
          onClick={deleteHandle}
          className="p-1 hover:bg-red-50 hover:text-red-600 rounded transition-colors duration-200 flex-shrink-0"
        >
          <DeleteIcon />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {contentPreview}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {props.tag.slice(0, 3).map((tag: string, index: number) => (
            <Tags key={index} tagTypes={tag} />
          ))}
          {props.tag.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
              +{props.tag.length - 3}
            </span>
          )}
        </div>
        
        {/* Date */}
        {props.date && (
          <p className="text-xs text-gray-500">{props.date}</p>
        )}
      </div>
    </div>
  );
};

export default Card;