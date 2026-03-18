const statusCodeToErrorCode = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_SERVER_ERROR",
};

const normalizeErrorResponse = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (res.statusCode < 400) {
      return originalJson(payload);
    }

    if (payload && payload.success === false && payload.error) {
      return originalJson(payload);
    }

    const message = (payload && (payload.error || payload.message)) || "Ocurrio un error";
    const details = payload && payload.details ? payload.details : [];
    const code = (payload && payload.code) || statusCodeToErrorCode[res.statusCode] || "ERROR";

    return originalJson({
      success: false,
      error: {
        code,
        message,
        details,
      },
    });
  };

  next();
};

module.exports = normalizeErrorResponse;
