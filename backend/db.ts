import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Car } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersPath = path.join(__dirname, '..', 'db', 'users.json');
const carsPath = path.join(__dirname, '..', 'db', 'cars.json');


export async function getAllUsers(): Promise<User[]> {
    const data = await fs.readFile(usersPath, 'utf-8');
    return JSON.parse(data);
  }
  
export async function getAllCars(): Promise<Car[]> {
    const data = await fs.readFile(carsPath, 'utf-8');
    return JSON.parse(data);
  }

export async function getUserById(id: string): Promise<User | undefined> {
    const users = await getAllUsers();
    return users.find(user => user.id === id);
  }

export async function getCarById(id:string): Promise<Car | undefined> {
    const cars = await getAllCars()
    return cars.find(car => car.id === id)
}

export async function saveAllUsers(users: User[]): Promise<void> {
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
  }
  
  export async function saveAllCars(cars: Car[]): Promise<void> {
    await fs.writeFile(carsPath, JSON.stringify(cars, null, 2));
  }