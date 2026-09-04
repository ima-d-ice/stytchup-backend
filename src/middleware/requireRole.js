// Role-based access control. Requires isAuthenticated to have run first
// (req.user + req.role are set there).
function requireRole(...allowed) {
  const set = new Set(allowed);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!set.has(req.role || 'CUSTOMER')) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    return next();
  };
}

module.exports = { requireRole };
