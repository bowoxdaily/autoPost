import { verifyToken } from '../utils/jwt.js';

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Map userId to id for consistency, set both for compatibility
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id  // Support both userId and id
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          ...decoded,
          id: decoded.userId || decoded.id  // Support both userId and id
        };
      }
    }
  } catch (error) {
    // Ignore error for optional auth
  }
  next();
}
