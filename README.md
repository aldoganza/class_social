# 🎓 Classmates Social

A modern, full-featured social networking platform designed for students to connect, collaborate, and share with their classmates.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 📱 Core Social Features
- **User Profiles** - Customizable profiles with photos and bio
- **Posts & Feed** - Share text, images, and videos
- **Likes & Comments** - Engage with content
- **Follow System** - Connect with classmates
- **Real-time Notifications** - Stay updated on interactions

### 💬 Communication
- **Direct Messaging** - Private conversations
- **Group Chats** - Create study groups and class discussions
- **Admin Controls** - Manage group members and permissions
- **File Sharing** - Share notes and resources

### 🎥 Media Features
- **Stories** - 24-hour disappearing content
- **Reels** - Short-form video content
- **Image & Video Posts** - Full media support
- **Click-to-play Videos** - Instagram-like video experience

### 👥 Groups & Collaboration
- **Create Groups** - For classes, projects, or study sessions
- **Role-Based Access** - Admin and member roles
- **Member Management** - Add, remove, and promote members
- **Group Messaging** - Dedicated chat for each group

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/class_social.git
   cd class_social
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd client
   npm install
   cp .env.example .env
   # Edit .env if needed
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

## 📁 Project Structure

```
class_social/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── lib/           # Utilities and API client
│   │   └── styles/        # CSS files
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── lib/           # Database and utilities
│   ├── sql/               # Database migrations
│   └── package.json
│
└── docs/                  # Documentation
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Vite** - Build tool
- **CSS3** - Styling with custom properties

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts` - Get feed posts
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment

### Messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages` - Send message

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group
- `POST /api/groups/:id/members` - Add member (admin)
- `PUT /api/groups/:id/members/:userId/role` - Change role (admin)
- `POST /api/groups/:id/messages` - Send group message

[Full API Documentation](./API_DOCUMENTATION.md)

## 🚢 Deployment

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

**Recommended Stack:**
- **Frontend**: Vercel (free, auto-deploy)
- **Backend**: Railway (free tier available)
- **Database**: PlanetScale (free tier)

**One-Click Deploy:**
- Deploy to Railway: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)
- Deploy to Vercel: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ SQL injection protection (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ Secure file upload handling

## 🎨 UI/UX Features

- 📱 Fully responsive design
- 🌙 Dark mode optimized
- ⚡ Fast and smooth animations
- 🎯 Instagram-inspired interface
- ♿ Accessible components
- 🖼️ Optimized image loading

## 📖 Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Groups Feature Documentation](./GROUPS_FEATURE.md)
- [Testing Guide](./TESTING_GROUPS.md)
- [Quick Start Guide](./GROUPS_QUICK_START.md)

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Manual Testing Checklist
See [TESTING_GROUPS.md](./TESTING_GROUPS.md) for comprehensive testing guide.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Inspired by Instagram, Facebook, and modern social platforms
- Built for students, by students
- Special thanks to all contributors

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/class_social/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/class_social/discussions)
- **Email**: support@your-domain.com

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Voice/Video calls
- [ ] Events and calendar
- [ ] Polls and surveys
- [ ] Advanced search
- [ ] Mobile app (React Native)

### Version 1.2 (Future)
- [ ] AI-powered content moderation
- [ ] Study group matching
- [ ] Academic resources sharing
- [ ] Integration with learning platforms

## 📊 Stats

- **Total Lines of Code**: ~10,000+
- **Components**: 25+
- **API Endpoints**: 50+
- **Database Tables**: 12
- **Features**: 20+

---

**Made with ❤️ for students everywhere**

⭐ Star this repo if you find it helpful!
