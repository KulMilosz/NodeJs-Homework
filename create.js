const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "mydb",
});

async function createTable() {
  try {
    await client.connect();

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createTableQuery);
    console.log("✅ Table 'users' created (or already exists)");
  } catch (err) {
    console.error("❌ Error creating table:", err);
  } finally {
    await client.end();
  }
}

createTable();
