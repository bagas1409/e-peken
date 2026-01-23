export const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`[AUTH DEBUG] 403 Forbidden. User Role: '${req.user.role}', Allowed: ${JSON.stringify(allowedRoles)}`);
      return res.status(403).json({
        message: "Akses ditolak",
      });
    }
    next();
  };
};
