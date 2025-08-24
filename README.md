# 🚀 Advanced Backend Project

A robust, scalable Node.js backend application built with Express.js and MongoDB, featuring comprehensive user management, video streaming capabilities, social interactions, and modern authentication systems.

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication** with access and refresh tokens
- **Secure Password Hashing** using bcrypt
- **Role-based Access Control** with middleware protection
- **Session Management** with refresh token rotation

### 👥 User Management
- **User Registration & Login** with email/username validation
- **Profile Management** with avatar and cover image support
- **Cloudinary Integration** for image storage and optimization
- **Watch History Tracking** for personalized user experience

### 🎥 Video Platform
- **Video Upload & Management** with thumbnail support
- **Category-based Organization** with tagging system
- **View Count Tracking** and analytics
- **Publishing Controls** (public/private videos)
- **Duration Calculation** and metadata management

### 💬 Social Features
- **Like/Dislike System** for videos and content
- **Comment System** with threaded discussions
- **Tweet-like Functionality** for short-form content
- **Playlist Creation** and management
- **Subscription System** for content creators

### 🛠️ Technical Features
- **RESTful API Design** with versioning (v1)
- **MongoDB Integration** with Mongoose ODM
- **File Upload Handling** with Multer middleware
- **CORS Configuration** for cross-origin requests
- **Error Handling** with custom API error responses
- **Async/Await Pattern** with error handling utilities
- **Pagination Support** for large datasets
- **Input Validation** and sanitization

## 🏗️ Architecture

```
src/
├── controllers/     # Business logic and request handling
├── models/         # MongoDB schemas and data models
├── routes/         # API endpoint definitions
├── middlewares/    # Custom middleware functions
├── utils/          # Utility functions and helpers
├── db/            # Database connection and configuration
├── app.js         # Express application setup
└── index.js       # Server entry point
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **Cloudinary Account** for image storage

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   ORIGIN=http://localhost:3000
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=your_database_name
   
   # JWT Configuration
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_EXPIRY=10d
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### User Registration
```http
POST /user/register
Content-Type: multipart/form-data

Body:
- username: string (required)
- fullName: string (required)
- email: string (required)
- password: string (required)
- avatar: file (required)
- coverImage: file (optional)
```

#### User Login
```http
POST /user/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Refresh Access Token
```http
POST /user/refresh-token
Content-Type: application/json

Body:
{
  "refreshToken": "your_refresh_token"
}
```

#### User Logout
```http
POST /user/logout
Authorization: Bearer <access_token>
```

### Video Endpoints

#### Upload Video
```http
POST /video
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Body:
- videoFile: file (required)
- thumbnail: file (required)
- title: string (required)
- description: string (required)
- category: string (required)
- tags: string[] (optional)
```

#### Get All Videos
```http
GET /video?page=1&limit=10&query=search_term&sortBy=createdAt&sortType=desc
```

#### Get Video by ID
```http
GET /video/:videoId
```

#### Update Video
```http
PATCH /video/:videoId
Authorization: Bearer <access_token>
```

#### Delete Video
```http
DELETE /video/:videoId
Authorization: Bearer <access_token>
```

### Social Interaction Endpoints

#### Like/Dislike Video
```http
POST /like/toggle/:videoId
POST /dislike/toggle/:videoId
Authorization: Bearer <access_token>
```

#### Add Comment
```http
POST /comment/:videoId
Authorization: Bearer <access_token>

Body:
{
  "content": "Great video!"
}
```

#### Get Comments
```http
GET /comment/:videoId?page=1&limit=10
```

### Playlist Endpoints

#### Create Playlist
```http
POST /playlist
Authorization: Bearer <access_token>

Body:
{
  "name": "My Favorites",
  "description": "Collection of favorite videos"
}
```

#### Add Video to Playlist
```http
POST /playlist/:playlistId/video/:videoId
Authorization: Bearer <access_token>
```

### Subscription Endpoints

#### Subscribe to Channel
```http
POST /subscription/:channelId
Authorization: Bearer <access_token>
```

#### Get Subscribed Channels
```http
GET /subscription/subscribed
Authorization: Bearer <access_token>
```

## 🗄️ Database Models

### User Model
- **username**: Unique username (indexed)
- **email**: Unique email address
- **fullName**: User's full name
- **avatar**: Cloudinary URL for profile picture
- **coverImage**: Optional cover image
- **watchHistory**: Array of video references
- **password**: Hashed password
- **refreshToken**: JWT refresh token

### Video Model
- **videoFile**: Cloudinary video URL
- **thumbnail**: Cloudinary thumbnail URL
- **title**: Video title
- **description**: Video description
- **duration**: Video duration in seconds
- **views**: View count
- **isPublished**: Publication status
- **owner**: User reference
- **category**: Video category
- **tags**: Array of tags
- **likes/dislikes**: User references

### Additional Models
- **Comment**: User comments on videos
- **Like/Dislike**: User reactions to content
- **Playlist**: User-created video collections
- **Subscription**: User channel subscriptions
- **Tweet**: Short-form content posts

## 🔧 Middleware

### Authentication Middleware
- **JWT Token Validation**
- **Role-based Access Control**
- **Request Rate Limiting**

### File Upload Middleware
- **Multer Configuration** for multipart/form-data
- **File Type Validation**
- **File Size Limits**
- **Cloudinary Integration**

### Utility Middleware
- **CORS Configuration**
- **Cookie Parser**
- **Request Body Parsing**
- **Static File Serving**

## 🚀 Development

### Available Scripts

```bash
# Start development server with nodemon
npm run dev

# Run tests (when implemented)
npm test

# Format code with Prettier
npx prettier --write .
```

### Code Quality

- **ES6+ Features** with ES modules
- **Async/Await Pattern** for clean asynchronous code
- **Error Handling** with custom error classes
- **Input Validation** and sanitization
- **Consistent Code Style** with Prettier

## 🔒 Security Features

- **Password Hashing** with bcrypt
- **JWT Token Security** with expiration
- **CORS Protection** for cross-origin requests
- **Input Validation** to prevent injection attacks
- **File Upload Security** with type and size validation
- **Environment Variable Protection**

## 📦 Dependencies

### Core Dependencies
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcrypt**: Password hashing
- **multer**: File upload handling
- **cloudinary**: Image/video cloud storage

### Development Dependencies
- **nodemon**: Development server with auto-reload
- **jest**: Testing framework
- **prettier**: Code formatting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Harsh Bhalwar**
- GitHub: [@harsh-bhalwar](https://github.com/harsh-bhalwar)

## 🙏 Acknowledgments

- **Express.js** team for the excellent web framework
- **MongoDB** for the robust database solution
- **Cloudinary** for cloud media management
- **JWT** for secure authentication

