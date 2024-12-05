const rateLimit = require("express-rate-limit");

const creationToolLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 10, // Limit each IP to 10 requests per `windowMs`
    message: "Too many requests from this IP, please try again after a minute.",
    headers: true,
});

module.exports = creationToolLimiter