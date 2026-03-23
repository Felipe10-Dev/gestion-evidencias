const roleMiddleware = (...roles) => {

  return (req, res, next) => {

    if (!roles.length) {
      return res.status(500).json({
        message: "Configuracion de permisos invalida"
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        message: "No tienes permisos"
      });
    }

    next();

  };

};

module.exports = roleMiddleware;