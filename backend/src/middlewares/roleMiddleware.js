const normalizeRole = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const roleMiddleware = (...roles) => {

  const allowedRoles = roles.map(normalizeRole).filter(Boolean);

  return (req, res, next) => {

    if (!allowedRoles.length) {
      return res.status(500).json({
        message: "Configuracion de permisos invalida"
      });
    }

    const userRole = normalizeRole(req.user?.rol || req.user?.role);

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "No tienes permisos"
      });
    }

    next();

  };

};

module.exports = roleMiddleware;