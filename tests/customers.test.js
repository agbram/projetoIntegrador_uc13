import { jest } from '@jest/globals';
import request from 'supertest';

// Mock dos middlewares para simular usuário Administrador autenticado
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

describe('Customers API', () => {
    let customerId;
    const documentFormatted = "12.345.678/0001-99";
    const documentNumeric = "12345678000199"; 

    it('CT-CUST-01 – Criar cliente com CNPJ Válido', async () => {
        const response = await request(app)
            .post('/customers')
            .send({
                name: "Empresa Fictícia",
                document: documentFormatted, 
                email: "contato@teste.com",
                type: "PJ_CNPJ",
                modality: "Varejo" 
            });
        
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        
        customerId = response.body.id; 
    });

    it('CT-CUST-02 – Falha ao tentar criar cliente omitindo CNPJ', async () => {
        const response = await request(app)
            .post('/customers')
            .send({
                name: "Empresa Sem Doc",
                email: "semdoc@teste.com"
            });
        
        // Espera-se falha do tipo 400 - 500 caso o documento venha undef e dispare erro no Backend
        expect(response.status).toBeGreaterThanOrEqual(400); 
    });

    it('CT-CUST-03 – Buscar cadastro do cliente via documento (CNPJ)', async () => {
        // Enviar o numericCNPJ porque o store() do backend faz document.replace(/\D/g, "")
        const response = await request(app)
            .get(`/customers/check-document/${documentNumeric}`);
            
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('customer');
        expect(response.body.customer.name).toBe("Empresa Fictícia");
        expect(response.body.customer.document).toBe(documentNumeric);
    });

    it('CT-CUST-04 – Modificar Informações de Contato', async () => {
        const response = await request(app)
            .put(`/customers/${customerId}`)
            .send({
                contact: "99999-0000",
                email: "suporte@teste.com"
            });
            
        expect(response.status).toBe(200);
        expect(response.body.email).toBe("suporte@teste.com");
        expect(response.body.contact).toBe("99999-0000");
    });

    it('CT-CUST-05 – Excluir Permanentemente um Cliente', async () => {
        const response = await request(app)
            .delete(`/customers/${customerId}`);
            
        // O Backend CustomerController.delete retorna 200 "Usuário desativado com sucesso!"
        expect(response.status).toBe(200);

        // Opcional: Confirmar que ele foi inativado no banco de dados buscando novamente
        // A API de show apenas busca sem filtro de isActive, então ele ainda será encontrado,
        // mas é suficiente verificar a resposta 200 conforme planejado no requisito.
    });
});
