const rateLimit = require("express-rate-limit");

exports.creationToolLimiter = rateLimit({
  windowMs: 60 * 1000, // 1-minute window
  max: 10, // Limit each IP to 10 requests per window
  message: "Too many requests from this IP, please try again after a minute.",
  headers: true, // Include rate limit headers in the response
});
