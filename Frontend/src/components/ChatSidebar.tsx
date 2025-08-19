import { useEffect, useRef, useState } from "react"
import axios from "axios"
import { BACKEND_URL } from "../config"

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  type: 'user' | 'system' | 'ai';
  references?: any[]; // Track references used for AI messages
}

interface ChatSidebarProps {
  className?: string;
}

type ChatMode = 'users' | 'ai';

export function ChatSidebar({ className = "" }: ChatSidebarProps) {
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const roomIdRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentRoom, setCurrentRoom] = useState<string>("")
  const [isInRoom, setIsInRoom] = useState(false)
  const [createdRoomHash, setCreatedRoomHash] = useState<string>("")
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [clientId] = useState(() => Math.random().toString(36).substring(2, 15))
  const [chatMode, setChatMode] = useState<ChatMode>('users')
  const [aiLoading, setAiLoading] = useState(false)
  const [showReferenceModal, setShowReferenceModal] = useState(false)
  const [selectedReferences, setSelectedReferences] = useState<any[]>([])
  const [userNotes, setUserNotes] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addSystemMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isOwn: false,
      type: 'system'
    }
    setMessages(m => [...m, newMessage])
  }

  const addUserMessage = (text: string, isOwn: boolean) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isOwn,
      type: 'user'
    }
    setMessages(m => [...m, newMessage])
  }

  const addAIMessage = (text: string, usedReferences?: any[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isOwn: false,
      type: 'ai',
      references: usedReferences
    }
    setMessages(m => [...m, newMessage])
  }

  function createRoom() {
    if (!socket) return
    
    const obj = {
      "type": "create",
    }
    socket.send(JSON.stringify(obj))
  }

  function joinRoom() {
    if (!socket || !roomIdRef.current?.value) return
    
    const roomId = roomIdRef.current.value
    const obj = {
      "type": "join",
      "payload": {
        "room": roomId
      }
    }
    socket.send(JSON.stringify(obj))
    setCurrentRoom(roomId)
    setIsInRoom(true)
  }

  function sendMessage() {
    if (!messageRef.current?.value) return
    
    const message = messageRef.current.value

    if (chatMode === 'ai') {
      // AI Chat Mode
      addUserMessage(message, true)
      messageRef.current.value = ""
      sendAIMessage(message)
    } else {
      // User Chat Mode
      if (!socket || !isInRoom) return
      
      const obj = {
        "type": "chat",
        "payload": {
          "message": message,
          "clientId": clientId
        }
      }
      
      socket.send(JSON.stringify(obj))
      messageRef.current.value = ""
    }
  }

  async function sendAIMessage(message: string) {
    setAiLoading(true)
    try {
      // Prepare context from selected references
      let contextMessage = message;
      let referencesContext = "";
      const currentReferences = [...selectedReferences]; // Store current references
      
      if (selectedReferences.length > 0) {
        referencesContext = selectedReferences.map(ref => 
          `Title: ${ref.title}\nType: ${ref.type}\nContent: ${ref.link || ref.description || 'No content'}\n`
        ).join('\n');        
      }

      const response = await axios.post(`${BACKEND_URL}/api/v1/ai-chat`, {
        message: contextMessage,
        reference : referencesContext
      }, {
        headers: {
          token: localStorage.getItem("token") || ""
        }
      })
      
      // Clear references after sending the message
      if (selectedReferences.length > 0) {
        setSelectedReferences([])
      }
      
      if (response.data.reply) {
        addAIMessage(response.data.reply, currentReferences.length > 0 ? currentReferences : undefined)
      } else {
        addAIMessage("Sorry, I couldn't process your request. Please try again.")
      }
    } catch (error) {
      console.error("AI Chat error:", error)
      addAIMessage("Sorry, I'm having trouble connecting. Please try again later.")
      
      // Clear references even if there's an error
      if (selectedReferences.length > 0) {
        setSelectedReferences([])
      }
    } finally {
      setAiLoading(false)
    }
  }

  async function fetchUserNotes() {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/content`, {
        headers: {
          token: localStorage.getItem("token") || ""
        }
      });
      setUserNotes(response.data.contents || []);
    } catch (error) {
      console.error("Error fetching user notes:", error);
    }
  }

  const filteredNotes = userNotes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some((tag: any) => tag.title.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  function leaveRoom() {
    setIsInRoom(false)
    setCurrentRoom("")
    setCreatedRoomHash("")
    setMessages([])
  }

  function connectToChat() {
    if (socket) return
    
    setIsConnecting(true)
    setConnectionStatus('connecting')
    
    const ws = new WebSocket("ws://localhost:9000")
    setSocket(ws)
    
    ws.onopen = () => {
      setConnectionStatus('connected')
      setIsConnecting(false)
      addSystemMessage("Connected to chat server!")
    }
    
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === "room_created") {
          setCreatedRoomHash(data.hash)
          addSystemMessage(`🎉 Room created! Hash: ${data.hash}`)
        } else if (data.type === "joined") {
          addSystemMessage(`✅ Successfully joined room: ${currentRoom}`)
        } else if (data.type === "chat") {
          const message = data.payload?.message || e.data
          const messageClientId = data.payload?.clientId
          const isOwnMessage = messageClientId === clientId
          
          addUserMessage(message, isOwnMessage)
        } else {
          addSystemMessage(e.data)
        }
      } catch {
        addSystemMessage(e.data)
      }
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
      setSocket(null)
      addSystemMessage("❌ Disconnected from chat server")
    }

    ws.onerror = () => {
      setConnectionStatus('disconnected')
      setIsConnecting(false)
      addSystemMessage("❌ Failed to connect to chat server")
    }
  }

  function disconnectFromChat() {
    if (socket) {
      socket.close()
      setSocket(null)
      setConnectionStatus('disconnected')
      setIsInRoom(false)
      setCurrentRoom("")
      setCreatedRoomHash("")
      setMessages([])
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Second Brain Chat</h3>
            <p className="text-xs text-gray-500">
              {chatMode === 'ai' ? (
                <span className="text-purple-600">● AI Assistant</span>
              ) : connectionStatus === 'connected' ? (
                <span className="text-green-600">● Connected</span>
              ) : connectionStatus === 'connecting' ? (
                <span className="text-yellow-600">● Connecting...</span>
              ) : (
                <span className="text-red-600">● Disconnected</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className={`w-4 h-4 text-gray-600 transition-transform ${isMinimized ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Mode Switcher */}
      {!isMinimized && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex bg-white rounded-lg p-1 space-x-1">
            <button
              onClick={() => {
                setChatMode('users')
                setMessages([])
              }}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                chatMode === 'users'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Chat With Users</span>
              </div>
            </button>
            <button
              onClick={() => {
                setChatMode('ai')
                setMessages([])
                // Add welcome message after a short delay to ensure messages are cleared
                setTimeout(() => {
                  addAIMessage("Hello! I'm your AI assistant for your Second Brain. I can help you search, organize, and make connections between your saved content. What would you like to explore today?")
                }, 100)
              }}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                chatMode === 'ai'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Chat With AI</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {!isMinimized && (
        <>
          {/* Connection Section - Only for Users Mode */}
          {chatMode === 'users' && connectionStatus === 'disconnected' && (
            <div className="p-4 border-b border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Connect to Chat</h4>
                <p className="text-xs text-gray-600 mb-3">Start chatting with others</p>
                <button
                  onClick={connectToChat}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          )}

          {/* Room Management - Only for Users Mode */}
          {chatMode === 'users' && connectionStatus === 'connected' && !isInRoom && (
            <div className="p-4 space-y-4 border-b border-gray-200">
              {/* Create Room */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Room
                </h4>
                <button
                  onClick={createRoom}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
                {createdRoomHash && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-xs text-gray-600 mb-1">Room hash:</p>
                    <div className="flex items-center space-x-1">
                      <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono truncate">
                        {createdRoomHash}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(createdRoomHash)}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-xs"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Join Room */}
              <div className="bg-green-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Join Room
                </h4>
                <div className="flex space-x-1">
                  <input
                    ref={roomIdRef}
                    type="text"
                    placeholder="Room hash"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={joinRoom}
                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface - Only for Users Mode */}
          {chatMode === 'users' && connectionStatus === 'connected' && isInRoom && (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Room: {currentRoom}</h4>
                    <p className="text-xs text-gray-600">Ready to chat</p>
                  </div>
                  <button
                    onClick={leaveRoom}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs"
                  >
                    Leave
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto min-h-0 bg-gray-50" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%23f3f4f6' fill-opacity='0.4'%3e%3cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`
          }}>
            <div className="space-y-3">
              {messages.filter(message => {
                if (chatMode === 'ai') {
                  return message.type === 'user' || message.type === 'ai'
                } else {
                  return message.type === 'user'
                }
              }).length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs">
                    {chatMode === 'ai' ? 'Start a conversation with AI' : 'No messages yet'}
                  </p>
                </div>
              ) : (
                messages
                  .filter(message => {
                    if (chatMode === 'ai') {
                      return message.type === 'user' || message.type === 'ai'
                    } else {
                      return message.type === 'user'
                    }
                  })
                  .map((message) => {
                    const isAIMessage = message.type === 'ai'
                    return (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative break-words word-break ${
                            message.isOwn
                              ? 'bg-blue-500 text-white rounded-br-md'
                              : isAIMessage
                              ? 'bg-purple-100 text-purple-900 rounded-bl-md border border-purple-200'
                              : 'bg-gray-200 text-gray-800 rounded-bl-md'
                          }`}
                          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                        >
                          {isAIMessage && (
                            <div className="flex items-center space-x-1 mb-1">
                              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              <span className="text-xs font-medium text-purple-700">AI Assistant</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.text}
                          </p>
                          {/* Reference indicator for AI messages */}
                          {isAIMessage && message.references && message.references.length > 0 && (
                            <div className="mt-2 pt-1 border-t border-purple-200">
                              <div className="flex items-center space-x-1">
                                <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs text-purple-600 font-medium">
                                  Used {message.references.length} reference{message.references.length !== 1 ? 's' : ''}:
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {message.references.slice(0, 3).map((ref, index) => (
                                  <span key={index} className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                                    {ref.title}
                                  </span>
                                ))}
                                {message.references.length > 3 && (
                                  <span className="text-xs text-purple-600">
                                    +{message.references.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className={`text-xs ${
                              message.isOwn 
                                ? 'text-blue-100' 
                                : isAIMessage 
                                ? 'text-purple-600' 
                                : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.isOwn && (
                              <svg 
                                className="w-3 h-3 text-blue-100" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path 
                                  fillRule="evenodd" 
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                  clipRule="evenodd" 
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
              )}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-2xl bg-purple-100 text-purple-900 rounded-bl-md border border-purple-200">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                      <span className="text-xs text-purple-700">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          {((chatMode === 'users' && connectionStatus === 'connected' && isInRoom) || chatMode === 'ai') && (
            <>
              {/* Reference Modal for AI Chat */}
              {chatMode === 'ai' && showReferenceModal && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg max-w-md w-full max-h-96 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Add References</h3>
                        <button
                          onClick={() => setShowReferenceModal(false)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Search your notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4">
                      {filteredNotes.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {searchQuery ? 'No notes found matching your search.' : 'No notes available.'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {filteredNotes.map((note: any) => (
                            <div
                              key={note._id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedReferences.some(ref => ref._id === note._id)
                                  ? 'bg-purple-50 border-purple-200'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                              onClick={() => {
                                const isSelected = selectedReferences.some(ref => ref._id === note._id);
                                if (isSelected) {
                                  setSelectedReferences(selectedReferences.filter(ref => ref._id !== note._id));
                                } else {
                                  setSelectedReferences([...selectedReferences, note]);
                                }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">{note.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{note.type}</p>
                                  {note.tags && note.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {note.tags.slice(0, 2).map((tag: any, index: number) => (
                                        <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                          {tag.title}
                                        </span>
                                      ))}
                                      {note.tags.length > 2 && (
                                        <span className="text-xs text-gray-500">+{note.tags.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {selectedReferences.some(ref => ref._id === note._id) && (
                                  <svg className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {selectedReferences.length} reference{selectedReferences.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={() => setShowReferenceModal(false)}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected References Display for AI Chat */}
              {chatMode === 'ai' && selectedReferences.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-purple-700">
                      References ({selectedReferences.length})
                    </span>
                    <button
                      onClick={() => setSelectedReferences([])}
                      className="text-xs text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedReferences.map((ref) => (
                      <div
                        key={ref._id}
                        className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
                      >
                        <span className="truncate max-w-20">{ref.title}</span>
                        <button
                          onClick={() => setSelectedReferences(selectedReferences.filter(r => r._id !== ref._id))}
                          className="ml-1 hover:text-purple-900 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 border-t border-gray-200 bg-white">
                <div className="flex space-x-2">
                  {/* Add Reference Button for AI Chat */}
                  {chatMode === 'ai' && (
                    <button
                      onClick={() => {
                        setShowReferenceModal(true);
                        fetchUserNotes();
                      }}
                      className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors flex items-center justify-center self-end"
                      title="Add references from your notes"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  )}
                  
                  <textarea
                    ref={messageRef}
                    placeholder={chatMode === 'ai' ? "Ask me anything... (Shift+Enter for new line)" : "Type a message... (Shift+Enter for new line)"}
                    rows={1}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={aiLoading}
                    className={`w-10 h-10 ${chatMode === 'ai' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-full transition-colors flex items-center justify-center self-end disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {aiLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          {(chatMode === 'users' && connectionStatus === 'connected') || chatMode === 'ai' ? (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {chatMode === 'ai' ? 'AI Assistant' : 'Chat Server'}
                </p>
                {chatMode === 'users' && (
                  <button
                    onClick={disconnectFromChat}
                    className="text-xs text-red-600 hover:text-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
