# Voice-to-Text Feature Setup Guide

This guide will help you set up the voice-to-text functionality in your Second Brain application.

## 🎯 What We've Implemented

1. **VoiceToText Component** - React component for real-time voice recognition
2. **PCM Audio Worklet** - Processes audio in real-time (16kHz mono, 16-bit)
3. **Python STT Server** - Speech recognition using Vosk
4. **Node.js Relay Server** - WebSocket bridge between browser and Python
5. **Integration** - Added to CreateContentModal for text notes

## 🚀 Quick Start

### Step 1: Install Dependencies

#### Python Dependencies
```bash
cd "Second Brain/VoiceToTextServer"
pip install -r requirements.txt
```

#### Node.js Dependencies
```bash
cd "Second Brain/VoiceToTextServer"
npm install
```

### Step 2: Download Vosk Model

1. Download the English small model: https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
2. Extract to: `D:\Project\Second Brain API 2\Voice To Text\vosk-model-small-en-us-0.15\vosk-model-small-en-us-0.15`
3. Verify the path in `server.py` matches your location

### Step 3: Start Servers

#### Option A: Use Startup Scripts
- **Windows**: Double-click `start.bat` or `start.ps1`
- **PowerShell**: Right-click `start.ps1` → "Run with PowerShell"

#### Option B: Manual Start
```bash
# Terminal 1 - Python STT Server
cd "Second Brain/VoiceToTextServer"
python server.py

# Terminal 2 - Node.js Relay Server
cd "Second Brain/VoiceToTextServer"
npm start
```

### Step 4: Test the Feature

1. Navigate to `/voice-test` in your React app
2. Click "Connect" → "Start"
3. Speak into your microphone
4. Watch real-time transcription

## 🔧 How It Works

### Architecture Flow
```
Microphone → AudioWorklet → WebSocket → Node.js Relay → Python Vosk → Text
```

### Components
- **PCM Worklet**: Captures 16kHz mono audio, converts to Int16
- **WebSocket Streaming**: Real-time audio transmission
- **Vosk Recognition**: Offline speech-to-text processing
- **React Integration**: Seamless UI experience

## 📱 Usage in CreateContentModal

1. Open "Add New Content"
2. Select "Text Note" type
3. Use the Voice-to-Text section:
   - Connect to service
   - Start recording
   - Speak your content
   - Stop recording
   - Text appears in description field

## 🐛 Troubleshooting

### Common Issues

#### "Model path not found"
- Check `MODEL_PATH` in `server.py`
- Ensure Vosk model is extracted correctly
- Verify folder structure matches path

#### "WebSocket connection failed"
- Check both servers are running
- Verify ports 2700 and 5001 are free
- Check firewall settings

#### "Microphone access denied"
- Allow microphone access in browser
- Check system microphone permissions
- Try refreshing the page

#### "Audio not working"
- Check browser supports AudioWorklet
- Verify PCM worklet loaded correctly
- Check console for errors

### Debug Steps

1. **Check Server Status**
   - Python: Should show "Vosk model loaded successfully"
   - Node.js: Should show "WebSocket relay server running"

2. **Browser Console**
   - Look for WebSocket connection messages
   - Check for audio context errors
   - Verify worklet loading

3. **Network Tab**
   - Confirm WebSocket connections
   - Check for failed requests

## 🔄 Development Workflow

### Making Changes

1. **Frontend**: Edit `VoiceToText.tsx` or `CreateContentModal.tsx`
2. **Backend**: Edit `server.py` or `server.js`
3. **Restart servers** after backend changes
4. **Refresh browser** after frontend changes

### Testing

1. Use `/voice-test` page for isolated testing
2. Test in CreateContentModal for integration
3. Check different browsers and devices
4. Test with various audio qualities

## 📊 Performance Tips

- **Model Quality**: Use larger Vosk models for better accuracy
- **Audio Quality**: Good microphone + quiet environment
- **Network**: Local development for best performance
- **Browser**: Modern browsers with AudioWorklet support

## 🔒 Security Considerations

- **Development Only**: Current setup uses localhost
- **Production**: Implement proper authentication
- **HTTPS**: Required for production microphone access
- **Rate Limiting**: Consider for production use

## 📚 Additional Resources

- [Vosk Documentation](https://alphacephei.com/vosk/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Check server console output
4. Review browser console errors
5. Ensure correct file paths and ports

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Both servers start without errors
- ✅ WebSocket connections establish
- ✅ Microphone permission is granted
- ✅ Audio recording starts
- ✅ Real-time text appears
- ✅ Final transcripts are generated

---

**Happy Voice Typing! 🎤✨**
