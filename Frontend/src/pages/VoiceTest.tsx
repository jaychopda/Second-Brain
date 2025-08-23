import React from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export default function VoiceTest() {
  const [transcript, setTranscript] = React.useState("");
  const [finalTranscript, setFinalTranscript] = React.useState("");
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  // Audio recording handler
  const handleRecordAudio = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Audio recording is not supported in this browser.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(audioBlob);
          // Stop all tracks to release the mic
          stream.getTracks().forEach(track => track.stop());
          
          // Automatically transcribe the audio
          if (audioBlob.size > 0) {
            await transcribeAudio(audioBlob);
          }
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        alert('Could not start audio recording: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  // Transcribe audio using Django backend
  const transcribeAudio = async (audioBlob: Blob) => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await axios.post(`${BACKEND_URL}/api/voice/transcribe/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'token': localStorage.getItem("token") || ""
        }
      });
      
      if (response.data.success && response.data.transcribed_text) {
        const transcribedText = response.data.transcribed_text;
        setFinalTranscript(transcribedText);
        // Append to existing transcript instead of replacing
        setTranscript(prev => {
          const separator = prev ? '\n\n' : '';
          return prev + separator + transcribedText;
        });
      } else {
        alert('Transcription failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Voice-to-Text Test Page
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Voice-to-Text Component */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Voice Recognition
              </h2>
              <div className="space-y-4">
                <button
                  type="button"
                  className={`px-6 py-3 rounded-lg text-white font-semibold shadow hover:opacity-90 transition ${isRecording ? 'bg-red-600' : 'bg-blue-600'}`}
                  onClick={handleRecordAudio}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                
                {audioBlob && (
                  <>
                    <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
                  </>
                )}
              </div>
            </div>

            {/* Results Display */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Results
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Current Partial Text:
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 min-h-[60px]">
                    {transcript || (
                      <span className="text-gray-400 text-sm">
                        No partial text yet...
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Final Transcript:
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 min-h-[120px]">
                    {finalTranscript || (
                      <span className="text-gray-400 text-sm">
                        No final transcript yet...
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Combined Text:
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 min-h-[120px]">
                    {finalTranscript + (transcript ? " " + transcript : "") || (
                      <span className="text-gray-400 text-sm">
                        No text content yet...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              How to Test:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Make sure the Django backend server is running</li>
              <li>Click "Start Recording" to begin voice recording</li>
              <li>Speak clearly into your microphone</li>
              <li>Click "Stop Recording" to end recording</li>
              <li>Watch the transcript appear in the results section</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
              <p className="text-blue-900 text-sm">
                <strong>Note:</strong> This test page uses the Django backend's Sarvam AI transcription service 
                to convert your voice to text. Make sure you have a valid API key configured.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
