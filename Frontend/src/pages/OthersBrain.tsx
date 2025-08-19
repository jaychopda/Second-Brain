import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Card from '../components/Card'
import { BACKEND_URL } from '../config'

interface SharedContent {
  id: string;
  title: string;
  link: string;
  isPublic: boolean;
  type: string;
  tags: { title: string }[];
  createdAt: string;
}

export default function OthersBrain() {
  const [brainHash, setBrainHash] = useState('')
  const [contents, setContents] = useState<SharedContent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const navigate = useNavigate()

  const fetchOthersBrain = async () => {
    if (!brainHash.trim()) {
      setError('Please enter a valid brain hash')
      return
    }

    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/brain/${brainHash}`)
      // Only keep public notes
      const publicContents = (response.data.share.contents || []).filter((item: SharedContent) => item.isPublic === true);
      setContents(publicContents)
      if (publicContents.length === 0) {
        setError('This brain appears to be empty, private, or the hash is invalid')
      }
    } catch (error: any) {
      console.error('Error fetching shared brain:', error)
      if (error.response?.status === 404) {
        setError('Brain not found. Please check the hash and try again.')
      } else if (error.response?.status === 403) {
        setError('This brain is not shared publicly.')
      } else {
        setError('Failed to load brain. Please try again.')
      }
      setContents([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchOthersBrain()
    }
  }

  return (
    <div className='min-h-screen bg-gray-800'>
      {/* Header */}
      <div className='bg-gray-900 shadow-lg border-b border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-6'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => navigate('/')}
                className='flex items-center space-x-2 text-gray-300 hover:text-white transition-colors'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <div className='w-px h-6 bg-gray-600'></div>
              <h1 className='text-2xl font-bold text-white'>Explore Others' Second Brain</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Search Section */}
        <div className='bg-white rounded-lg shadow-lg p-6 mb-8'>
          <div className='mb-6'>
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>Access a Shared Brain</h2>
            <p className='text-gray-600'>
              Enter the brain hash shared by another user to explore their knowledge collection.
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <label htmlFor='brainHash' className='block text-sm font-medium text-gray-700 mb-2'>
                Brain Hash
              </label>
              <input
                id='brainHash'
                type='text'
                value={brainHash}
                onChange={(e) => setBrainHash(e.target.value)}
                onKeyPress={handleInputKeyPress}
                placeholder='Enter brain hash (e.g. abc123def456...)'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            <div className='flex items-end'>
              <button
                onClick={fetchOthersBrain}
                disabled={loading || !brainHash.trim()}
                className='px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2'
              >
                {loading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                    </svg>
                    <span>Explore Brain</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
              <div className='flex items-center'>
                <svg className='w-5 h-5 text-red-400 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z' />
                </svg>
                <p className='text-red-700'>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className='bg-white rounded-lg shadow-lg p-6'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                <span className='ml-3 text-gray-600'>Loading brain contents...</span>
              </div>
            ) : contents.length > 0 ? (
              <>
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                    Shared Brain Contents ({contents.length} items)
                  </h3>
                  <p className='text-gray-600'>
                    Explore the knowledge and resources shared by this user.
                  </p>
                </div>
                
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {contents.map((content, index) => (
                    <Card
                      key={content.id || index}
                      link={content.link}
                      isPublic={content.isPublic}
                      tag={content.tags.map((tag) => tag.title)}
                      title={content.title}
                      _id={content.id}
                      type={content.type}
                      date={new Date(content.createdAt).toLocaleDateString() || ""}
                      isViewOnly={true}
                    />
                  ))}
                </div>
              </>
            ) : (
              !error && (
                <div className='text-center py-12'>
                  <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                    </svg>
                  </div>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>No content found</h3>
                  <p className='text-gray-600'>This shared brain appears to be empty.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Instructions Section */}
        {!hasSearched && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
            <div className='flex items-start'>
              <svg className='w-6 h-6 text-blue-600 mt-1 mr-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <div>
                <h3 className='text-lg font-medium text-blue-900 mb-2'>How to use</h3>
                <ul className='text-blue-800 space-y-2'>
                  <li className='flex items-start'>
                    <span className='font-medium mr-2'>1.</span>
                    Get a brain hash from someone who has shared their Second Brain
                  </li>
                  <li className='flex items-start'>
                    <span className='font-medium mr-2'>2.</span>
                    Paste the hash in the input field above
                  </li>
                  <li className='flex items-start'>
                    <span className='font-medium mr-2'>3.</span>
                    Click "Explore Brain" to view their shared content
                  </li>
                  <li className='flex items-start'>
                    <span className='font-medium mr-2'>4.</span>
                    Browse through their notes, links, and resources
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
