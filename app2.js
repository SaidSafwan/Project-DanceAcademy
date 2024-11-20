// Import the Express module and create an app instance
require('dotenv').config()
const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // Importing mongoose library
// const bodyParser = require("body-parser"); // For getting body data from requested Form
// const session = require('express-session');  // For session management | instead will use JWT  
// const flash = require('connect-flash');      // For flash messages | Inssted will use jwt
const bcrypt = require('bcrypt'); // Import bcrypt
const jwt = require('jsonwebtoken'); // JWT for authentication
// const { readdir } = require('fs/promises');
const cookieParser = require('cookie-parser');


const app = express(); // Initialize the Express app

app.use(cookieParser()); // Use cookie-parser middleware after initializing app

const port = process.env.PORT || 3000;      // The app will listen on port 3000 (commonly used for HTTP requests)

// MongoDB Stuff
// Open a connection to the DanceAcademy database on your local MongoDB instance

(async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully!');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
})();

// Creating schema
const ContactSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    age: String,
    address: String,
    desc: String
});

// Compile schema into model
const Contact = mongoose.model('Contact', ContactSchema);


// User schema for registration
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    realpassword: { type: String, required: true },   //JUST FOR REFERENCE, REMOVE AT PRODUCTION!!
    role: { type: String, default: 'user' }, // Default role is 'user', admin role can be manually assigned
    createdAt: { type: Date, default: Date.now }
});

// Compile schema into a model
const User = mongoose.model('User', UserSchema);

// app.use(flash());  // Initialize flash messages

// Express Specific Stuff
app.use('/static', express.static('static'));  // For serving static files
app.use(express.urlencoded({ extended: true }));  // Updated body-parser to avoid deprecation warning

// PUG Specific Stuff
app.set('view engine', 'pug');  // Set the template view-engine as PUG
app.set('views', path.join(__dirname, 'views'));  // Set the views directory

// ENDPOINTS

app.get('/register', (req, res) => {
    const message = req.cookies.message || null; // Retrieve the message from the cookies
    res.clearCookie('message'); // Clear the message cookie after reading

    res.status(200).render('register.pug', { message }); // Pass message to the Pug template
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check for existing user with duplicate username or email
        const existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        });

        if (existingUser) {
            // Check which field is already taken and set appropriate cookie message
            if (existingUser.username === username) {
                res.cookie('message', 'Username is already taken. Please choose another.', { httpOnly: true });
            } else if (existingUser.email === email) {
                res.cookie('message', 'Email is already registered. Please use another email.', { httpOnly: true });
            }
            return res.redirect('/register'); // Redirect back to the registration page
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({
            username: username,
            email: email,
            realpassword: password, //JUST FOR REFERENCE, REMOVE AT PRODUCTION!!
            password: hashedPassword
        });
        await newUser.save();

        // Success message
        res.cookie('message', 'Registration successful! You can now log in.', { httpOnly: true });
        res.redirect('/login');
    } catch (error) {
        console.error("Error during registration:", error);

        // Fallback message for unexpected errors
        res.cookie('message', 'Registration failed. Please try again.', { httpOnly: true });
        res.redirect('/register');
    }
});


app.get('/', (req, res) => {
    const message = req.cookies.message || null;

        // Clear the message cookie to avoid displaying it repeatedly
        if (message) {
            res.clearCookie('message');
        }

        // Retrieve and decode the JWT from the cookie
        const token = req.cookies.token;
        let user = null;

        if (token) {
            // Verify and decode the JWT to get user data
            user = jwt.verify(token, process.env.JWT_SECRET);
        }

        // Render the home page with both message and user data
        res.status(200).render('home.pug', { message, user });
});


app.get('/contact', (req, res) => {
     // Retrieve the message from the cookie
     const message = req.cookies.message || null;

     // Clear the message cookie to avoid repeated display
     if (message) {
         res.clearCookie('message');
     }

     // Retrieve and decode the JWT for user data
     const token = req.cookies.token;
     let user = null;

     if (token) {
         // Decode the JWT to extract user information
         user = jwt.verify(token, process.env.JWT_SECRET);
     }

     // Render the contact page with message and user data
     res.status(200).render('contact.pug', { message, user });
});

app.get('/login', (req, res) => {
    const message = req.cookies.message || null; // Retrieve the message from the cookie
    res.clearCookie('message'); // Clear the message cookie after reading
    res.render('login.pug', { message }); // Pass the message to the template
});


// Handle POST request for User-Registration form submission with bcrypt (for creating hashed password)
app.post('/login', async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        // Find the user by username or email
        const user = await User.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail }
            ]
        });

        if (!user) {
            res.cookie('message', 'Invalid username or email.', { httpOnly: true });
            return res.redirect('/login');
        }

        // Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.cookie('message', 'Invalid password.', { httpOnly: true });
            return res.redirect('/login');
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: '1m' // Token expires in 1min
        });

        // Set the token and success message in response cookies
        res.cookie('token', token, { httpOnly: true });
        res.cookie('message', `Welcome back, ${user.username}!`, { httpOnly: true });

        // Redirect to the homepage
        return res.redirect('/');
    } catch (error) {
        console.error("Error during login:", error);
        res.cookie('message', 'An error occurred during login. Please try again.', { httpOnly: true });
        return res.redirect('/login');
    }
});


app.get('/logout', (req, res) => {
    res.clearCookie('token'); // Clear the JWT token cookie

    // Set logout success message in a cookie
    res.cookie('message', 'Logged out successfully.', { httpOnly: true });
    res.redirect('/login'); // Redirect to the login page
});


// Middleware to verify JWT tokens for protected routes.

function authenticateJWT(req, res, next) {
    const token = req.cookies.token; // Get token from cookies

    if (!token) {
        // Set an error message in a cookie
        res.cookie('message', 'Authentication required!', { httpOnly: true });
        return res.redirect('/');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT verification error:", err);
            res.cookie('message', 'Invalid or expired token!', { httpOnly: true });
            return res.redirect('/login');
        }
        req.user = user; // Attach user info to request object
        next();
    });
}



// Middleware to with JWT-based checks. check if user is logged in and is an admin
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next(); // Proceed to the route
    }
    res.cookie('message', 'Access denied! Admins only.', { httpOnly: true });
    res.redirect('/login'); // Redirect to login if not admin
}


//Protect the "Contact Info" Route:
app.get('/userdata', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const users = await Contact.find(); // Fetch all user records from MongoDB
        const message = req.cookies.message || null; // Retrieve any message from the cookie
        if (message) {
            res.clearCookie('message'); // Clear the message cookie after retrieving
        }
        res.render('userdata.pug', { users, user: req.user, message }); // Pass data to the template
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Error fetching user data. Please try again.");
    }
});


// Handle POST request for contact form submission
app.post('/contact', async (req, res) => {
    try {
        const contactData = new Contact(req.body); // Fetch data from contact form
        await contactData.save(); // Save to MongoDB

        // Set success message in a cookie
        res.cookie('message', 'Your form has been successfully submitted', { httpOnly: true });
        res.redirect('/'); // Redirect to the homepage
    } catch (error) {
        console.error("Error saving contact form:", error);

        // Set error message in a cookie
        res.cookie('message', 'There was an error saving the form', { httpOnly: true });
        res.redirect('/'); // Redirect to the homepage
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
