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
import {BACKEND_URL} from '../config'


function Dashboard() {
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
        console.log(response.data.contents)
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
    console.log(mainContents)
    const type = event.getAttribute("title");
    const filteredContents = mainContents.filter((content: any) => content.type === type);
    setContents(filteredContents);
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
    console.log('Second Brain search:', query);

    const response = await axios.get(`${BACKEND_URL}/api/v1/secondBrainSearch/${query}`, {
        headers: {
          token: localStorage.getItem("token") || ""
        }
    });
    console.log(response.data.data)
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
    <div className='min-h-screen bg-gray-800 flex'>
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
        <Sidebar />
      </div>

      {/* Collapsed Sidebar Icons (Desktop and Mobile) */}
      <div className={`
        ${!sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed flex flex-col
        w-16 bg-gray-900 shadow-lg border-r border-blue-200 h-full z-40
        transition-transform duration-300 ease-in-out
      `}>
        <div className="flex justify-center items-center p-4 border-b border-gray-200">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
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
          
          <div className="p-3 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-white" title="image" onClick={(e) => handleSidebarCall(e.currentTarget)}>
            <HashtagIcon />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`
        flex-1 transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'lg:ml-64' : 'ml-16 lg:ml-16'}
      `}>
        <div className='p-4 lg:p-8'>
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
                          value={`http://localhost:3000/api/v1/brain/${shareHash}`}
                          readOnly
                          className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`http://localhost:3000/api/v1/brain/${shareHash}`);
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

          {/* Header Section */}
          <div className='mb-6 lg:mb-8'>
            <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 lg:mb-6'>
              <div className='mb-4 lg:mb-0'>
                <h1 className='text-2xl lg:text-3xl font-bold text-white mb-2 cursor-pointer' onClick={() => setContents(mainContents)}>My Second Brain</h1>
                <p className='text-gray-300 text-sm lg:text-base'>Organize and manage your digital knowledge</p>
              </div>


              <div className='flex flex-col gap-3 lg:gap-4'>
                <div className='flex gap-2 lg:gap-3'>
                  <Button 
                    variant="primary" 
                    text="Add Content" 
                    size="sm" 
                    startIcon={<PlusIcon />} 
                    onClick={() => setModalOpen(true)} 
                  />
                  <Button 
                    variant="secondary" 
                    text="Share Brain" 
                    startIcon={<ShareIcon />} 
                    onClick={() => setShareModalOpen(true)} 
                    size="sm" 
                  />
                </div>
                
                {/* Search Bar */}
                <div className='relative search-dropdown'>
                  <div className="flex">
                    {/* Search Input */}
                    <input
                      type="text"
                      placeholder={`${searchType === 'normal' ? 'Search your content...' : 'Ask Second Brain...'}`}
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="flex-1 px-4 py-2 pr-10 text-sm bg-white border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Dropdown Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setSearchType('normal');
                                setIsDropdownOpen(false);
                                setSearchQuery('');
                                setContents(mainContents);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                searchType === 'normal' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              Normal Search
                            </button>
                            <button
                              onClick={() => {
                                setSearchType('secondbrain');
                                setIsDropdownOpen(false);
                                setSearchQuery('');
                                setContents(mainContents);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                searchType === 'secondbrain' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                            >
                              Second Brain Search
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  
                </div>
                
                {/* Go To Dashboard Button */}
                <div className='mt-3'>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v6m4-6v6m4-6v6" />
                    </svg>
                    <span>Go To Dashboard</span>
                  </button>
                </div>
                
                {/* Search Icon */}
                  <button  onClick={()=> handleSecondBrainSearch(searchQuery)} className='flex items-center cursor:pointer'>
                    <div className="absolute inset-y-0 right-12 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    search
                  </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8'>
              <div className='bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-xs lg:text-sm font-medium text-gray-600'>Total Content</p>
                    <p className='text-xl lg:text-2xl font-bold text-gray-900'>{contents.length}</p>
                  </div>
                  <div className='w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <svg className='w-5 h-5 lg:w-6 lg:h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
                    </svg>
                  </div>
                </div>
              </div>
              

              
              <div className='bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 sm:col-span-2 lg:col-span-1'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-xs lg:text-sm font-medium text-gray-600'>Categories</p>
                    <p className='text-xl lg:text-2xl font-bold text-gray-900'>8</p>
                  </div>
                  <div className='w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                    <svg className='w-5 h-5 lg:w-6 lg:h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className='mb-6'>
            <h2 className='text-lg lg:text-xl font-semibold text-white mb-4'>Recent Content</h2>

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
    </div>
  )
}


function Notes(props: any) {
  return(
  <>
    {props.contents.map((content: any, index: number) => (
    <Card
      key={index}
      link={content.link}
      tag={content.tags.map((tag: any) => tag.title)}
      title={content.title}
      type={content.type}
      date={new Date(content.createdAt).toLocaleDateString() || ""}
    />
    ))}
  </>
  )
}

export default Dashboard