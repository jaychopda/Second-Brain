import DocumentIcon from "../icons/DocumentIcon";
import { HashtagIcon } from "../icons/HashtagIcon";
import { LinkIcon } from "../icons/LinkIcon";
import TwitterIcon from "../icons/TwitterIcon";
import { SidebarItem } from "./SidebarItem";
import YoutubeIcon from "../icons/YoutubeIcon";

export function Sidebar(){
    return <div className="h-screen w-64 bg-gray-900 text-white p-4">
        <SidebarItem title="Twitter" icon={<TwitterIcon />} />
        <SidebarItem title="Youtube" icon={<YoutubeIcon />} />
        <SidebarItem title="Documents" icon={<DocumentIcon/>}/>
        <SidebarItem title="Links" icon={<LinkIcon />} />
        <SidebarItem title="Hashtags" icon={<HashtagIcon />} />
    </div>
}