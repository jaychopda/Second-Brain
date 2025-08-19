import DocumentIcon from "../icons/DocumentIcon";
import { HashtagIcon } from "../icons/HashtagIcon";
import { LinkIcon } from "../icons/LinkIcon";
import TwitterIcon from "../icons/TwitterIcon";
import { SidebarItem } from "./SidebarItem";
import YoutubeIcon from "../icons/YoutubeIcon";
import AudioIcon from "../icons/AudioIcon";
import ImageIcon from "../icons/ImageIcon";
import { useUserData } from "../hooks/useUserData";

interface SidebarProps {
  onProfile?: () => void;
  onLogout?: () => void;
}

export function Sidebar({ onProfile, onLogout }: SidebarProps = {}) {
    const { userName, userEmail, userAvatar, userInitial } = useUserData();

    const handleProfile = () => {
        if (onProfile) {
            onProfile();
        } else {
            window.location.href = '/profile';
        }
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            localStorage.removeItem("token");
            window.location.href = '/signin';
        }
    };

    return (
        <div className="h-screen w-64 bg-gray-900 text-white flex flex-col">
            {/* Profile Section */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                    {userAvatar ? (
                        <img 
                            src={userAvatar} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {userInitial}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{userName}</p>
                        <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                    </div>
                </div>
                
                {/* Profile Actions */}
                <div className="space-y-2">
                    <button
                        onClick={handleProfile}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                    </button>
                    
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Content Categories */}
            <div className="flex-1 p-4 space-y-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Content Types</h3>
                <SidebarItem title="Twitter" icon={<TwitterIcon />} />
                <SidebarItem title="Youtube" icon={<YoutubeIcon />} />
                <SidebarItem title="Documents" icon={<DocumentIcon/>}/>
                <SidebarItem title="Links" icon={<LinkIcon />} />
                <SidebarItem title="Audio" icon={<AudioIcon />} />
                <SidebarItem title="Images" icon={<ImageIcon />} />
                <SidebarItem title="Hashtags" icon={<HashtagIcon />} />
            </div>
        </div>
    );
}