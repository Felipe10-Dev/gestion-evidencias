const { ipKeyGenerator, rateLimit } = require("express-rate-limit");

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    return `${ipKeyGenerator(req.ip)}:${email}`;
  },
  message: {
    code: "TOO_MANY_LOGIN_ATTEMPTS",
    error: "Demasiados intentos de login. Intenta nuevamente en unos minutos.",
  },
});

module.exports = loginRateLimiter;
