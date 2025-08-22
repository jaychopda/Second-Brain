// AudioWorkletProcessor that sends downsampled Int16 16k mono chunks to main thread
class PCMWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._sourceSampleRate = sampleRate; // audioContext.sampleRate provided by browser
    this._targetRate = 16000;
    
    // Buffer size for better recognition accuracy
    // Larger buffers provide more context but increase latency
    this._bufferSize = 4096; // Adjust this value for balance
    this._accumulatedBuffer = new Float32Array(0);
  }

  // Improved downsample with anti-aliasing filter
  _downsampleFloat32(buffer, sourceRate, targetRate) {
    if (targetRate === sourceRate) return buffer;
    
    const ratio = sourceRate / targetRate;
    const newLen = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLen);
    
    // Simple anti-aliasing: average multiple samples
    for (let i = 0; i < newLen; i++) {
      const startPos = i * ratio;
      const endPos = Math.min(startPos + ratio, buffer.length);
      let sum = 0;
      let count = 0;
      
      for (let j = Math.floor(startPos); j < endPos; j++) {
        sum += buffer[j];
        count++;
      }
      
      result[i] = sum / count;
    }
    
    return result;
  }

  _floatTo16BitPCM(float32) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return out;
  }

  process(inputs, _outputs, _params) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    // mono: take channel 0
    const ch0 = input[0];
    
    // Accumulate audio data for better recognition
    const newBuffer = new Float32Array(this._accumulatedBuffer.length + ch0.length);
    newBuffer.set(this._accumulatedBuffer);
    newBuffer.set(ch0, this._accumulatedBuffer.length);
    this._accumulatedBuffer = newBuffer;
    
    // Only process when we have enough data
    if (this._accumulatedBuffer.length >= this._bufferSize) {
      // downsample to 16k
      const ds = this._downsampleFloat32(this._accumulatedBuffer, this._sourceSampleRate, this._targetRate);
      // convert to int16
      const int16 = this._floatTo16BitPCM(ds);

      // send to main as transferable ArrayBuffer
      this.port.postMessage(int16.buffer, [int16.buffer]);
      
      // Keep only the last part for continuity
      const keepSize = Math.floor(this._bufferSize / 2);
      this._accumulatedBuffer = this._accumulatedBuffer.slice(-keepSize);
    }
    
    return true;
  }
}

registerProcessor('pcm-worklet', PCMWorklet);
