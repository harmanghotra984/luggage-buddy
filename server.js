require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads directory exists
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/luggageshare', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/user');
const Ad = require('./models/ad');
const Message = require('./models/message');
const Rating = require('./models/rating');

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

// Routes

// User signup
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password, phone, aadhaar, termsAccepted } = req.body;

        if (!termsAccepted) {
            return res.status(400).json({ error: 'You must accept the terms and conditions.' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { aadhaar }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Email or Aadhaar number already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            aadhaar,
            termsAccepted
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '7d' }
        );

        res.status(201).json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            { expiresIn: '7d' }
        );

        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile (name and/or profile image)
app.patch('/api/profile', auth, upload.single('profileImage'), async (req, res) => {
    try {
        const updates = {};
        if (req.body.name) updates.name = req.body.name;
        if (req.file) updates.profileImage = `/uploads/${req.file.filename}`;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Upload image
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        res.json({ url: `/uploads/${req.file.filename}` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Create ad
app.post('/api/ads', auth, async (req, res) => {
    try {
        const {
            type,
            flightNumber,
            flightDetails,
            availableSpace,
            requiredSpace,
            pricePerKg,
            maxBudget,
            flightDate,
            additionalInfo,
            imageUrl
        } = req.body;

        const ad = new Ad({
            type,
            userId: req.user._id,
            flightNumber,
            flightDetails,
            availableSpace: type === 'have-space' ? availableSpace : undefined,
            requiredSpace: type === 'need-space' ? requiredSpace : undefined,
            pricePerKg: type === 'have-space' ? pricePerKg : undefined,
            maxBudget: type === 'need-space' ? maxBudget : undefined,
            flightDate,
            additionalInfo,
            imageUrl: type === 'need-space' ? imageUrl : undefined
        });

        await ad.save();
        res.status(201).json(ad);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user's ads
app.get('/api/ads/my', auth, async (req, res) => {
    try {
        const ads = await Ad.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(ads);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all ads
app.get('/api/ads', async (req, res) => {
    try {
        const { type, status } = req.query;
        const query = {};

        if (type) query.type = type;
        if (status) query.status = status;

        const ads = await Ad.find(query)
            .sort({ createdAt: -1 });
        res.json(ads);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get single ad
app.get('/api/ads/:id', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found.' });
        }
        res.json(ad);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update ad
app.patch('/api/ads/:id', auth, async (req, res) => {
    try {
        const ad = await Ad.findOne({ _id: req.params.id, userId: req.user._id });
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found.' });
        }

        const updates = Object.keys(req.body);
        const allowedUpdates = [
            'flightNumber',
            'flightDetails',
            'availableSpace',
            'requiredSpace',
            'pricePerKg',
            'maxBudget',
            'flightDate',
            'additionalInfo',
            'imageUrl',
            'status'
        ];

        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) {
            return res.status(400).json({ error: 'Invalid updates.' });
        }

        updates.forEach(update => ad[update] = req.body[update]);
        await ad.save();
        res.json(ad);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete ad
app.delete('/api/ads/:id', auth, async (req, res) => {
    try {
        const ad = await Ad.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!ad) {
            return res.status(404).json({ error: 'Ad not found.' });
        }
        res.json({ message: 'Ad deleted successfully.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get contact info for a user by ID
app.get('/api/user/:userId/contact', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('name email phone');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Send a message (request)
app.post('/api/messages', auth, async (req, res) => {
    try {
        const { receiverId, adId, content, type, agreementText } = req.body;
        if (!receiverId || !adId || (!content && type !== 'agreement')) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        const message = new Message({
            senderId: req.user._id,
            receiverId,
            referenceId: adId,
            referenceType: 'Ad',
            content,
            messageType: type || 'chat',
            agreementText: type === 'agreement' ? agreementText : undefined
        });
        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update agreement status (accept/decline)
app.patch('/api/messages/:id/agreement', auth, async (req, res) => {
    try {
        const { agreementStatus } = req.body;
        if (!['accepted', 'declined'].includes(agreementStatus)) {
            return res.status(400).json({ error: 'Invalid agreement status.' });
        }
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found.' });
        }
        // Only receiver can accept/decline
        if (!message.receiverId.equals(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized.' });
        }
        message.agreementStatus = agreementStatus;
        await message.save();
        res.json(message);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get received messages (for logged-in user)
app.get('/api/messages/received', auth, async (req, res) => {
    try {
        const messages = await Message.find({ receiverId: req.user._id })
            .populate('senderId', 'name email')
            .populate('referenceId', 'flightNumber type')
            .sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get sent messages (for logged-in user)
app.get('/api/messages/sent', auth, async (req, res) => {
    try {
        const messages = await Message.find({ senderId: req.user._id })
            .populate('receiverId', 'name email')
            .populate('referenceId', 'flightNumber type')
            .sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get chat history between two users for a specific ad
app.get('/api/messages/chat', auth, async (req, res) => {
    try {
        const { adId, userId } = req.query;
        if (!adId || !userId) {
            return res.status(400).json({ error: 'adId and userId are required.' });
        }
        const messages = await Message.find({
            referenceId: adId,
            referenceType: 'Ad',
            $or: [
                { senderId: req.user._id, receiverId: userId },
                { senderId: userId, receiverId: req.user._id }
            ]
        }).sort({ createdAt: 1 }); // oldest first
        res.json(messages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all messages for a specific ad
app.get('/api/messages/for-ad/:adId', auth, async (req, res) => {
    try {
        const adId = req.params.adId;
        
        // First check if the user owns this ad
        const ad = await Ad.findOne({ _id: adId, userId: req.user._id });
        
        if (!ad) {
            return res.status(403).json({ error: 'Access denied. You can only view messages for your own ads.' });
        }
        
        const messages = await Message.find({
            referenceId: adId,
            referenceType: 'Ad'
        })
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .sort({ createdAt: -1 });
        
        res.json(messages);
    } catch (error) {
        console.error('Error fetching ad messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a single message by ID
app.get('/api/messages/:id', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('senderId', 'name email')
            .populate('receiverId', 'name email')
            .populate('referenceId', 'flightNumber type');
        if (!message) {
            return res.status(404).json({ error: 'Message not found.' });
        }
        // Only allow sender or receiver to view
        if (!message.senderId._id.equals(req.user._id) && !message.receiverId._id.equals(req.user._id)) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        res.json(message);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Submit a rating
app.post('/api/ratings', auth, async (req, res) => {
    try {
        const { rateeId, rating, comment, chatId } = req.body;

        // Validate inputs
        if (!rateeId || !rating || !chatId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if rating value is valid
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if user is rating themselves
        if (rateeId === req.user._id.toString()) {
            return res.status(400).json({ error: 'You cannot rate yourself' });
        }

        // Check if user has already rated this person for this chat
        const existingRating = await Rating.findOne({
            rater: req.user._id,
            ratee: new mongoose.Types.ObjectId(rateeId),
            chatId: new mongoose.Types.ObjectId(chatId)
        });

        if (existingRating) {
            return res.status(400).json({ error: 'You have already rated this user for this chat' });
        }

        // Create and save rating
        const newRating = new Rating({
            rater: req.user._id,
            ratee: new mongoose.Types.ObjectId(rateeId),
            rating,
            comment,
            chatId: new mongoose.Types.ObjectId(chatId)
        });

        await newRating.save();

        // Update user's average rating
        const stats = await Rating.calculateAverageRating(rateeId);
        await User.findByIdAndUpdate(rateeId, {
            rating: stats.averageRating,
            totalRatings: stats.totalRatings
        });

        res.status(201).json(newRating);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get ratings for a specific user
app.get('/api/users/:id/ratings', auth, async (req, res) => {
    try {
        const userObjectId = new mongoose.Types.ObjectId(req.params.id);
        const ratings = await Rating.find({ ratee: userObjectId })
            .populate('rater', 'name')
            .sort({ createdAt: -1 });
        
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get rating stats for a specific user
app.get('/api/users/:id/rating-stats', auth, async (req, res) => {
    try {
        const stats = await Rating.calculateAverageRating(req.params.id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check if user has already rated another user for a specific chat
app.get('/api/ratings/check', auth, async (req, res) => {
    try {
        const { rateeId, chatId } = req.query;
        
        if (!rateeId || !chatId) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const existingRating = await Rating.findOne({
            rater: req.user._id,
            ratee: new mongoose.Types.ObjectId(rateeId),
            chatId: new mongoose.Types.ObjectId(chatId)
        });
        
        res.json({ alreadyRated: !!existingRating });
    } catch (error) {
        console.error('Error checking rating:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all chats (conversations) for the current user
app.get('/api/messages/chats', auth, async (req, res) => {
    try {
        // Find all messages where the current user is either sender or receiver
        const messages = await Message.find({
            $or: [
                { senderId: req.user._id },
                { receiverId: req.user._id }
            ]
        })
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .populate('referenceId', 'flightNumber flightDetails type')
        .sort({ createdAt: -1 });
        
        // Group messages by unique conversations (combination of ad and the other user)
        const chats = [];
        const processedCombos = new Set();
        
        messages.forEach(msg => {
            // Determine the other user (not the current user)
            const isCurrentUserSender = msg.senderId._id.toString() === req.user._id.toString();
            const otherUser = isCurrentUserSender ? msg.receiverId : msg.senderId;
            const otherUserId = otherUser._id.toString();
            const adId = msg.referenceId._id.toString();
            
            // Create a unique key for this conversation
            const comboKey = `${otherUserId}_${adId}`;
            
            // Add only if we haven't processed this combo yet
            if (!processedCombos.has(comboKey)) {
                processedCombos.add(comboKey);
                
                // Extract what we need
                chats.push({
                    chatId: msg._id, // Using the message ID as an identifier
                    adId: adId,
                    adTitle: msg.referenceId.flightDetails || 'Flight ' + msg.referenceId.flightNumber,
                    otherUserId: otherUserId,
                    otherUserName: otherUser.name,
                    lastMessage: msg.content,
                    lastMessageDate: msg.createdAt
                });
            }
        });
        
        res.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 