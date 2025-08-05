# Climate Champion Programme 2025

A minimalist full-stack web application for the Climate Champion Programme 2025, organized by Anant School for Climate Action. This application provides a simple registration and submission portal with scoring and leaderboard functionality.

## Features

### Student Features
- **Registration**: Students can register with name, school, email, class, age, and password
- **Login**: Secure authentication for registered students
- **Multiple File Upload**: Upload multiple PDF submissions (max 5MB each)
- **File Viewing**: View all uploaded submissions with individual scores
- **Leaderboard Access**: View rankings based on total scores when enabled by admin

### Admin Features
- **Admin Login**: Hardcoded credentials (admin@climate / admin123)
- **Student Management**: View all registered students and their data
- **Multiple File Downloads**: Download individual student PDF submissions
- **Individual Scoring System**: Assign scores (0-100) to each submission
- **Total Score Calculation**: Automatic calculation of total scores from all submissions
- **Leaderboard Control**: Toggle leaderboard visibility on/off
- **Real-time Updates**: Live score updates and leaderboard management

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **File Storage**: Local file system (`/uploads` folder)
- **Authentication**: bcrypt for password hashing, express-session for sessions
- **File Upload**: Multer for PDF file handling
- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **Validation**: express-validator for input sanitization

## Database Schema

### Collections:
- **students**: `{ _id, name, school, email, passwordHash, studentClass, age }`
- **submissions**: `{ _id, studentId, fileName, originalName, uploadDate, score }`
- **settings**: `{ leaderboardVisible: Boolean }`

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or accessible)

### Installation Steps

1. **Clone/Download the project**
   ```bash
   # Navigate to your project directory
   cd climate-trial-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update the connection string in server.js
   ```

4. **Start the application**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - The application will be available on port 3000

## Usage Guide

### For Students

1. **Registration**
   - Visit the homepage
   - Click "Student Registration"
   - Fill in your details (name, school, email, class, age, password)
   - Submit the form

2. **Login**
   - Use your registered email and password
   - Access your personal dashboard

3. **File Upload**
   - In your dashboard, select a PDF file (max 5MB)
   - Click "Upload File"
   - Upload multiple files as needed
   - View all your uploaded files with individual scores

4. **Leaderboard**
   - Check the leaderboard section in your dashboard
   - View rankings when enabled by admin

### For Administrators

1. **Admin Login**
   - Click "Admin Access" on the homepage
   - Use credentials: `admin@climate` / `admin123`

2. **Student Management**
   - View all registered students in a table
   - See submission count and total scores for each student
   - Click "View Files" to see individual submissions
   - Download individual student PDF submissions

3. **Scoring**
   - Click "View Files" for any student to see their submissions
   - Assign scores (0-100) to each individual submission
   - Total scores are calculated automatically from all submissions
   - Scores update automatically in real-time

4. **Leaderboard Control**
   - Toggle the leaderboard visibility switch
   - Control whether students can see rankings

## Security Features

- **Input Sanitization**: All user inputs are sanitized to prevent injection attacks
- **Password Hashing**: Student passwords are hashed using bcrypt
- **File Validation**: Only PDF files up to 5MB are accepted
- **Session Management**: Secure session handling for authentication
- **Access Control**: Separate authentication for students and admins

## File Structure

```
climate-trial-2/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── README.md             # This file
├── public/               # Static HTML files
│   ├── index.html        # Homepage
│   ├── register.html     # Student registration
│   ├── login.html        # Student login
│   ├── dashboard.html    # Student dashboard
│   ├── admin-login.html  # Admin login
│   └── admin-dashboard.html # Admin dashboard
└── uploads/              # PDF file storage (created automatically)
```

## API Endpoints

### Student Routes
- `GET /` - Homepage
- `GET /register` - Registration page
- `POST /register` - Student registration
- `GET /login` - Login page
- `POST /login` - Student login
- `GET /dashboard` - Student dashboard
- `POST /upload` - File upload
- `GET /api/student/submissions` - Get student's submissions
- `GET /view-file/:submissionId` - Download specific submission
- `GET /leaderboard` - View leaderboard (if public)

### Admin Routes
- `GET /admin/login` - Admin login page
- `POST /admin/login` - Admin authentication
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/students` - Get all students data
- `POST /admin/assign-score` - Assign score to submission
- `GET /admin/leaderboard-status` - Get leaderboard visibility status
- `POST /admin/toggle-leaderboard` - Toggle leaderboard visibility
- `GET /admin/download/:submissionId` - Download specific submission

## Configuration

### MongoDB Connection
Update the MongoDB connection string in `server.js`:
```javascript
mongoose.connect('mongodb://localhost:27017/climate_champion', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
```

### Admin Credentials
Change the hardcoded admin credentials in `server.js`:
```javascript
if (email === 'admin@climate' && password === 'admin123') {
    // Change these credentials for production
}
```

### File Upload Limits
Modify file size limits in `server.js`:
```javascript
limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
}
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in server.js
   - Verify MongoDB port (default: 27017)

2. **File Upload Issues**
   - Check uploads folder permissions
   - Verify file size (max 5MB)
   - Ensure file is PDF format

3. **Port Already in Use**
   - Change PORT in server.js
   - Kill existing process on port 3000

4. **Session Issues**
   - Clear browser cookies
   - Restart the server

## Development

### Adding New Features
- All backend logic is in `server.js`
- Frontend files are in `public/` directory
- Database models are defined in `server.js`

### Testing
- Test student registration and login
- Test file upload functionality
- Test admin features with provided credentials
- Verify leaderboard toggle functionality

## Production Deployment

1. **Environment Variables**
   - Set `PORT` environment variable
   - Configure MongoDB connection string
   - Update session secret

2. **Security**
   - Change admin credentials
   - Use HTTPS in production
   - Configure proper CORS settings

3. **File Storage**
   - Consider cloud storage for PDFs
   - Implement file cleanup procedures

## License

This project is created for the Climate Champion Programme 2025 by Anant School for Climate Action.

---

**Note**: This is a minimalist application designed for simplicity and ease of maintenance. For production use, consider adding additional security measures, error logging, and backup procedures. 