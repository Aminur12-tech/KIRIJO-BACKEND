import jwt from 'jsonwebtoken';

export const authMiddleware = async (req, res, next) => {
  try {
    // Check Authorization header first
    let token = req.headers.authorization?.split("Bearer ")[1];

    // If no token in Authorization header, check cookies
    if (!token && req.headers.cookie) {
      const cookieToken = req.headers.cookie
        .split(';')
        .find(c => c.trim().startsWith('kirijo_cookie='));
      if (cookieToken) {
        token = cookieToken.split('=')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token with your secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;

    // Check if token is expired
    if (decodedToken.exp < Date.now() / 1000) {
      return res.status(401).json({ message: "Token has expired" });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
