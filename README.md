# 🧠 Second Brain

A comprehensive personal knowledge management system that allows you to store, organize, and search through your digital content including tweets, documents, images, videos, and voice notes.

## 📋 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)

## ✨ Features

- **Multi-format Content Storage**: Store tweets, documents, images, videos, and audio files
- **Voice-to-Text**: Convert voice notes to text using AI
- **AI-powered Search**: Intelligent search through your content using embeddings
- **Real-time Chat**: WebSocket-based chat functionality
- **User Authentication**: Secure user management with JWT
- **File Uploads**: Cloud storage integration with Cloudinary
- **Responsive UI**: Modern React-based interface
- **Tag-based Organization**: Organize content with custom tags
- **Content Sharing**: Share your content with other users

## 🏗️ Project Structure

```
Second Brain/
├── 📁 ai_service/                    # Django AI Service (Python)
│   ├── ai/                          # AI models and processing
│   ├── ai_service/                  # Django settings and config
│   ├── sarvam_config.py            # AI service configuration
│   ├── requirements.txt            # Python dependencies
│   └── manage.py                   # Django management script
├── 📁 Backend/                       # Node.js API Server (TypeScript)
│   ├── src/
│   │   ├── db/                     # Database connection
│   │   ├── middlewares/            # Authentication & file upload middleware
│   │   ├── model/                  # Database models
│   │   │   ├── Content.model.ts    # Content data model
│   │   │   ├── User.model.ts       # User data model
│   │   │   ├── Tag.model.ts        # Tag data model
│   │   │   └── Share.model.ts      # Content sharing model
│   │   ├── utils/                  # Utility functions
│   │   └── index.ts               # Main server entry point
│   ├── package.json               # Node.js dependencies
│   └── tsconfig.json              # TypeScript configuration
├── 📁 Frontend/                     # React Client Application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/                # Base UI components
│   │   │   ├── Sidebar.tsx        # Main navigation sidebar
│   │   │   ├── Topbar.tsx         # Top navigation bar
│   │   │   ├── Card.tsx           # Content card component
│   │   │   ├── VoiceRecorder.tsx  # Voice recording component
│   │   │   └── CreateContentModal.tsx # Content creation modal
│   │   ├── pages/                 # Application pages
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── Brain.tsx          # Personal knowledge view
│   │   │   ├── Signin.tsx         # User authentication
│   │   │   └── Profile.tsx        # User profile management
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── icons/                 # SVG icon components
│   │   └── config.tsx             # Application configuration
│   ├── package.json               # Frontend dependencies
│   └── vite.config.ts             # Vite build configuration
├── 📁 Chat/                         # WebSocket Chat Server
│   └── webSocketServer.py          # Python WebSocket server
└── 📄 start.bat                     # Windows startup script
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **CSS3** - Styling and responsive design

### Backend API
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe backend development
- **MongoDB** - NoSQL database
- **JWT** - Authentication tokens
- **Cloudinary** - File storage and optimization

### AI Service
- **Django** - Python web framework
- **Python** - AI processing and machine learning
- **Sarvam AI** - Voice-to-text and AI processing

### Real-time Features
- **WebSockets** - Real-time communication
- **Python WebSocket Server** - Chat functionality

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local installation or cloud instance)
- **Git** - Version control
- **npm** or **yarn** - Package management

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd "Second Brain"
```

### 2. Backend Setup
```bash
cd Backend
npm install
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
```

### 4. AI Service Setup
```bash
cd ../ai_service
pip install -r requirements.txt
python manage.py migrate
```

### 5. Chat Server Setup
```bash
cd ../Chat
pip install websockets
```

## 🔧 Environment Variables

Create `.env` files in the respective directories:

### Backend/.env
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/second-brain
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### ai_service/.env
```env
DEBUG=True
SECRET_KEY=your-django-secret-key
DATABASE_URL=sqlite:///db.sqlite3
```

### Frontend/.env
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:8080
```

## ▶️ Running the Application

### Development Mode

1. **Start the Backend API:**
   ```bash
   cd Backend
   npm run dev
   ```
   Server will run on `http://localhost:3001`

2. **Start the Frontend:**
   ```bash
   cd Frontend
   npm run dev
   ```
   Application will be available at `http://localhost:5173`

3. **Start the AI Service:**
   ```bash
   cd ai_service
   python manage.py runserver
   ```
   Django server will run on `http://localhost:8000`

4. **Start the Chat Server:**
   ```bash
   cd Chat
   python webSocketServer.py
   ```
   WebSocket server will run on port `8080`

### Production Mode

Use the provided startup script:
```bash
./start.bat  # Windows
# or manually start each service in production mode
```

## 📚 API Documentation

The API provides the following endpoints:

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/google` - Google OAuth

### Content Management
- `GET /api/content` - Get user's content
- `POST /api/content` - Create new content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

### File Uploads
- `POST /api/upload` - Upload files to Cloudinary

### Voice Processing
- `POST /api/voice/process` - Process voice notes

### Search
- `GET /api/search` - Search through content with AI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the individual README files in each service directory
2. Look at the console logs for error messages
3. Ensure all environment variables are properly configured
4. Verify that all prerequisites are installed

---

**Happy Learning!** 📚