const Joi = require("joi");

const idField = Joi.string().trim().min(1).required();
const optionalIdField = Joi.string().trim().min(1);

const authRegisterSchema = Joi.object({
  nombre: Joi.string().trim().min(1).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid("admin", "tecnico").required(),
});

const authLoginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const authUpdateUserSchema = Joi.object({
  nombre: Joi.string().trim().min(1),
  email: Joi.string().trim().email(),
  rol: Joi.string().valid("admin", "tecnico"),
  password: Joi.string().min(6),
}).min(1);

const projectCreateSchema = Joi.object({
  nombre: Joi.string().trim().min(1).required(),
  descripcion: Joi.string().allow("").optional(),
});

const projectUpdateSchema = Joi.object({
  nombre: Joi.string().trim().min(1),
  descripcion: Joi.string().allow(""),
}).min(1);

const teamCreateSchema = Joi.object({
  nombre: Joi.string().trim().min(1).required(),
  projectId: optionalIdField,
  ProjectId: optionalIdField,
}).xor("projectId", "ProjectId");

const teamUpdateSchema = Joi.object({
  nombre: Joi.string().trim().min(1).required(),
});

const teamAssignProjectSchema = Joi.object({
  projectId: optionalIdField,
  ProjectId: optionalIdField,
}).xor("projectId", "ProjectId");

const evidenceCreateSubfolderSchema = Joi.object({
  nombre: Joi.string().trim().min(1).required(),
});

const evidenceRenameFolderSchema = Joi.object({
  nombre: Joi.string().trim().min(1).required(),
});

const evidenceUploadSchema = Joi.object({
  teamId: idField,
  descripcion: Joi.string().allow("").optional(),
  etapa: Joi.string().valid("antes", "durante", "despues").required(),
  referencia: Joi.string().trim().allow("").optional(),
  subcarpeta: Joi.string().trim().allow("").optional(),
}).or("referencia", "subcarpeta");

const userIdParamSchema = Joi.object({
  id: idField,
});

const projectIdParamSchema = Joi.object({
  id: idField,
});

const teamIdParamSchema = Joi.object({
  id: idField,
});

const evidenceTeamIdParamSchema = Joi.object({
  teamId: idField,
});

const evidenceIdParamSchema = Joi.object({
  id: idField,
});

const driveFolderIdParamSchema = Joi.object({
  folderId: idField,
});

const paginationBaseQuerySchema = {
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().trim().min(1),
  order: Joi.string().lowercase().valid("asc", "desc"),
  search: Joi.string().trim().allow("").max(100),
};

const projectListQuerySchema = Joi.object({
  ...paginationBaseQuerySchema,
});

const teamListQuerySchema = Joi.object({
  projectId: Joi.string().trim().min(1),
  unassigned: Joi.string().valid("true"),
  ...paginationBaseQuerySchema,
}).oxor("projectId", "unassigned");

const evidenceListQuerySchema = Joi.object({
  teamId: Joi.string().trim().min(1),
  etapa: Joi.string().valid("antes", "durante", "despues"),
  ...paginationBaseQuerySchema,
});

const emptyQuerySchema = Joi.object({});

module.exports = {
  authLoginSchema,
  authRegisterSchema,
  authUpdateUserSchema,
  driveFolderIdParamSchema,
  emptyQuerySchema,
  evidenceCreateSubfolderSchema,
  evidenceIdParamSchema,
  evidenceListQuerySchema,
  evidenceRenameFolderSchema,
  evidenceTeamIdParamSchema,
  evidenceUploadSchema,
  projectCreateSchema,
  projectIdParamSchema,
  projectListQuerySchema,
  projectUpdateSchema,
  teamAssignProjectSchema,
  teamCreateSchema,
  teamIdParamSchema,
  teamListQuerySchema,
  teamUpdateSchema,
  userIdParamSchema,
};
