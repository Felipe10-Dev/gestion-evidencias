const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const hasPaginationQuery = (query = {}) => (
  query.page !== undefined
  || query.limit !== undefined
  || query.sort !== undefined
  || query.order !== undefined
  || query.search !== undefined
);

const parsePaginationQuery = (query = {}, options = {}) => {
  const {
    defaultSort = "createdAt",
    defaultOrder = "DESC",
    allowedSortFields = ["createdAt"],
  } = options;

  const page = Number(query.page || DEFAULT_PAGE);
  const rawLimit = Number(query.limit || DEFAULT_LIMIT);
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const sort = allowedSortFields.includes(query.sort) ? query.sort : defaultSort;
  const order = String(query.order || defaultOrder).toUpperCase() === "ASC" ? "ASC" : "DESC";

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    sort,
    order,
    search: (query.search || "").trim(),
  };
};

const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = {
  buildPaginationMeta,
  hasPaginationQuery,
  parsePaginationQuery,
};