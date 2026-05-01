const { Pool } = require('pg');

const commonConfig = {
    user: process.env.DB_USER || 'admin',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'secretpassword',
    port: process.env.DB_PORT || 5432,
};

// Analytics works by querying all three microservice databases
const userPool = new Pool({ ...commonConfig, database: 'user_db' });
const productPool = new Pool({ ...commonConfig, database: 'product_db' });
const aiPool = new Pool({ ...commonConfig, database: 'ai_db' });

module.exports = {
    userPool,
    productPool,
    aiPool
};
