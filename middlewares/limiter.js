const rateLimit = require("express-rate-limit");

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: 300, // Limit each IP to 300 requests per 15 minutes
    message: "Too many requests from this IP, please try again after a minute.",
    headers: true,
});

const creationToolLimiter  = rateLimit({
    windowMs: 60 * 1000, // 1-minute window
    max: 5, // Limit each IP to 5 requests per minute
    message: "Too many requests from this IP, please try again after a minute.",
    headers: true,
});


module.exports = {creationToolLimiter, generalLimiter}