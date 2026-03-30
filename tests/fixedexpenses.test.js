import request from "supertest";
import { describe, expect, it } from "@jest/globals";
import { app } from "../src/api.js";

describe("FixedExpenses API", () => {
  it("CT-FE-01: Deve criar uma despesa fixa válida", async () => {
    const response = await request(app).post("/fixedexpenses").send({
      description: "Aluguel",
      value: 1000,
      date: "2022-01-01",
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.isActive).toBe(true);
    expect(response.body.recurring).toBe(false);
  });

  it("CT-FE-02: Deve retornar erro ao criar despesa fixa sem descrição", async () => {
    const response = await request(app).post("/fixedexpenses").send({
      value: 1000,
      date: "2022-01-01",
    });

    expect(response.status).toBe(400);
  });

  it("CT-FE-03: Deve rejeitar criação com value negativo", async () => {
    const response = await request(app).post("/fixedexpenses").send({
      description: "Aluguel",
      value: -1000,
      date: "2022-01-01",
    });

    expect(response.status).toBe(400);
  });

  it("CT-FE-04: Deve atualizar campo isActive para false", async () => {
    const created = await request(app).post("/fixedexpenses").send({
      description: "Para update",
      value: 1000,
      date: "2022-01-01",
    });

    const id = created.body.id;

    const response = await request(app)
      .patch(`/fixedexpenses/${id}`)
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(false);
  });

  it("CT-FE-05: Deve excluir uma despesa fixa", async () => {
    const created = await request(app).post("/fixedexpenses").send({
      description: "Para delete",
      value: 1000,
      date: "2022-01-01",
    });

    const id = created.body.id;

    const response = await request(app).delete(`/fixedexpenses/${id}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe("");
  });

  it("CT-FE-06: Deve listar todas as despesas fixas", async () => {
    const response = await request(app).get("/fixedexpenses");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
