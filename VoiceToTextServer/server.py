import asyncio
import json
import websockets
from vosk import Model, KaldiRecognizer
import os

# ======= CONFIG =======
# Update this path to point to your Vosk model directory
MODEL_PATH = r"D:\Project\Second Brain API 2\Voice To Text\vosk-model-small-en-us-0.15\vosk-model-small-en-us-0.15"
HOST = "0.0.0.0"
PORT = 2700
# ======================

if not os.path.isdir(MODEL_PATH):
    raise RuntimeError(f"MODEL_PATH not found or invalid: {MODEL_PATH}")

print(f"Loading Vosk model from: {MODEL_PATH}")
MODEL = Model(MODEL_PATH)
print("Vosk model loaded successfully!")

async def stt_session(websocket):
    """
    Protocol from client:
      - JSON text message: {"type":"start","sampleRate":16000}
      - binary messages: raw PCM int16 little-endian audio chunks
      - JSON text message: {"type":"stop"} to finish
    Server sends JSON: {"type":"partial","text": "..."} or {"type":"final","text":"..."}
    """
    recognizer = None
    sample_rate = 16000

    await websocket.send(json.dumps({"type": "system", "message": "STT ready"}))

    try:
        async for message in websocket:
            # Binary = audio; Text = control
            if isinstance(message, bytes):
                # Push audio to recognizer
                if recognizer is None:
                    # Ignore stray audio before start
                    continue
                if recognizer.AcceptWaveform(message):
                    result = json.loads(recognizer.Result())
                    text = result.get("text", "")
                    if text:
                        await websocket.send(json.dumps({"type": "final", "text": text}))
                else:
                    # partial
                    partial = json.loads(recognizer.PartialResult()).get("partial", "")
                    if partial:
                        await websocket.send(json.dumps({"type": "partial", "text": partial}))
            else:
                # Text/control message
                data = json.loads(message)
                msg_type = data.get("type")

                if msg_type == "start":
                    sample_rate = int(data.get("sampleRate", 16000))
                    recognizer = KaldiRecognizer(MODEL, sample_rate)
                    recognizer.SetWords(True)
                    await websocket.send(json.dumps({"type": "started", "sampleRate": sample_rate}))
                    print(f"Started STT session with sample rate: {sample_rate}")

                elif msg_type == "stop":
                    if recognizer is not None:
                        final = json.loads(recognizer.FinalResult()).get("text", "")
                        if final:
                            await websocket.send(json.dumps({"type": "final", "text": final}))
                    await websocket.send(json.dumps({"type": "ended"}))
                    print("STT session ended")
                    break

                else:
                    await websocket.send(json.dumps({"type": "error", "message": f"Unknown type {msg_type}"}))

    except websockets.exceptions.ConnectionClosed:
        print("WebSocket connection closed")
    except Exception as e:
        print(f"Error in STT session: {e}")
        try:
            await websocket.send(json.dumps({"type": "error", "message": f"Internal error: {str(e)}"}))
        except:
            pass

async def main():
    print(f"Vosk STT server listening on ws://{HOST}:{PORT}")
    print(f"Model path: {MODEL_PATH}")
    print("Press Ctrl+C to stop the server")
    
    async with websockets.serve(stt_session, HOST, PORT, max_size=2**24):  # allow big frames
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down STT server...")
    except Exception as e:
        print(f"Fatal error: {e}")
