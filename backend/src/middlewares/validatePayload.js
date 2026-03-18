const validatePayload = (schema, source) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      error: "Payload invalido",
      details: error.details.map((detail) => detail.message),
    });
  }

  req[source] = value;
  return next();
};

module.exports = validatePayload;
