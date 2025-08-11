import { Pool } from 'pg';
import { User, Car } from './types.js';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool();

pool.on('connect', () => {
  console.log('✅ Połączono z bazą danych PostgreSQL');
});

pool.on('error', (err: Error) => {
  console.error('❌ Błąd połączenia z bazą danych:', err);
});

export async function getAllUsers(): Promise<User[]> {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

export async function getAllCars(): Promise<Car[]> {
  const result = await pool.query('SELECT * FROM cars');
  return result.rows;
}

export async function getCarById(id: string): Promise<Car | undefined> {
  const result = await pool.query('SELECT * FROM cars WHERE id = $1', [id]);
  return result.rows[0];
}

export async function saveAllUsers(users: User[]): Promise<void> {
  for (const user of users) {
    await pool.query(
      'INSERT INTO users (id, username, password, role, balance) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET username = $2, password = $3, role = $4, balance = $5',
      [user.id, user.username, user.password, user.role, user.balance]
    );
  }
}

export async function saveAllCars(cars: Car[]): Promise<void> {
  for (const car of cars) {
    await pool.query(
      'INSERT INTO cars (id, model, price, owner_id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET model = $2, price = $3, owner_id = $4',
      [car.id, car.model, car.price, car.ownerId || null]
    );
  }
} 