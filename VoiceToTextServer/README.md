# Voice-to-Text Server

This server provides real-time speech-to-text functionality for the Second Brain application using WebSocket streaming and Vosk speech recognition.

## Architecture

- **Python STT Server** (port 2700): Handles speech recognition using Vosk
- **Node.js Relay Server** (port 5001): Bridges browser and Python server
- **React Frontend**: Captures audio and displays transcripts

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd "Second Brain/VoiceToTextServer"
pip install -r requirements.txt
```

### 2. Download Vosk Model

Download the English small model from: https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip

Extract it to: `D:\Project\Second Brain API 2\Voice To Text\vosk-model-small-en-us-0.15\vosk-model-small-en-us-0.15`

**Important**: Make sure the path in `server.py` matches your actual model location.

### 3. Install Node.js Dependencies

```bash
cd "Second Brain/VoiceToTextServer"
npm install
```

## Running the Servers

### Start Python STT Server

```bash
cd "Second Brain/VoiceToTextServer"
python server.py
```

You should see:
```
Loading Vosk model from: D:\Project\Second Brain API 2\Voice To Text\vosk-model-small-en-us-0.15\vosk-model-small-en-us-0.15
Vosk model loaded successfully!
Vosk STT server listening on ws://0.0.0.0:2700
Model path: D:\Project\Second Brain API 2\Voice To Text\vosk-model-small-en-us-0.15\vosk-model-small-en-us-0.15
Press Ctrl+C to stop the server
```

### Start Node.js Relay Server

In a new terminal:

```bash
cd "Second Brain/VoiceToTextServer"
npm start
```

You should see:
```
HTTP server running on http://localhost:5000
WebSocket relay server running on ws://localhost:5001
```

## Usage in Frontend

1. Open the Second Brain application
2. Click "Add New Content"
3. Select "Text Note" as content type
4. Use the Voice-to-Text feature:
   - Click "Connect" to establish WebSocket connection
   - Click "Start" to begin recording
   - Speak into your microphone
   - Click "Stop" to end recording
   - The transcribed text will appear in the description field

## Troubleshooting

### Common Issues

1. **Model path error**: Update the `MODEL_PATH` in `server.py` to match your actual Vosk model location
2. **Port conflicts**: Make sure ports 2700 and 5001 are not in use by other applications
3. **Microphone access**: Ensure your browser has permission to access the microphone
4. **WebSocket connection**: Check that both servers are running and accessible

### Firewall Issues

During development, use `localhost` or `127.0.0.1`. If you need external access, configure your firewall to allow connections on ports 2700 and 5001.

### Performance Tips

- For better accuracy, use a higher-quality Vosk model
- Ensure good microphone quality and quiet environment
- The system works best with clear, slow speech

## API Protocol

### Client to Server Messages

- `{"type": "start", "sampleRate": 16000}` - Start recognition
- `{"type": "stop"}` - Stop recognition
- Binary PCM data - Audio chunks (16kHz mono, 16-bit)

### Server to Client Messages

- `{"type": "system", "message": "..."}` - System status
- `{"type": "started", "sampleRate": 16000}` - Recognition started
- `{"type": "partial", "text": "..."}` - Partial transcript
- `{"type": "final", "text": "..."}` - Final transcript
- `{"type": "ended"}` - Recognition ended
- `{"type": "error", "message": "..."}` - Error message
