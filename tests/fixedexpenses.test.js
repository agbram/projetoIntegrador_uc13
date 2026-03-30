import request from 'supertest';
import { describe, expect, it } from '@jest/globals';
import { app } from '../src/api.js';

describe('Products API', function () {

    it('CT-FE-01: Deve criar uma despesa fixa válida', async () => {
        const response = await request(app)
            .post('/fixedexpenses')
            .send({
                description: 'Aluguel',
                amount: 1000,
                dueDate: '2022-01-01'
            });
        expect(response.status).toBe(201);
    });

    it('CT-FE-02: Deve retornar erro ao criar despesa fixa sem descrição', async () => {
        const response = await request(app)
            .post('/fixedexpenses')
            .send({
                amount: 1000,
                dueDate: '2022-01-01'
            });
        expect(response.status).toBe(400);
    });

    it('CT-FE-02: Deve rejeitar criação com value negativo', async () => {
        const response = await request(app)
            .post('/fixedexpenses')
            .send({
                description: 'Aluguel',
                amount: -1000,
                dueDate: '2022-01-01'
            });
        expect(response.status).toBe(400);
    });

    it('CT-FE-03: Deve atualizar campo isActive para false', async () => {
        const response = await request(app)
            .put('/fixedexpenses/1')
            .send({
                isActive: false
            });
        expect(response.status).toBe(200);
    });

    it('CT-FE-04: Deve excluir uma despesa fixa', async () => {
        const response = await request(app)
            .delete('/fixedexpenses/1');
        expect(response.status).toBe(200);
    });

    it('CT-FE-05: Deve listar todas as despesas fixas', async () => {
        const response = await request(app)
            .get('/fixedexpenses');''
        expect(response.status).toBe(200);
    });

    
});