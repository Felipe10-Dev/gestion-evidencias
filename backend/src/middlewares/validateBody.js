const validatePayload = require("./validatePayload");

const validateBody = (schema) => validatePayload(schema, "body");

module.exports = validateBody;
