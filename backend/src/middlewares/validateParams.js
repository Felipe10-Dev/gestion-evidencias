const validatePayload = require("./validatePayload");

const validateParams = (schema) => validatePayload(schema, "params");

module.exports = validateParams;
