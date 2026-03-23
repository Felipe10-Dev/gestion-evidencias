const request = require("supertest");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = require("../expressApp");

const adminToken = jwt.sign({ id: "test-admin", rol: "admin" }, process.env.JWT_SECRET);
const tecnicoToken = jwt.sign({ id: "test-tech", rol: "tecnico" }, process.env.JWT_SECRET);

describe("API security smoke tests", () => {
  it("rejects unknown fields in auth login payload", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "secret123",
        extra: "not-allowed",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects unknown fields in create project payload", async () => {
    const response = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: "Proyecto X",
        descripcion: "Desc",
        extra: "not-allowed",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects unknown fields in create team payload", async () => {
    const response = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nombre: "Equipo A",
        projectId: "project-123",
        extra: "not-allowed",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("allows tecnico to pass team create authorization", async () => {
    const response = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${tecnicoToken}`)
      .send({
        nombre: "Equipo A",
        projectId: "project-123",
      });

    expect(response.status).not.toBe(403);
    expect(response.body?.error?.code).not.toBe("FORBIDDEN");
  });

  it("rejects unknown fields in upload evidence payload", async () => {
    const response = await request(app)
      .post("/api/evidences")
      .set("Authorization", `Bearer ${tecnicoToken}`)
      .field("teamId", "team-123")
      .field("etapa", "antes")
      .field("referencia", "frente")
      .field("extra", "not-allowed");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("validates query params for team list endpoint", async () => {
    const response = await request(app)
      .get("/api/teams?foo=bar")
      .set("Authorization", `Bearer ${tecnicoToken}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
