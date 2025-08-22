import React, { useEffect, useRef, useState } from "react";

interface VoiceToTextProps {
  onTranscriptUpdate: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceToText({ onTranscriptUpdate, onFinalTranscript, disabled = false }: VoiceToTextProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<{ stream: MediaStream; src: MediaStreamAudioSourceNode; worklet: AudioWorkletNode } | null>(null);

  const [connected, setConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partials, setPartials] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopStreaming();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const connectWS = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket("ws://localhost:5001"); // Node relay
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      console.log("Voice-to-text WebSocket connected");
    };

    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        const msg = JSON.parse(ev.data);
        if (msg.type === "system") {
          console.log(msg.message);
        } else if (msg.type === "started") {
          console.log("Backend started @", msg.sampleRate);
        } else if (msg.type === "partial") {
          setPartials(msg.text);
          onTranscriptUpdate(msg.text);
        } else if (msg.type === "final") {
          const newText = transcript ? transcript + " " + msg.text : msg.text;
          setTranscript(newText);
          setPartials("");
          onFinalTranscript(newText);
        } else if (msg.type === "ended") {
          console.log("Voice recognition ended");
        } else if (msg.type === "error") {
          setError(`STT error: ${msg.message}`);
          console.error("STT error:", msg.message);
        }
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("Voice-to-text WebSocket closed");
    };

    ws.onerror = (e) => {
      setError("WebSocket connection error");
      console.error("WebSocket error", e);
    };

    wsRef.current = ws;
  };

  const startStreaming = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWS();
      // small wait to ensure connection is open
      await new Promise((r) => setTimeout(r, 300));
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setError("Failed to connect to voice recognition service");
        return;
      }
    }

    try {
      // init AudioContext and Worklet
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        latencyHint: "interactive" 
      });
      acRef.current = ac;

      // load worklet
      await ac.audioWorklet.addModule("/pcm-worklet.js");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = ac.createMediaStreamSource(stream);

      const worklet = new AudioWorkletNode(ac, "pcm-worklet");
      worklet.port.onmessage = (e) => {
        const buffer = e.data; // ArrayBuffer of Int16 PCM @16k
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(buffer); // binary frame
        }
      };

      src.connect(worklet);
      worklet.connect(ac.destination); // optional (keeps the graph alive)

      nodeRef.current = { stream, src, worklet };

      // tell backend to start with sampleRate 16000
      wsRef.current.send(JSON.stringify({ type: "start", sampleRate: 16000 }));
      setStarted(true);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to start voice recognition: ${errorMsg}`);
      console.error("Error starting voice recognition:", err);
    }
  };

  const stopStreaming = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
    }
    if (nodeRef.current) {
      try { nodeRef.current.worklet.disconnect(); } catch {}
      try { nodeRef.current.src.disconnect(); } catch {}
      try { nodeRef.current.stream.getTracks().forEach(t => t.stop()); } catch {}
      nodeRef.current = null;
    }
    if (acRef.current) {
      try { acRef.current.close(); } catch {}
      acRef.current = null;
    }
    setStarted(false);
  };

  const clearTranscript = () => {
    setTranscript("");
    setPartials("");
    onTranscriptUpdate("");
    onFinalTranscript("");
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Voice to Text</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={connectWS}
            disabled={connected || disabled}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Connect
          </button>
          <button
            onClick={startStreaming}
            disabled={!connected || started || disabled}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start
          </button>
          <button
            onClick={stopStreaming}
            disabled={!started || disabled}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Stop
          </button>
          <button
            onClick={clearTranscript}
            disabled={!transcript && !partials || disabled}
            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {partials && (
          <div>
            <div className="text-xs text-gray-500">Partial:</div>
            <div className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200 min-h-[20px]">
              {partials}
            </div>
          </div>
        )}

        {transcript && (
          <div>
            <div className="text-xs text-gray-500">Transcript:</div>
            <div className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 min-h-[20px] whitespace-pre-wrap">
              {transcript}
            </div>
          </div>
        )}

              {!transcript && !partials && (
        <div className="text-xs text-gray-400 text-center py-4">
          {connected ? "Click Start to begin voice recognition" : "Click Connect to start voice recognition service"}
        </div>
      )}

      {/* Accuracy Tips */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
        <div className="font-medium mb-1">💡 Tips for Better Accuracy:</div>
        <ul className="space-y-1 text-blue-700">
          <li>• Speak clearly and at a moderate pace</li>
          <li>• Use a good quality microphone</li>
          <li>• Minimize background noise</li>
          <li>• Speak complete sentences</li>
          <li>• Ensure stable internet connection</li>
        </ul>
      </div>
      </div>

      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
        {started && (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span>Recording...</span>
          </>
        )}
      </div>
    </div>
  );
}
