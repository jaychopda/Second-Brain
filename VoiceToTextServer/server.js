import express from "express";
import { WebSocketServer, WebSocket } from "ws";

const HTTP_PORT = 5000;        // optional HTTP (not strictly needed)
const WSS_PORT = 5001;         // browser connects here
const PY_WS_URL = "ws://127.0.0.1:2700"; // Python STT server

const app = express();
app.get("/", (_, res) => res.send("Voice-to-Text WebSocket relay running"));
app.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on http://localhost:${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: WSS_PORT });
console.log(`WebSocket relay server running on ws://localhost:${WSS_PORT}`);

wss.on("connection", (client) => {
  console.log("Browser connected to WebSocket relay");

  // Create a dedicated connection to Python for this client
  const py = new WebSocket(PY_WS_URL);

  py.on("open", () => {
    console.log("Connected to Python STT server");
    // When browser starts mic, it will send {"type":"start","sampleRate":16000}
    // Just relay control messages and binary frames verbatim.
  });

  // Relay Python -> Browser
  py.on("message", (data, isBinary) => {
    try {
      client.send(data, { binary: isBinary });
    } catch (error) {
      console.error("Error sending message to browser:", error.message);
    }
  });

  py.on("close", () => {
    console.log("Python STT server connection closed");
    try { 
      client.close(); 
    } catch (error) {
      console.error("Error closing browser connection:", error.message);
    }
  });

  py.on("error", (e) => {
    console.error("Python WebSocket error:", e.message);
    try {
      client.send(JSON.stringify({ type: "error", message: "STT backend error" }));
    } catch (error) {
      console.error("Error sending error message to browser:", error.message);
    }
  });

  // Relay Browser -> Python
  client.on("message", (data, isBinary) => {
    if (py.readyState === WebSocket.OPEN) {
      try {
        py.send(data, { binary: isBinary });
      } catch (error) {
        console.error("Error sending message to Python:", error.message);
      }
    }
  });

  client.on("close", () => {
    console.log("Browser connection closed");
    try { 
      py.close(); 
    } catch (error) {
      console.error("Error closing Python connection:", error.message);
    }
  });

  client.on("error", (e) => {
    console.error("Browser WebSocket error:", e.message);
    try {
      py.close(); 
    } catch (error) {
      console.error("Error closing Python connection:", error.message);
    }
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down WebSocket relay server...');
  wss.close(() => {
    console.log('WebSocket relay server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down WebSocket relay server...');
  wss.close(() => {
    console.log('WebSocket relay server closed');
    process.exit(0);
  });
});
