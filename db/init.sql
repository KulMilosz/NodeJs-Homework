-- Inicjalizacja bazy danych Car Shop

-- Tabela użytkowników
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela samochodów
CREATE TABLE IF NOT EXISTS cars (
    id VARCHAR(50) PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    owner_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_cars_owner_id ON cars(owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);

-- Wstawienie domyślnych danych (jeśli tabele są puste)
INSERT INTO users (id, username, password, role, balance) 
VALUES 
    ('admin001', 'admin1', 'admin1', 'admin', 28000.00),
    ('1752518369459', 'test1', 'nowehaslo', 'user', 5002875.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cars (id, model, price, owner_id)
VALUES 
    ('1752597044824', 'astra', 1.00, '1752518369459')
ON CONFLICT (id) DO NOTHING; 