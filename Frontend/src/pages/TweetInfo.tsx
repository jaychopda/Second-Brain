import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import TwitterIcon from '../icons/TwitterIcon';

interface TweetData {
  html: string;
  author_name: string;
  author_url: string;
  provider_name: string;
  provider_url: string;
  url: string;
  width: number;
  height: number;
  version: string;
  type: string;
  cache_age: number;
  error?: string;
  media?: {
    images: string[];
    videos: string[];
    hasMedia: boolean;
    mediaCount: number;
    mediaHints?: boolean;
    indicators?: {
      hasPicTwitter: boolean;
      hasMediaClasses: boolean;
      hasMediaDomains: boolean;
      hasMediaAttrs: boolean;
      hasPlayer: boolean;
      hasAttachment: boolean;
    };
    extractionInfo?: {
      foundImages: number;
      foundVideos: number;
      detectionMethod: string;
      configUsed: string;
    };
  };
  extraction_debug?: {
    htmlLength: number;
    containsPicTwitter: boolean;
    containsMediaDomains: boolean;
  };
  enhanced_html?: string;
}

const TweetInfo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tweetData, setTweetData] = useState<TweetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Tweet ID is required');
      setLoading(false);
      return;
    }

    console.log('Tweet ID from URL params:', id); // Debug log
    fetchTweetData(id);
  }, [id]);

  const fetchTweetData = async (tweetId: string) => {
    try {
      setLoading(true);
      console.log('Fetching tweet data for ID:', tweetId); // Debug log
      const response = await fetch(`${BACKEND_URL}/api/v1/twitter-embed/${tweetId}`);
      
      console.log('Response status:', response.status); // Debug log
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Tweet not found or may be private');
        } else {
          setError('Failed to load tweet');
        }
        return;
      }
      
      const data = await response.json();
      console.log('Tweet data received:', data); // Debug log
      setTweetData(data);
    } catch (err) {
      console.error('Error fetching tweet:', err);
      setError('Failed to load tweet');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tweet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <TwitterIcon />
            <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Tweet Not Available</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleGoBack}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Go Back
              </button>
              <a
                href={`https://twitter.com/user/status/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open on Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Tweet Details</h1>
        </div>

        {/* Tweet Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tweet Header */}
          <div className="bg-blue-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TwitterIcon />
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {tweetData?.author_name || 'Twitter User'}
                  </h2>
                  <p className="text-sm text-gray-600">Twitter Post</p>
                </div>
              </div>
              <div className="flex gap-3">
                {tweetData?.author_url && (
                  <a
                    href={tweetData.author_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    View Profile
                  </a>
                )}
                <a
                  href={`https://twitter.com/user/status/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Open on Twitter
                </a>
              </div>
            </div>
          </div>

          {/* Tweet Body */}
          <div className="p-6">
            {tweetData?.html ? (
              <div className="space-y-6">
                {/* Main Tweet Content */}
                <div 
                  className="twitter-embed prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: tweetData.enhanced_html || tweetData.html }}
                  style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#1f2937'
                  }}
                />

                {/* Enhanced Media Display */}
                {tweetData.media?.hasMedia && tweetData.media.mediaCount > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Media Content ({tweetData.media.mediaCount} items)
                    </h3>
                    
                    {/* Images */}
                    {tweetData.media.images && tweetData.media.images.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Images ({tweetData.media.images.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {tweetData.media.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={image} 
                                alt={`Tweet image ${index + 1}`}
                                className="w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => window.open(image, '_blank')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center">
                                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {tweetData.media.videos && tweetData.media.videos.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Videos ({tweetData.media.videos.length})</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {tweetData.media.videos.map((video, index) => (
                            <div key={index} className="relative">
                              {video.includes('video') ? (
                                <video 
                                  controls
                                  className="w-full h-auto rounded-lg shadow-md"
                                  poster={video.includes('poster') ? video : undefined}
                                >
                                  <source src={video} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                              ) : (
                                <div className="bg-gray-100 rounded-lg p-4 text-center">
                                  <p className="text-gray-600">Video thumbnail detected</p>
                                  <img 
                                    src={video} 
                                    alt={`Video thumbnail ${index + 1}`}
                                    className="w-full h-auto rounded-lg shadow-md mt-2"
                                    onClick={() => window.open(`https://twitter.com/user/status/${id}`, '_blank')}
                                  />
                                  <p className="text-sm text-gray-500 mt-2">Click to view video on Twitter</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extraction Info for Debugging */}
                    {tweetData.media && tweetData.media.extractionInfo && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <details className="cursor-pointer">
                          <summary className="text-sm font-medium text-gray-700">Media Extraction Details</summary>
                          <div className="mt-2 text-xs text-gray-600 space-y-1">
                            <p>Images found: {tweetData.media.extractionInfo.foundImages}</p>
                            <p>Videos found: {tweetData.media.extractionInfo.foundVideos}</p>
                            <p>Detection method: {tweetData.media.extractionInfo.detectionMethod}</p>
                            <p>Config used: {tweetData.media.extractionInfo.configUsed}</p>
                            {tweetData.media.indicators && (
                              <div className="mt-2 border-t pt-2">
                                <p className="font-medium">Detection indicators:</p>
                                <p>pic.twitter.com: {tweetData.media.indicators.hasPicTwitter ? 'Yes' : 'No'}</p>
                                <p>Media domains: {tweetData.media.indicators.hasMediaDomains ? 'Yes' : 'No'}</p>
                                <p>Media classes: {tweetData.media.indicators.hasMediaClasses ? 'Yes' : 'No'}</p>
                                <p>Player detected: {tweetData.media.indicators.hasPlayer ? 'Yes' : 'No'}</p>
                              </div>
                            )}
                            {tweetData.extraction_debug && (
                              <div className="mt-2 border-t pt-2">
                                <p className="font-medium">Debug info:</p>
                                <p>HTML length: {tweetData.extraction_debug.htmlLength} chars</p>
                                <p>Contains pic.twitter: {tweetData.extraction_debug.containsPicTwitter ? 'Yes' : 'No'}</p>
                                <p>Contains media domains: {tweetData.extraction_debug.containsMediaDomains ? 'Yes' : 'No'}</p>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Always show Twitter link for media */}
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>Note:</strong> Some Twitter media may not display directly due to Twitter's content policies. 
                        You can always view the full content by opening the tweet on Twitter.
                      </p>
                      <a 
                        href={`https://twitter.com/user/status/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        Open Full Tweet on Twitter
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <TwitterIcon />
                <p className="text-gray-500 mt-4">Tweet content not available</p>
              </div>
            )}
          </div>

          {/* Tweet Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Provider:</span> {tweetData?.provider_name || 'Twitter'}
              </div>
              <div>
                <span className="font-medium">Type:</span> {tweetData?.type || 'rich'}
              </div>
              <div>
                <span className="font-medium">Media:</span> {
                  tweetData?.media?.mediaCount && tweetData.media.mediaCount > 0 ? 
                    `${tweetData.media.mediaCount} item(s)` : 'None'
                }
              </div>
            </div>
            {tweetData?.media?.hasMedia && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {tweetData.media.images && tweetData.media.images.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {tweetData.media.images.length} Image(s)
                    </span>
                  )}
                  {tweetData.media.videos && tweetData.media.videos.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {tweetData.media.videos.length} Video(s)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 text-center">
          <button
            onClick={handleGoBack}
            className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TweetInfo;
