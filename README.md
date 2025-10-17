Inicializando o projeto com a estrutura de pastas

npx prisma generate
npm i prisma --save-dev
npx prisma dev --name init
npx prisma db push --force-reset
npx prisma migrate dev --name nome_da_atualizacao
npx prisma studio

npm i nodemon
npm i express
npm i cors
npm i dotenv
npm i @prisma/client
npm run setup --> para rodar o dev + seed (feito uma vez, usar apenas o run dev)


npm install cross-env --save-dev --> IMPORTANTE PARA RODAR NA PORTA 4000

**ORDEM DE CRIAÇÃO PARA FUNCIONAR DA MELHOR FORMA POSSIVEL**

1. POST /rules(seed);
2. POST /groups(seed); 
3. POST /groups/:id/rules(seed);
4. POST /groups/:id/users(seed); 
5. POST /users(adm criado na seed); 
6. POST /products/; 
7. POST /supplies; 
8. POST /supply-purchases; 
9. POST /orders;


###
Utilizamos o neon db com o postgresql para hospedagem e o render para o auxilio nesse db;
