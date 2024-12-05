const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const passport = require("passport")

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    res.status(429).json({
      message: 'Too many requests, please try again later.'
    });
  }
});

const path = require('path');
const app = express();
require('dotenv').config();

const port = process.env.PORT;
const defaultRoute = require('./routes/defaultRoute');
const uploadRoute = require('./routes/uploadRoute');
const databaseHandler = require('./handlers/databaseHandler');

const isProduction = process.env.production === 'true';

// Limit body size to prevent abuse
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Static files
const uploadsDir = path.join(__dirname, 'images', 'uploads'); // Adjust path as per your new structure

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images/uploads', express.static(uploadsDir));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

if (isProduction) {
  app.use(limiter);
} else {
  console.log('Rate limiting is disabled in development mode.');
}

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
app.use('/', defaultRoute);
app.use('/', uploadRoute);

// Start server
app.listen(port, () => {
  databaseHandler();
});
