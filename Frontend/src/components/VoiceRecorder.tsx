import React, { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onVoiceProcessed: (action: string, data: any) => void;
  isProcessing?: boolean;
  userToken?: string; // Add user token prop
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onVoiceProcessed, isProcessing = false, userToken = '' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Use the most compatible audio format
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev: number) => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      setLocalProcessing(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('http://localhost:8000/api/voice/process/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process audio');
      }
      
      const result = await response.json();
      
      if (result.action === 'transcription_success') {
        // Audio was transcribed successfully, show the text for editing
        setTextInput(result.data.transcribed_text);
        setShowTextInput(true);
        setLocalProcessing(false);
      } else if (result.action === 'user_input_required') {
        // Transcription failed, show text input for manual typing
        setShowTextInput(true);
        setLocalProcessing(false);
      } else {
        // Process the result directly (for search actions)
        onVoiceProcessed(result.action, result.data);
        setLocalProcessing(false);
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      // Show text input as fallback
      setShowTextInput(true);
      setLocalProcessing(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    try {
      setLocalProcessing(true);
      
      const response = await fetch('http://localhost:8000/api/voice/text/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: textInput,
          token: userToken // Send user token
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process text');
      }
      
      const result = await response.json();
      
      if (result.action === 'content_created') {
        // Content was created successfully
        alert(`✅ ${result.data.message}`);
        // Reset the text input
        setTextInput('');
        setShowTextInput(false);
        setLocalProcessing(false);
        // Optionally refresh the page or update the content list
        window.location.reload();
      } else {
        // Handle other actions
        onVoiceProcessed(result.action, result.data);
        // Reset the text input
        setTextInput('');
        setShowTextInput(false);
        setLocalProcessing(false);
      }
      
    } catch (error) {
      console.error('Error processing text:', error);
      alert('Failed to process text input. Please try again.');
      setLocalProcessing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const showProcessing = localProcessing || isProcessing;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={showProcessing || showTextInput}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
          }
          ${(showProcessing || showTextInput) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
        title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
      >
        {isRecording ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      {isRecording && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>{formatTime(recordingTime)}</span>
          </div>
        </div>
      )}
      
      {showProcessing && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap z-50">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}

      {showTextInput && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white border-2 border-blue-300 rounded-lg p-4 shadow-xl z-50 min-w-80 max-w-96">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="text-sm text-gray-700 font-semibold">
              {textInput ? 'Edit Transcribed Text' : 'Voice Command Input'}
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            {textInput 
              ? 'Edit the transcribed text if needed, then submit:'
              : 'Please type your command:'
            }
          </div>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={textInput 
              ? "Edit the transcribed text here..."
              : "e.g., 'add text notes title is My Note description is This is my note and tag is important'"
            }
            className="w-full px-3 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
          />
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors flex-1"
            >
              {textInput ? 'Submit Command' : 'Submit'}
            </button>
            <button
              onClick={() => {
                setShowTextInput(false);
                setTextInput('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
