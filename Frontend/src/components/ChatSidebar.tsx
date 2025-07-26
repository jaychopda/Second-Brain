import { useEffect, useRef, useState } from "react"

interface ChatSidebarProps {
  className?: string;
}

export function ChatSidebar({ className = "" }: ChatSidebarProps) {
  const messageRef = useRef<HTMLInputElement>(null)
  const roomIdRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<string[]>([])
  const [currentRoom, setCurrentRoom] = useState<string>("")
  const [isInRoom, setIsInRoom] = useState(false)
  const [createdRoomHash, setCreatedRoomHash] = useState<string>("")
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    if (!socket || !messageRef.current?.value || !isInRoom) return
    
    const message = messageRef.current.value
    const obj = {
      "type": "chat",
      "payload": {
        "message": message
      }
    }
    socket.send(JSON.stringify(obj))
    messageRef.current.value = ""
  }

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
      setMessages(m => [...m, "Connected to chat server!"])
    }
    
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === "room_created") {
          setCreatedRoomHash(data.hash)
          setMessages(m => [...m, `🎉 Room created! Hash: ${data.hash}`])
        } else if (data.type === "joined") {
          setMessages(m => [...m, `✅ Successfully joined room: ${currentRoom}`])
        } else if (data.type === "chat") {
          setMessages(m => [...m, `💬 ${data.payload?.message || e.data}`])
        } else {
          setMessages(m => [...m, e.data])
        }
      } catch {
        setMessages(m => [...m, e.data])
      }
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
      setSocket(null)
      setMessages(m => [...m, "❌ Disconnected from chat server"])
    }

    ws.onerror = () => {
      setConnectionStatus('disconnected')
      setIsConnecting(false)
      setMessages(m => [...m, "❌ Failed to connect to chat server"])
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
              {connectionStatus === 'connected' ? (
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

      {!isMinimized && (
        <>
          {/* Connection Section */}
          {connectionStatus === 'disconnected' && (
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

          {/* Room Management */}
          {connectionStatus === 'connected' && !isInRoom && (
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

          {/* Chat Interface */}
          {connectionStatus === 'connected' && isInRoom && (
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
          <div className="flex-1 p-3 overflow-y-auto min-h-0">
            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs">No messages yet</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-xs ${
                      message.startsWith('🎉') || message.startsWith('✅') || message.startsWith('❌')
                        ? 'bg-gray-100 text-gray-800 text-center'
                        : message.startsWith('💬')
                        ? 'bg-blue-100 text-blue-900 ml-4'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p>{message}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          {connectionStatus === 'connected' && isInRoom && (
            <div className="p-3 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  ref={messageRef}
                  type="text"
                  placeholder="Type message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          {connectionStatus === 'connected' && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Chat Server
                </p>
                <button
                  onClick={disconnectFromChat}
                  className="text-xs text-red-600 hover:text-red-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
