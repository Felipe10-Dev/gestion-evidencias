const roleMiddleware = (role) => {

  return (req, res, next) => {

    if (req.user.rol !== role) {
      return res.status(403).json({
        message: "No tienes permisos"
      });
    }

    next();

  };

};

module.exports = roleMiddleware;