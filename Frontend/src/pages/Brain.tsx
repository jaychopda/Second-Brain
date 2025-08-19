import { Button } from '../components/Button'
import Card from '../components/Card'
import { PlusIcon } from '../icons/PlusIcon'
import { ShareIcon } from '../icons/ShareIcon'
import { CreateContentModel } from '../components/CreateContentModal'
import { useState, useEffect } from 'react'
import { Sidebar } from '../components/Sidebar'
import axios from 'axios'
import TwitterIcon from '../icons/TwitterIcon'
import YoutubeIcon from '../icons/YoutubeIcon'
import DocumentIcon from '../icons/DocumentIcon'
import { LinkIcon } from '../icons/LinkIcon'
import { HashtagIcon } from '../icons/HashtagIcon'
import ImageIcon from '../icons/ImageIcon'
import AudioIcon from '../icons/AudioIcon'
import {BACKEND_URL} from '../config'
import Topbar from '../components/Topbar'
import { useUserData } from '../hooks/useUserData'


function Brain() {
  const { userInitial } = useUserData();
  // Chat modal state for floating chat button
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle mouse down for dragging chat modal
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setChatPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  // Tag dropdown state and tag list
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Collect all unique hashtags from notes whenever contents change
  const [modalOpen, setModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isShareEnabled, setIsShareEnabled] = useState(false);
  const [shareHash, setShareHash] = useState('');
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainContents, setMainContents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'normal' | 'secondbrain'>('normal');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Set sidebar state based on screen size
  useEffect(() => {
    const tagsSet = new Set<string>();
    mainContents.forEach((content: any) => {
      if (Array.isArray(content.tags)) {
        content.tags.forEach((tag: any) => {
          if (tag.title) tagsSet.add(tag.title);
        });
      }
    });
    setAllTags(Array.from(tagsSet));
  }, [mainContents]);

  // Filter notes by selected tag
  const handleTagFilter = (tag: string) => {
    setContents(mainContents.filter((content: any) => content.tags.some((t: any) => t.title === tag)));
    setTagDropdownOpen(false);
  };
  useEffect(() => {
    const handleResize = () => {
      // Sidebar is closed by default on both desktop and mobile
      setSidebarOpen(false);
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch contents on mount
  useEffect(() => {
    const fetchContents = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/v1/content`, {
          headers: {
            token: localStorage.getItem("token") || ""
          }
        });
        setMainContents(response.data.contents);
        setContents(response.data.contents);
      } catch (error) {
        console.error("Error fetching contents:", error);
        setContents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, []);

  const refreshContents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/content`, {
        headers: {
          token: localStorage.getItem("token") || ""
        }
      });
      setMainContents(response.data.contents);
      setContents(mainContents);
    } catch (error) {
      console.error("Error fetching contents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarCall = async (event:any) => {
    const type = event.getAttribute("title");
    if (type === "image") {
      // Filter notes with type 'image'
      const filteredContents = mainContents.filter((content: any) => content.type === "image");
      setContents(filteredContents);
    } else if (type === "audio") {
      // Filter notes with type 'audio'
      const filteredContents = mainContents.filter((content: any) => content.type === "audio");
      setContents(filteredContents);
    } else {
      const filteredContents = mainContents.filter((content: any) => content.type === type);
      setContents(filteredContents);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setContents(mainContents);
    } else {
      if (searchType === 'normal') {
        // Normal search functionality
        const filteredContents = mainContents.filter((content: any) => 
          content.title.toLowerCase().includes(query.toLowerCase()) ||
          content.tags.some((tag: any) => tag.title.toLowerCase().includes(query.toLowerCase()))
        );
        setContents(filteredContents);
      }
    }
  };

  const handleSecondBrainSearch = async (query: string) => {
    // Second Brain search function - to be implemented

    const response = await axios.get(`${BACKEND_URL}/api/v1/secondBrainSearch/${query}`, {
        headers: {
          token: localStorage.getItem("token") || ""
        }
    });
    setContents(response.data.data);
  };

  const handleShareBrain = async (enable: boolean) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/brain/share`, {
        share: enable
      }, {
        headers: {
          token: localStorage.getItem("token") || ""
        }
      });
      
      if (enable && response.data.share) {
        setIsShareEnabled(true);
        setShareHash(response.data.share.hash);
      } else {
        setIsShareEnabled(false);
        setShareHash('');
      }
    } catch (error) {
      console.error("Error sharing brain:", error);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 flex flex-col'>
      <Topbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        searchQuery={searchQuery}
        onChangeQuery={(v) => handleSearch(v)}
        searchType={searchType}
        onChangeSearchType={(t) => {
          setSearchType(t)
          setIsDropdownOpen(false)
          setSearchQuery('')
          setContents(mainContents)
        }}
        onExecuteSearch={() => {
          if (searchType === 'secondbrain') {
            handleSecondBrainSearch(searchQuery)
          } else {
            handleSearch(searchQuery)
          }
        }}
        onOpenAddContent={() => setModalOpen(true)}
        onOpenShare={() => setShareModalOpen(true)}
        onNavigateToBrain={() => { window.location.href = '/brain' }}
        onNavigateToOthers={() => { window.location.href = '/others-brain' }}
        onNavigateToDashboard={() => { window.location.href = '/' }}
        context={'brain'}
      />
      
      <div className='flex flex-1'>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed lg:fixed
        w-64 bg-gray-900 shadow-lg border-r border-blue-200 h-full z-50
        transition-transform duration-300 ease-in-out
      `}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold bg-gray-900 text-white">The Second Brain</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <Sidebar 
          onProfile={() => { window.location.href = '/profile' }}
          onLogout={() => {
            localStorage.removeItem("token");
            window.location.href = '/signin';
          }}
        />
      </div>

            {/* Collapsed Sidebar Icons (Desktop and Mobile) */}
      <div className={`
        ${!sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed flex flex-col
        w-16 bg-gray-900 shadow-lg border-r border-blue-200 h-full z-40
        transition-transform duration-300 ease-in-out
      `}>
        {/* Profile Icon */}
        <div className="flex flex-col items-center pt-4 pb-4 border-b border-gray-700">
          <div 
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:scale-105 transition-transform"
            onClick={() => window.location.href = '/profile'}
            title="Go to Profile"
          >
            {userInitial}
          </div>
        </div>        
        {/* Sidebar Icons */}
        <div className="flex flex-col items-center pt-4 space-y-4">
          <div className="p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-white" title="twitter" onClick={(e) => handleSidebarCall(e.currentTarget)}>
            <TwitterIcon />
          </div>
          <div className="p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-white" title="youtube" onClick={(e) => handleSidebarCall(e.currentTarget)}>
            <YoutubeIcon />
          </div>
          <div className="p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-white" title="text" onClick={(e) => handleSidebarCall(e.currentTarget)}>
            <DocumentIcon />
          </div>
          <div className="p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-white" title="url" onClick={(e) => handleSidebarCall(e.currentTarget)}>
            <LinkIcon />
          </div>
          {/* Image Icon for image notes */}
          <div className="p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-white" title="image" onClick={(e) => handleSidebarCall(e.currentTarget)}>
            <ImageIcon />
          </div>
          {/* Audio Icon for audio notes */}
          <div className="p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-white" title="audio" onClick={(e) => handleSidebarCall(e.currentTarget)}>
            <AudioIcon />
          </div>
          <div className="p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-white relative" title="hashtag" onClick={() => setTagDropdownOpen(!tagDropdownOpen)}>
            <HashtagIcon />
            {tagDropdownOpen && (
              <div className="absolute left-12 top-0 bg-white border border-blue-200 rounded-xl shadow-lg z-50 min-w-[140px]">
                <div className="py-2">
                  {allTags.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500">No tags</div>
                  ) : (
                    allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagFilter(tag)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-700"
                      >
                        #{tag}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`
        flex-1 transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'lg:ml-64' : 'ml-16 lg:ml-16'}
      `}>
        <div className='p-4 lg:p-8'>
          {/* Hero Section */}
          <div className='mb-8 rounded-2xl p-8 bg-gradient-to-r from-blue-700 via-purple-700 to-blue-900 shadow-xl flex flex-col items-center justify-center animate-fade-in'>
            <h1 className='text-4xl lg:text-5xl font-extrabold text-white mb-2 drop-shadow-lg'>Welcome to Your Second Brain</h1>
            <p className='text-lg lg:text-xl text-blue-100 mb-4'>Capture, organize, and share your digital knowledge in style.</p>
            <span className='italic text-purple-200 text-base'>"The mind is for having ideas, not holding them."</span>
          </div>
          <CreateContentModel open={modalOpen} onClose={() => setModalOpen(false)} />
          
          {/* Share Modal */}
          {shareModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Share Your Second Brain</h2>
                  <button
                    onClick={() => setShareModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      {isShareEnabled ? 'Sharing Enabled' : 'Sharing Disabled'}
                    </span>
                    <button
                      onClick={() => handleShareBrain(!isShareEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isShareEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isShareEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {isShareEnabled ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Share this link to give others access to your Second Brain content:
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={`${shareHash}`}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${shareHash}`);
                            alert("Link copied to clipboard!");
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Enable sharing to generate a shareable link for your Second Brain content.
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShareModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className='mb-6 lg:mb-8'>
                <h1 className='text-2xl lg:text-3xl font-bold text-white mb-2 cursor-pointer hover:text-blue-300 transition' onClick={() => setContents(mainContents)}>
                  <span className='bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent'>My Second Brain</span>
                </h1>
            <p className='text-blue-200 text-sm lg:text-base'>All your captured knowledge in one place</p>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8'>
              <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 p-4 lg:p-6 rounded-xl shadow-lg border border-blue-300 animate-fade-in'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-xs lg:text-sm font-medium text-blue-100'>Total Content</p>
                    <p className='text-xl lg:text-2xl font-bold text-white'>{contents.length}</p>
                  </div>
                  <div className='w-10 h-10 lg:w-12 lg:h-12 bg-blue-300 rounded-lg flex items-center justify-center'>
                    <svg className='w-5 h-5 lg:w-6 lg:h-6 text-blue-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
                    </svg>
                  </div>
                </div>
              </div>
              

              
              <div className='bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 p-4 lg:p-6 rounded-xl shadow-lg border border-purple-300 sm:col-span-2 lg:col-span-1 animate-fade-in'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-xs lg:text-sm font-medium text-purple-100'>Categories</p>
                    <p className='text-xl lg:text-2xl font-bold text-white'>8</p>
                  </div>
                  <div className='w-10 h-10 lg:w-12 lg:h-12 bg-purple-300 rounded-lg flex items-center justify-center'>
                    <svg className='w-5 h-5 lg:w-6 lg:h-6 text-purple-900' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className='mb-6'>
            <h2 className='text-lg lg:text-xl font-semibold text-white mb-4'>All Notes</h2>

            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                <span className='ml-3 text-gray-600 text-sm lg:text-base'>Loading your content...</span>
              </div>
            ) : contents.length === 0 ? (
              <div className='text-center py-12'>
                <div className='w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg className='w-6 h-6 lg:w-8 lg:h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                </div>
                <h3 className='text-base lg:text-lg font-medium text-gray-900 mb-2'>No content yet</h3>
                <p className='text-gray-600 mb-4 text-sm lg:text-base'>Start building your second brain by adding your first content</p>
                <Button 
                  variant="primary" 
                  text="Add Content" 
                  size="sm" 
                  startIcon={<PlusIcon />} 
                  onClick={() => setModalOpen(true)} 
                />
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6'>
                <Notes contents={contents} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Floating Chat Button */}
      <button
        onClick={() => setChatModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 flex items-center justify-center z-40 hover:scale-105"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Modal */}
      {chatModalOpen && (
        <div 
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50"
          style={{
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            width: '400px',
            height: '600px',
            maxHeight: '80vh',
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          <div className="flex flex-col h-full">
            <div 
              className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg cursor-grab select-none"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900 ml-2">Second Brain Chat</h2>
              </div>
              <button
                onClick={() => setChatModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {/* You can replace this with your actual chat sidebar/component */}
              <div className="h-full flex items-center justify-center text-gray-500">Chat goes here</div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}


function Notes(props: any) {
  return(
    <>
      {props.contents.map((content: any, index: number) => (
        <div className="transform hover:scale-105 transition duration-300 ease-in-out">
          <Card
            isPublic={content.isPublic}
            key={index}
            link={content.link}
            tag={content.tags.map((tag: any) => tag.title)}
            _id={content._id}
            title={content.title}
            type={content.type}
            date={new Date(content.createdAt).toLocaleDateString() || ""}
          />
        </div>
      ))}
    </>
  )
}

export default Brain