require('dotenv').config(); // <-- THIS must come before using process.env
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// 👇 log the connection string for debugging
console.log("Connecting to MongoDB URI:", process.env.MONGO_URI);

// Use the encoded URI from the .env file
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});


// Database Models
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    school: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    studentClass: { type: String, required: true },
    age: { type: Number, required: true, min: 5, max: 25 }
});

const submissionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    score: { type: Number, default: null, min: 0, max: 100 }
});

const settingSchema = new mongoose.Schema({
    leaderboardVisible: { type: Boolean, default: false }
});

const Student = mongoose.model('Student', studentSchema);
const Submission = mongoose.model('Submission', submissionSchema);
const Setting = mongoose.model('Setting', settingSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'climate-champion-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer configuration for PDF uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

function requireAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}

// Routes

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Student registration
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', [
    body('name').trim().isLength({ min: 2 }).escape(),
    body('school').trim().isLength({ min: 2 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('studentClass').trim().isLength({ min: 1 }).escape(),
    body('age').isInt({ min: 5, max: 25 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, school, email, password, studentClass, age } = req.body;
        
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const student = new Student({
            name,
            school,
            email,
            passwordHash,
            studentClass,
            age: parseInt(age)
        });

        await student.save();
        res.redirect('/login');
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Student login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email });

        if (!student || !(await bcrypt.compare(password, student.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = student._id;
        req.session.userName = student.name;
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Student dashboard
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.session.userId);
        const setting = await Setting.findOne() || new Setting();
        
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } catch (error) {
        res.status(500).json({ error: 'Dashboard error' });
    }
});

// Get student submissions
app.get('/api/student/submissions', requireAuth, async (req, res) => {
    try {
        const submissions = await Submission.find({ studentId: req.session.userId })
            .sort({ uploadDate: -1 });
        
        res.json({
            submissions: submissions,
            totalFiles: submissions.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get submissions' });
    }
});

// File upload
app.post('/upload', requireAuth, upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const submission = new Submission({
            studentId: req.session.userId,
            fileName: req.file.filename,
            originalName: req.file.originalname
        });

        await submission.save();
        res.json({ success: true, message: 'File uploaded successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// View uploaded file
app.get('/view-file/:submissionId', requireAuth, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.submissionId);
        if (!submission || submission.studentId.toString() !== req.session.userId.toString()) {
            return res.status(404).json({ error: 'File not found' });
        }

        const filePath = path.join(__dirname, 'uploads', submission.fileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.download(filePath, submission.originalName);
    } catch (error) {
        res.status(500).json({ error: 'File access error' });
    }
});

// Leaderboard
app.get('/leaderboard', async (req, res) => {
    try {
        const setting = await Setting.findOne() || new Setting();
        if (!setting.leaderboardVisible) {
            return res.status(403).json({ error: 'Leaderboard is not visible' });
        }

        // Get all students with their total scores
        const students = await Student.find();
        const leaderboardData = [];

        for (const student of students) {
            const submissions = await Submission.find({ studentId: student._id });
            const totalScore = submissions.reduce((sum, submission) => {
                return sum + (submission.score || 0);
            }, 0);
            
            if (submissions.length > 0) {
                leaderboardData.push({
                    studentId: student,
                    totalScore: totalScore,
                    submissionCount: submissions.length
                });
            }
        }

        const sortedLeaderboard = leaderboardData.sort((a, b) => b.totalScore - a.totalScore);
        res.json(sortedLeaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Leaderboard error' });
    }
});

// Leaderboard page
app.get('/leaderboard-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

// Admin login
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@climate' && password === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.status(401).json({ error: 'Invalid admin credentials' });
    }
});

// Admin dashboard
app.get('/admin/dashboard', requireAdmin, async (req, res) => {
    try {
        const students = await Student.find().select('-passwordHash');
        const setting = await Setting.findOne() || new Setting();
        
        res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
    } catch (error) {
        res.status(500).json({ error: 'Admin dashboard error' });
    }
});

// Get all students for admin
app.get('/admin/students', requireAdmin, async (req, res) => {
    try {
        const students = await Student.find().select('-passwordHash');
        const studentsWithSubmissions = [];

        for (const student of students) {
            const submissions = await Submission.find({ studentId: student._id })
                .sort({ uploadDate: -1 });
            
            const totalScore = submissions.reduce((sum, submission) => {
                return sum + (submission.score || 0);
            }, 0);

            studentsWithSubmissions.push({
                ...student.toObject(),
                submissions: submissions,
                totalScore: totalScore,
                submissionCount: submissions.length
            });
        }
        
        res.json(studentsWithSubmissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Assign score to submission
app.post('/admin/assign-score', requireAdmin, async (req, res) => {
    try {
        const { submissionId, score } = req.body;
        
        if (score < 0 || score > 100) {
            return res.status(400).json({ error: 'Score must be between 0 and 100' });
        }

        await Submission.findByIdAndUpdate(submissionId, { score });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to assign score' });
    }
});

// Get leaderboard visibility status
app.get('/admin/leaderboard-status', requireAdmin, async (req, res) => {
    try {
        const setting = await Setting.findOne() || new Setting();
        res.json({ leaderboardVisible: setting.leaderboardVisible });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get leaderboard status' });
    }
});

// Toggle leaderboard visibility
app.post('/admin/toggle-leaderboard', requireAdmin, async (req, res) => {
    try {
        let setting = await Setting.findOne();
        if (!setting) {
            setting = new Setting();
        }
        
        setting.leaderboardVisible = !setting.leaderboardVisible;
        await setting.save();
        
        res.json({ leaderboardVisible: setting.leaderboardVisible });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle leaderboard' });
    }
});

// Download student file
app.get('/admin/download/:submissionId', requireAdmin, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.submissionId);
        if (!submission) {
            return res.status(404).json({ error: 'File not found' });
        }

        const filePath = path.join(__dirname, 'uploads', submission.fileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.download(filePath, submission.originalName);
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Climate Champion Programme server running on port ${PORT}`);
}); 