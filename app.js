const express = require('express');
const session = require('express-session');
const passport = require("passport");
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT;
const defaultRoute = require('./routes/defaultRoute');
const uploadRoute = require('./routes/uploadRoute');
const databaseController = require('./controllers/databaseController');
const limiter = require("./middlewares/limiter")

// Use Helmet for security headers
app.use(helmet());

// Limit body size to prevent abuse
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Static files
const uploadsDir = path.join(__dirname, 'images', 'uploads'); // Adjust path as per your new structure

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images/uploads', express.static(uploadsDir));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', defaultRoute, limiter.generalLimiter);
app.use('/', uploadRoute, limiter.creationToolLimiter);

// Start server
app.listen(port, () => {
  databaseController();
});
