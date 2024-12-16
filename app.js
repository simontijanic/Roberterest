const express = require('express');
const session = require('express-session');
const passport = require("passport");
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const defaultRoute = require('./routes/defaultRoute');
const uploadRoute = require('./routes/uploadRoute');
const databaseController = require('./controllers/databaseController');
const limiter = require("./middlewares/limiter")

// Static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const uploadsDir = path.join(__dirname, 'images', 'uploads'); 
app.use('/images/uploads', express.static(uploadsDir));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

app.use(helmet());

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
app.use('/', limiter.generalLimiter, defaultRoute);
app.use('/', limiter.creationToolLimiter, uploadRoute);

// Start server
app.listen(port, () => {
  databaseController();
});
