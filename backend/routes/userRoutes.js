const express = require('express');
const router = express.Router();
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('../models/users');
const multer = require('multer')
const Recipe = require('../models/recipe');
const { storage } = require('../cloudinary')

const parser = multer({ storage })
// Middleware
router.use(express.json());
router.use(session({
    secret: 'this is the secret key',
    saveUninitialized: false,
    resave: false,
}));
router.use(passport.initialize());
router.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Custom middleware to handle login authentication
const loginMiddleware = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!user) {
            console.log(info.message)
            return res.status(401).json({ message: 'Invalid credentials', error: info.message });
        }

        // Manually log in the user
        req.logIn(user, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            next(); // Proceed to the next middleware (login route)
        });
    })(req, res, next);
};

// Custom middleware to check if the user is authenticated
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ message: 'You need to login first' });
    }
};

// Check if user is authenticated
router.get('/check-auth', (req, res) => {
    res.json({ isAuthenticated: req.isAuthenticated() });
});

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email });
        const newUser = await User.register(user, password);
        console.log(newUser);
        res.status(200).json({ message: 'Signup successful' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', loginMiddleware, (req, res) => {
    res.status(200).json({ message: 'Login successful' });
});

// Logout route
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});

router.get('/registeredData', async (req, res) => {
    try {
        const users = await User.find({}, 'username email');
        const usernames = users.map(user => user.username);
        const emails = users.map(user => user.email);
        res.status(200).json({ usernames, emails });
    } catch (error) {
        console.error('Error fetching registered data:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/recipes/:page/:limit', async (req, res) => {
    const { page, limit } = req.params;

    try {
        const recipes = await Recipe.find()
            .skip((page - 1) * limit)
            .limit(limit)
        res.status(200).json(recipes);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/recipes/create', parser.single('image'), async (req, res) => {
    const newRecipe = new Recipe(req.body);
    newRecipe.image = req.file.path;
    res.status(200).json({ msg: "done" });
})
module.exports = router;
