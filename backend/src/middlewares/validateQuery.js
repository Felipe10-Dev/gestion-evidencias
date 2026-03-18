const validatePayload = require("./validatePayload");

const validateQuery = (schema) => validatePayload(schema, "query");

module.exports = validateQuery;
