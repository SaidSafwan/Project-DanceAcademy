// Import the Express module and create an app instance
const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // Importing mongoose library
const bodyParser = require("body-parser"); // For getting body data from requested Form
const session = require('express-session');  // For session management
const flash = require('connect-flash');      // For flash messages

const app = express();  // Create an instance of the Express application
const port = 3000;      // The app will listen on port 3000 (commonly used for HTTP requests)

// MongoDB Stuff
// Open a connection to the DanceAcademy database on your local MongoDB instance
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/DanceAcademy');
}

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
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Compile schema into a model
const User = mongoose.model('User', UserSchema);

// Middleware for sessions and flash messages 
app.use(session({
    secret: 'mySuperSecretKey123!',  // Replace with a strong key
    resave: false,
    saveUninitialized: true
}));

app.use(flash());  // Initialize flash messages

// Express Specific Stuff
app.use('/static', express.static('static'));  // For serving static files
app.use(express.urlencoded({ extended: true }));  // Updated body-parser to avoid deprecation warning

// PUG Specific Stuff
app.set('view engine', 'pug');  // Set the template view-engine as PUG
app.set('views', path.join(__dirname, 'views'));  // Set the views directory

// ENDPOINTS
/* app.get('/', (req, res) => {
    const params = {};
    res.status(200).render('home.pug', params);
}); */

app.get('/register', (req, res) => {
    const params = {};
    res.status(200).render('register.pug', params);
});


app.get('/', (req, res) => {
    // const message = req.query.message;  // Get the message from query string 
    const message = req.flash('message');  // Get the flash message  | to avoid display msg content on url
    res.status(200).render('home.pug', { message: message });  // Pass the message to the Pug template
});


app.get('/contact', (req, res) => {
    const params = {};
    res.status(200).render('contact.pug', params);
});

app.get('/userdata', async (req, res) => {
    try {
        const users = await Contact.find(); //To Fetch all user records from MongoDB
        res.render('userdata.pug', { users }); // Pass users data to `userdata.pug`
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Error fetching user data. Please try again.");
    }
});

// Handle POST request for User-Registration form submission
app.post('/register', async (req, res) => {
    try {
        // Create a new user with data from the registration form
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password // For now, store the password as plain text (hashing recommended)
        });

        // Save the user in MongoDB
        await newUser.save();

        // Flash a success message
        req.flash('message', 'Registration successful! You can now log in.');
        res.redirect('/'); // Redirect to the homepage
    } catch (error) {
        console.error("Error registering user:", error);

        // Handle unique email constraint or other errors
        if (error.code === 11000) { // Duplicate key error
            req.flash('message', 'Email is already registered. Please use another email.');
        } else {
            req.flash('message', 'Registration failed. Please try again.');
        }
        res.redirect('/register'); // Redirect back to the registration page
    }
});



// Handle POST request for contact form submission
app.post('/contact', (req, res) => {
    var contactData = new Contact(req.body);  // Fetch data from contact form

    // Save data to MongoDB and handle success/failure cases
    /* contactData.save().then(() => {  
        res.render('contact.pug', { message: "Your data has been saved successfully!" });
    }).catch(() => {
        res.status(500).render('contact.pug', { message: "Error saving data. Please try again." });
    }); */

    //this promise code below was redirecting & parsing message through query string on url

    /* contactData.save().then(() => {
        // Redirect to home with success message
        res.redirect('/?message=Your form has been successfully submitted');
    }).catch(() => {
        // Redirect to home with error message
        res.redirect('/?message=There was an error saving the form');
    }); */

    //this promise code below was redirecting & parsing message through flash

    contactData.save().then(() => {
        req.flash('message', 'Your form has been successfully submitted');  // Set flash message
        res.redirect('/');  // Redirect to the homepage without query string
    }).catch(() => {
        req.flash('message', 'There was an error saving the form');
        res.redirect('/');  // Redirect with the error flash message
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
