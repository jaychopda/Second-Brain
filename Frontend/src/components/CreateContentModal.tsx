import axios from "axios";
import { CloseIcon } from "../icons/CloseIcon"
import { useRef, useState, useEffect } from "react";
import { BACKEND_URL } from "../config";

export const CreateContentModel = ({open, onClose}: {open: boolean, onClose: () => void})=>{
    const titleRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState('');
    const linkRef = useRef<HTMLInputElement>(null);
    const tagsRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const audioRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLInputElement>(null);
    
    const [selectedType, setSelectedType] = useState<string>('');
    const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [uploading, setUploading] = useState(false);

    // Add state for recording
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

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
            console.log('Starting transcription...');
            console.log('Audio blob size:', audioBlob.size);
            console.log('Audio blob type:', audioBlob.type);
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            console.log('FormData created, sending request to:', `${BACKEND_URL}/api/voice/transcribe/`);
            
            const response = await axios.post(`http://127.0.0.1:8000/api/voice/transcribe/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'token': localStorage.getItem("token") || ""
                }
            });
            
            console.log('Response received:', response);
            
                         if (response.data.success && response.data.transcribed_text) {
                 console.log('Transcription successful:', response.data.transcribed_text);
                 // Append transcribed text to existing description
                 if (descriptionRef.current) {
                     const currentValue = descriptionRef.current.value;
                     const separator = currentValue ? '\n\n' : '';
                     descriptionRef.current.value = currentValue + separator + response.data.transcribed_text;
                 }
             } else {
                console.log('Transcription failed:', response.data);
                alert('Transcription failed: ' + (response.data.error || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Transcription error details:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                console.error('Request was made but no response received:', error.request);
            } else {
                console.error('Error setting up request:', error.message);
            }
            alert('Failed to transcribe audio. Please try again.');
        } finally {
            setIsTranscribing(false);
        }
    };

    // Set initial modal position in center-right
    useEffect(() => {
        if (open) {
            setModalPosition({ x: window.innerWidth - 650, y: 50 });
        }
    }, [open]);

    // Handle mouse down for dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - modalPosition.x,
            y: e.clientY - modalPosition.y
        });
    };

    // Handle mouse move for dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setModalPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleSubmit = async () => {
        if (uploading) return; // Prevent multiple submissions
        
        // Use state value for title
        const tags = tagsRef.current?.value;
        
        if (!title || title.trim() === '') {
            alert("Please enter a title");
            return;
        }
        
        let link = '';
        let description = '';
        
        setUploading(true);
        
        try {
            // Handle different input types based on selected type
            if (selectedType === 'text') {
                description = descriptionRef.current?.value || '';
            } else if (selectedType === 'audio') {
                // Handle audio file upload
                const audioFile = audioRef.current?.files?.[0];
                if (audioFile) {
                    console.log("Uploading audio file:", audioFile.name);
                    const uploadedUrl = await uploadFileToCloudinary(audioFile);
                    link = uploadedUrl;
                    console.log("Audio uploaded successfully:", uploadedUrl);
                } else if (audioBlob) {
                    // Upload recorded audioBlob
                    const recordedFile = new File([audioBlob], `recorded-audio-${Date.now()}.webm`, { type: 'audio/webm' });
                    console.log("Uploading recorded audio blob:", recordedFile.name);
                    const uploadedUrl = await uploadFileToCloudinary(recordedFile);
                    link = uploadedUrl;
                    console.log("Recorded audio uploaded successfully:", uploadedUrl);
                }
            } else if (selectedType === 'image') {
                // Handle image file upload
                const imageFile = imageRef.current?.files?.[0];
                if (imageFile) {
                    console.log("Uploading image file:", imageFile.name);
                    const uploadedUrl = await uploadFileToCloudinary(imageFile);
                    link = uploadedUrl;
                    console.log("Image uploaded successfully:", uploadedUrl);
                }
            } else {
                // For other types (youtube, twitter, notion, url), use link input
                link = linkRef.current?.value || '';
            }

            const tagsArr = tags?.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) || []; 

            console.log("Creating content with:", { title, link: link || description, tags: tagsArr, type: selectedType });

            const response = await axios.post(`${BACKEND_URL}/api/v1/content`, {
                title,
                link: link || description, // Use description for text type
                tags: tagsArr,
                type: selectedType
            }, {
                headers: {
                    token: localStorage.getItem("token") || ""
                }
            });
            
            console.log("Content created successfully:", response.data);
            
            // Reset form
            if (titleRef.current) titleRef.current.value = '';
            if (linkRef.current) linkRef.current.value = '';
            if (tagsRef.current) tagsRef.current.value = '';
            if (descriptionRef.current) descriptionRef.current.value = '';
            if (audioRef.current) audioRef.current.value = '';
            if (imageRef.current) imageRef.current.value = '';
            setSelectedType('');
            onClose();
            
        } catch (error: any) {
            console.error("Error creating content:", error);
            
            // More specific error messages
            if (error.response) {
                // Server responded with error status
                alert(`Failed to create content: ${error.response.data.message || error.response.statusText}`);
            } else if (error.request) {
                // Request was made but no response received
                alert("Failed to create content: No response from server. Please check your connection.");
            } else {
                // Something else happened
                alert(`Failed to create content: ${error.message}`);
            }
        } finally {
            console.log("Setting uploading to false");
            setUploading(false);
        }
    };

    // Function to upload file to Cloudinary via backend
    const uploadFileToCloudinary = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const fileData = e.target?.result as string;
                
                try {
                    const response = await axios.post(`${BACKEND_URL}/api/v1/upload-base64`, {
                        fileData,
                        fileName: file.name,
                        fileType: file.type
                    }, {
                        headers: {
                            token: localStorage.getItem("token") || ""
                        }
                    });
                    
                    if (response.data.url) {
                        resolve(response.data.url);
                    } else {
                        reject(new Error("No URL received from server"));
                    }
                } catch (error) {
                    console.error("Upload error:", error);
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    };

    const handleClose = () => {
        // Reset form when closing
        if (titleRef.current) titleRef.current.value = '';
        if (linkRef.current) linkRef.current.value = '';
        if (tagsRef.current) tagsRef.current.value = '';
        if (descriptionRef.current) descriptionRef.current.value = '';
        if (audioRef.current) audioRef.current.value = '';
        if (imageRef.current) imageRef.current.value = '';
        setTitle('');
        setSelectedType('');
        onClose();
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'text':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'image':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
            case 'audio':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                );
            case 'youtube':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                );
            case 'twitter':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                );
            case 'notion':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
                    </svg>
                );
            case 'url':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const contentTypes = [
        { value: 'text', label: 'Text Note', description: 'Create a text note or document' },
        { value: 'image', label: 'Image', description: 'Upload an image file' },
        { value: 'audio', label: 'Audio', description: 'Upload an audio file' },
        { value: 'youtube', label: 'YouTube', description: 'Save a YouTube video link' },
        { value: 'twitter', label: 'Twitter', description: 'Save a Twitter post link' },
        { value: 'notion', label: 'Notion', description: 'Save a Notion page link' },
        { value: 'url', label: 'Other Link', description: 'Save any other web link' }
    ];

    const renderDynamicFields = () => {
        if (!selectedType) return null;

        return (
            <div className="space-y-4">
                {/* Title field - always shown */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        ref={titleRef}
                        type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        placeholder="Enter a descriptive title"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Dynamic content based on type */}
                {selectedType === 'text' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            ref={descriptionRef}
                            placeholder="Write your text content here..."
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
                        />
                        
                        {/* Voice to Text Feature */}
                        <div className="mt-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Voice to Text</span>
                            </div>
                            <div className="flex flex-col items-start space-y-2">
                                <button
                                    type="button"
                                    className={`px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition ${isRecording ? 'bg-red-600' : ''}`}
                                    onClick={handleRecordAudio}
                                >
                                    {isRecording ? 'Stop Recording' : 'Record Audio'}
                                </button>
                                {audioBlob && (
                                    <>
                                        <audio controls src={URL.createObjectURL(audioBlob)} className="mt-2" />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {selectedType === 'audio' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Audio File</label>
                        <input
                            ref={audioRef}
                            type="file"
                            accept="audio/*"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {/* Record Audio button */}
                        <div className="mt-4 flex flex-col items-start">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition ${isRecording ? 'bg-red-600' : ''}`}
                                onClick={handleRecordAudio}
                            >
                                {isRecording ? 'Stop Recording' : 'Record Audio'}
                            </button>
                            {/* Show audio preview if recorded */}
                            {audioBlob && (
                                <audio controls src={URL.createObjectURL(audioBlob)} className="mt-2" />
                            )}
                        </div>
                    </div>
                )}

                {selectedType === 'image' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
                        <input
                            ref={imageRef}
                            type="file"
                            accept="image/*"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                )}

                {['youtube', 'twitter', 'notion', 'url'].includes(selectedType) && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {selectedType === 'youtube' ? 'YouTube URL' : 
                             selectedType === 'twitter' ? 'Twitter URL' :
                             selectedType === 'notion' ? 'Notion URL' : 'Website URL'}
                        </label>
                        <input
                            ref={linkRef}
                            type="url"
                            placeholder={`Enter ${selectedType === 'url' ? 'website' : selectedType} link here...`}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                )}

                {/* Tags field - always shown */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                        ref={tagsRef}
                        type="text"
                        placeholder="Enter tags separated by commas (e.g., work, important, idea)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>
        );
    };

    if (!open) return null;

    return (
        <div 
            className="fixed bg-white rounded-2xl shadow-2xl border border-gray-200 z-50"
            style={{
                left: `${modalPosition.x}px`,
                top: `${modalPosition.y}px`,
                width: '600px',
                maxHeight: '80vh',
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            <div className="flex flex-col max-h-[80vh]">
                {/* Draggable Header */}
                <div 
                    className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl cursor-grab select-none"
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="flex items-center space-x-2 ml-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add New Content</h2>
                                <p className="text-xs text-gray-500">Drag to move this window</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {!selectedType ? (
                            /* Type Selection */
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">What type of content would you like to add?</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {contentTypes.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => setSelectedType(type.value)}
                                            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="text-gray-400 group-hover:text-blue-500 transition-colors mt-1">
                                                    {getTypeIcon(type.value)}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-900">{type.label}</h4>
                                                    <p className="text-sm text-gray-500 group-hover:text-blue-700">{type.description}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Content Form */
                            <div>
                                <div className="flex items-center space-x-3 mb-6">
                                    <button
                                        onClick={() => setSelectedType('')}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex items-center space-x-2">
                                        <div className="text-blue-500">
                                            {getTypeIcon(selectedType)}
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {contentTypes.find(t => t.value === selectedType)?.label}
                                        </h3>
                                    </div>
                                </div>

                                {renderDynamicFields()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Footer with Action Buttons */}
                {selectedType && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                    onClick={handleSubmit}
                                    disabled={!title.trim() || uploading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                                {uploading && (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                <span>{uploading ? 'Creating...' : 'Add Content'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}