const express = require('express');
const router = express.Router();
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('../models/users');
const multer = require('multer')
const Recipe = require('../models/recipe');
const { storage } = require('../cloudinary')
const MongoStore = require('connect-mongo')

const parser = multer({ storage })
// Middleware
router.use(express.json());
router.use(session({
    secret: 'this is the secret key',
    saveUninitialized: true,
    resave: false,
    store: MongoStore.create({
        mongoUrl: process.env.URI,
        collectionName: process.env.SessionStore
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }

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
router.get('/fail', (req, res) => {
    res.json("fuck");
})
router.post('/login', passport.authenticate('local', { failureRedirect: '/fail' }), (req, res) => {
    console.log(req.session)
    res.status(200).json(req.session);
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
    await newRecipe.save();
    res.status(200).json({ msg: "done" });
})
// Like a recipe
router.post('/recipes/like/:recipeId', isLoggedIn, async (req, res) => {
    console.log(req.user)
    const { recipeId } = req.params;
    try {
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        console.log(recipe)

        // Check if the user has already liked the recipe
        if (recipe.likes && recipe.likes.includes(req.user._id)) {
            return res.status(400).json({ message: 'Recipe already liked by this user' });
        }

        recipe.likes.push(req.user._id); // Add user ID to the likes array
        await recipe.save();

        res.status(200).json({ message: 'Recipe liked successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Unlike a recipe
router.post('/recipes/unlike/:recipeId', async (req, res) => {
    const { recipeId } = req.params;
    const { userId } = req.session; // Assuming userId is sent in the request body

    try {
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        // Check if the user has liked the recipe
        const indexOfUser = recipe.likes.indexOf(userId);
        if (indexOfUser === -1) {
            return res.status(400).json({ message: 'Recipe not liked by this user' });
        }

        recipe.likes.splice(indexOfUser, 1); // Remove user ID from the likes array
        await recipe.save();

        res.status(200).json({ message: 'Recipe unliked successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
