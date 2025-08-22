import React from "react";
import VoiceToText from "../components/VoiceToText";

export default function VoiceTest() {
  const [transcript, setTranscript] = React.useState("");
  const [finalTranscript, setFinalTranscript] = React.useState("");

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
              <VoiceToText
                onTranscriptUpdate={setTranscript}
                onFinalTranscript={setFinalTranscript}
              />
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
              <li>Make sure both servers are running (Python STT + Node.js Relay)</li>
              <li>Click "Connect" to establish WebSocket connection</li>
              <li>Click "Start" to begin voice recognition</li>
              <li>Speak clearly into your microphone</li>
              <li>Click "Stop" to end recording</li>
              <li>Watch the partial and final transcripts appear</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
              <p className="text-blue-900 text-sm">
                <strong>Note:</strong> This test page helps verify that the voice-to-text 
                functionality works independently before integrating it into the main application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
