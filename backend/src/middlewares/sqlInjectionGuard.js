const SQL_KEYWORDS_PATTERN = /\b(union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+\w+\s+set|or\s+\d+\s*=\s*\d+|and\s+\d+\s*=\s*\d+)\b/i;
const SQL_META_PATTERN = /('|"|;|--|\/\*|\*\/)/;

const hasSuspiciousSQLiContent = (value) => {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text) return false;

  const lowered = text.toLowerCase();
  const keywordHit = SQL_KEYWORDS_PATTERN.test(lowered);
  const metaHit = SQL_META_PATTERN.test(text);

  return keywordHit && metaHit;
};

const traverse = (node) => {
  if (node == null) return false;

  if (typeof node === "string") {
    return hasSuspiciousSQLiContent(node);
  }

  if (Array.isArray(node)) {
    return node.some(traverse);
  }

  if (typeof node === "object") {
    return Object.values(node).some(traverse);
  }

  return false;
};

const sqlInjectionGuard = (req, res, next) => {
  const suspicious = traverse(req.body) || traverse(req.query) || traverse(req.params);

  if (suspicious) {
    return res.status(400).json({
      code: "SUSPICIOUS_INPUT",
      error: "Entrada rechazada por politicas de seguridad",
    });
  }

  return next();
};

module.exports = sqlInjectionGuard;
