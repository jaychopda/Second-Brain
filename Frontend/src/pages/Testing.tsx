import { useState } from "react";


const Testing = () => {
  // useVoiceRecorder.tsx
const useVoiceRecorder = () => {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const newRecorder = new MediaRecorder(stream);
    newRecorder.start();

    const chunks: Blob[] = [];
    newRecorder.ondataavailable = e => chunks.push(e.data);
    newRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
    };

    setRecorder(newRecorder);
  };

  const stopRecording = () => recorder?.stop();

  const uploadAudio = async () => {
    if (!audioBlob) return;
    const form = new FormData();
    form.append("audio", audioBlob, "voice.webm");

    await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: form,
    });
  };

  return { startRecording, stopRecording, uploadAudio };
};

};
export default Testing