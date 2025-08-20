import DocumentIcon from "../icons/DocumentIcon";
import NotionIcon from "../icons/NotionIcon";
import DeleteIcon from "../icons/DeleteIcon";
import Tags from "./Tags";
import { type JSX, useEffect, useState } from "react";
import TwitterIcon from "../icons/TwitterIcon";
import { BACKEND_URL } from "../config";
import { Link } from "react-router-dom";
import axios from "axios";

interface CardProps {
  type: string
  tag: string[];
  title: string;
  link: string; 
  description?: string;
  date?: string; // Optional date prop for displaying creation date
  _id: string; 
  isViewOnly?: boolean; // Optional prop to hide delete functionality
  isPublic?: boolean; // New prop to indicate public/private status
}

const Card = (props: CardProps) => {

  const [isPublic, setIsPublic] = useState(props.isPublic ?? false);

  // Sync isPublic state with props.isPublic changes
  useEffect(() => {
    setIsPublic(props.isPublic ?? false);
  }, [props.isPublic]);

  // Toggle public/private status
  const handleTogglePublic = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in first");
        return;
      }
      // Update public/private status in backend
      const res = await axios.patch(`${BACKEND_URL}/api/v1/content/public-toggle`, {
        id: props._id,
        isPublic: !isPublic
      }, {
        headers: {
          "token": token,
          "Content-Type": "application/json"
        }
      });
      console.log(res)
      if (res.status === 200) {
        setIsPublic(!isPublic);
      } else {
        alert("Failed to update public/private status");
      }
    } catch (err) {
      console.error("Toggle public/private error:", err);
      alert("Failed to update status. Please try again.");
    }
  };
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const [tweetData, setTweetData] = useState<any>(null);
  const [loadingTweet, setLoadingTweet] = useState(false);
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

  const getTweetId = (url: string): string | null => {
    // Extract tweet ID from various Twitter URL formats
    const patterns = [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/,
      /twitter\.com\/\w+\/statuses\/(\d+)/,
      /x\.com\/\w+\/statuses\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const fetchTweetData = async (tweetId: string) => {
    setLoadingTweet(true);
    try {
      // Use our backend proxy to avoid CORS issues
      const response = await fetch(`${BACKEND_URL}/api/v1/twitter-embed/${tweetId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setTweetData({ error: 'Tweet not found or may be private' });
        } else {
          setTweetData({ error: 'Failed to load tweet' });
        }
        return;
      }
      
      const data = await response.json();
      setTweetData(data);
    } catch (error) {
      console.error('Error fetching tweet:', error);
      setTweetData({ error: 'Failed to load tweet' });
    } finally {
      setLoadingTweet(false);
    }
  };
  useEffect(() => {
    setIsPublic(props.isPublic ?? false);
  }, [props.isPublic]);

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
        {loadingTweet ? (
          <div className="w-full h-32 bg-blue-50 rounded-lg mb-3 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading tweet...</p>
            </div>
          </div>
        ) : tweetData && !tweetData.error ? (
          <div className="w-full">
            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-left">
              <div className="flex items-start justify-between">
                <div className="text-sm text-gray-700 flex-1">
                  <p className="line-clamp-3 leading-relaxed">
                    {tweetData.provider_name && (
                      <span className="text-blue-500 font-medium">@{tweetData.author_name || 'Twitter'}: </span>
                    )}
                    {/* Extract text from HTML or show truncated version */}
                    {tweetData.html 
                      ? tweetData.html.replace(/<[^>]*>/g, '').substring(0, 120) + (tweetData.html.length > 120 ? '...' : '')
                      : 'Tweet content preview...'
                    }
                  </p>
                </div>
                {/* Media indicator */}
                {tweetData.media?.mediaCount && tweetData.media.mediaCount > 0 && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="flex items-center space-x-1">
                      {tweetData.media.images && tweetData.media.images.length > 0 && (
                        <div className="flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {tweetData.media.images.length}
                        </div>
                      )}
                      {tweetData.media.videos && tweetData.media.videos.length > 0 && (
                        <div className="flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1m-6-8V6a2 2 0 012-2h4a2 2 0 012 2v4M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {tweetData.media.videos.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link 
                to={`/tweet/info/${getTweetId(props.link)}`}
                className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-center font-medium"
              >
                View Full Tweet
              </Link>
              <a 
                href={props.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-100 text-gray-700 text-xs py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Open on Twitter
              </a>
            </div>
          </div>
        ) : tweetData?.error ? (
          <div className="w-full">
            <div className="w-full h-32 bg-red-50 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-center">
                <TwitterIcon />
                <p className="text-sm text-red-600 mt-2">{tweetData.error}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link 
                to={`/tweet/info/${getTweetId(props.link)}`}
                className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-center font-medium"
              >
                View Full Tweet
              </Link>
              <a 
                href={props.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-100 text-gray-700 text-xs py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Open on Twitter
              </a>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="w-full h-32 bg-blue-50 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-center">
                <TwitterIcon />
                <p className="text-sm text-gray-600 mt-2">Twitter Post</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link 
                to={`/tweet/info/${getTweetId(props.link)}`}
                className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-center font-medium"
              >
                View Full Tweet
              </Link>
              <a 
                href={props.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-100 text-gray-700 text-xs py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Open on Twitter
              </a>
            </div>
          </div>
        )}
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
        <div 
          className="w-full h-32 bg-gray-50 rounded-lg mb-3 p-3 overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setShowFullText(!showFullText)}
        >
          {props.description ? (
            <div className="h-full overflow-y-auto">
              <p className={`text-sm text-gray-700 leading-relaxed ${showFullText ? '' : 'line-clamp-6'}`}>
                {props.description}
              </p>
            </div>
          ) : props.link ? (
            <div className="h-full overflow-y-auto">
              <p className={`text-sm text-gray-700 leading-relaxed ${showFullText ? '' : 'line-clamp-6'}`}>
                {props.link}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <DocumentIcon />
                <p className="text-sm text-gray-600 mt-2">Text Content</p>
              </div>
            </div>
          )}
        </div>
        {(props.description || props.link) && (
          <p className="text-xs text-gray-500 text-center">
            {showFullText ? 'Click to collapse' : 'Click to expand'}
          </p>
        )}
      </div>
    );
  } else if (props.type === "image") {
    contentPreview = (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
          {props.link ? (
            <a href={props.link} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
              <img 
                src={props.link} 
                alt={props.title} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTZMOC41ODU3OSAxMS40MTQyQzguOTYwODYgMTEuMDM5MSA5LjU5MTQzIDExLjAzOTEgOS45NjY1IDExLjQxNDJMMTYgMTdNMTQgMTVMMTUuNTg1OCAxMy40MTQyQzE1Ljk2MDkgMTMuMDM5MSAxNi41OTE0IDEzLjAzOTEgMTYuOTY2NSAxMy40MTQyTDIwIDE2LjVNNiAxM0g2LjAxTTYgM0gyMEMyMS4xMDQ2IDMgMjIgMy44OTU0MyAyMiA1VjE5QzIyIDIwLjEwNDYgMjEuMTA0NiAyMSAyMCAyMUg0QzIuODk1NDMgMjEgMiAyMC4xMDQ2IDIgMTlWNUMyIDMuODk1NDMgMi44OTU0MyAzIDQgM1oiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                  e.currentTarget.className = "w-full h-full object-center p-8 text-gray-400";
                }}
              />
            </a>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">No Image</span>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center">
          {props.link ? 'Click to view full image' : 'Image not available'}
        </p>
      </div>
    );
  } else if (props.type === "audio") {
    contentPreview = (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-full h-20 bg-purple-50 rounded-lg mb-3 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-8 h-8 text-purple-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-sm text-gray-600 mt-2">Audio File</p>
          </div>
        </div>
        {props.link ? (
          <audio controls className="w-full text-xs" preload="none">
            <source src={props.link} type="audio/mpeg" />
            <source src={props.link} type="audio/wav" />
            <source src={props.link} type="audio/ogg" />
            Your browser does not support the audio element.
          </audio>
        ) : (
          <p className="text-xs text-gray-500 text-center">Audio file not available</p>
        )}
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
    if (props.type === "youtube") {
      const videoId = getYoutubeId(props.link);
      if (videoId) {
        setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      } else {
        setThumbnail(null);
      }
    } else if (props.type === "twitter") {
      const tweetId = getTweetId(props.link);
      if (tweetId) {
        fetchTweetData(tweetId);
      }
    }
  }, [props.link, props.type]);
  
  async function deleteHandle(){
    try{
      const token = localStorage.getItem("token");
      if(!token){
        alert("Please log in first");
        return;
      }
      // Use the ID if available, otherwise fall back to title
      const res = await axios.delete(`${BACKEND_URL}/api/v1/content`,{
        headers: {
          "token": token,
          "Content-Type": "application/json"
        },
        data: {
          id: props._id
        }
      });

      if(res.status === 200){
        alert("Item deleted successfully");
        return;
      } else {
        const errorData = await res.data.catch(() => ({}));
        alert(`Failed to delete item: ${errorData.message || 'Unknown error'}`);
      }
    }catch(err){
      console.error("Delete error:", err);
      alert("Failed to delete item. Please try again.");
      return;
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-300 flex flex-col h-80" style={{ transition: 'transform 0.3s' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-10px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
    >
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
        <div className="flex items-center gap-2">
          {/* Public/Private Toggle - hide if isViewOnly */}
          {!props.isViewOnly && (
            <>
              <button
                onClick={handleTogglePublic}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isPublic ? 'bg-blue-600' : 'bg-gray-300'}`}
                title={isPublic ? 'Public' : 'Private'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
              <span className={`text-xs font-semibold ${isPublic ? 'text-blue-600' : 'text-gray-500'}`}>{isPublic ? 'Public' : 'Private'}</span>
            </>
          )}
          {/* Delete Button */}
          {!props.isViewOnly && (
            <button 
              onClick={deleteHandle}
              className="p-1 hover:bg-red-50 hover:text-red-600 rounded transition-colors duration-200 flex-shrink-0"
            >
              <DeleteIcon />
            </button>
          )}
        </div>
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