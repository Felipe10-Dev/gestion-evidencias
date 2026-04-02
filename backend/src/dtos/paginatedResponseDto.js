const { buildPaginationMeta } = require("../utils/pagination");

const buildEmptyPaginatedResponse = ({ page = 1, limit = 20 } = {}) => ({
  data: [],
  meta: buildPaginationMeta({ page, limit, total: 0 }),
});

module.exports = {
  buildEmptyPaginatedResponse,
};
