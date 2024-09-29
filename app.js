// Import the Express module and create an app instance
const express = require('express');
const path  = require('path');
const app = express();  // Create an instance of the Express application 
const port = 3000;        // The app will listen on port 3000 (commonly used for HTTP requests)

// Express Specific Stuff
app.use('/static', express.static('static'));  //For Serving static file 
app.use(express.urlencoded());  //this middleware help to get data from form

//PUG Specific Stuff
app.set('view engine', 'pug');  //Set the template view-engine as PUG
app.set('views', path.join(__dirname, 'views'));  //set the view directory

//ENDPOINT
app.get('/', (req ,res)=>{
    const params = {};
    res.status(200).render('index.pug', params);
});

// Start the server 
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});