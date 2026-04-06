import { Category, PriceStatus } from "@prisma/client";
import request from "supertest";
import { describe, expect, it } from "@jest/globals";

jest.unstable_mockModule('../src/middlewares/auth.js', () => ({
    verificaToken: (req, res, next) => {
        req.usuario = { id: 1, email: 'admin@teste.com', name: 'Admin Teste' };
        next();
    }
}));

jest.unstable_mockModule('../src/middlewares/rules.js', () => ({
    verificaRule: () => (req, res, next) => next()
}));

const { app } = await import('../src/api.js');


describe("user API", function () {
  const app = app();

  it("Deve rejeitar (name) com menos de 3 caracteres", async function () {
    const response = await request(app).post("/user").send({
      name:"ar", 
      email:"armando@gmail.com",
      senha:"123456", 
      phone:"991234567", 
      group:"confeteira",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body).toHaveProperty("message");
  });

  it("Deve rejeitar email com menos de 11 caracteres", async function () {
    const response = await request(app).post("/user").send({
      name:"armando", 
      email:"armando@gmail.com",
      senha:"123456", 
      phone:"991234567", 
      group:"confeteira",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body).toHaveProperty("message");
  });

  it("deve listar usuários", async () => {
    const response = await request(app).get("/users");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

   it("atualizar o nome de user", async () => {
    const created = await request(app).post("/user").send({
      name:"armadinho",
    });

    const id = created.body.id;

    const response = await request(app)
      .patch(`/user/${id}`)
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(false);
  });

  it("deve retornar 204 ao tentar deletar um usuario", async function () {
    const response = await request(app).delete("/user/999");
    expect(response.status).toBe(204);
  });
});