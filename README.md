# 🚗 Car Shop - SQL + JSON Update

**Update to existing Car Shop project** - added PostgreSQL database support and ability to switch between SQL and JSON databases.

## ✨ What was added?

- **PostgreSQL Database** - full SQL support with transactions
- **Dual database** - ability to use JSON or SQL
- **Manual switching** - change `DB_TYPE` in `.env` file
- **Docker** - easy PostgreSQL setup

## 🚀 How to run?

### Quick start
```bash
npm install
```

### Choose your database:

**For JSON database (files):**
```bash
# 1. Set in .env: DB_TYPE=json
# 2. Run:
npm run server
```

**For PostgreSQL database:**
```bash
# 1. Set in .env: DB_TYPE=sql
# 2. Run:
npm run server-sql
```

### Configure `.env` file
```env
JWT_SECRET=tajny_klucz
PORT=3000
PGUSER=postgres
PGHOST=localhost
PGDATABASE=mydb
PGPASSWORD=postgres
PGPORT=5432
DB_TYPE=sql
```

**Important:** Change `DB_TYPE` manually in `.env` file before running scripts!

### Open `http://localhost:3000`

## 🔄 Database switching

- **`DB_TYPE=json`** → JSON database (files)
- **`DB_TYPE=sql`** → PostgreSQL database

## 🎯 Status

- ✅ **Backend** - Complete with dual database
- ✅ **Frontend** - No changes
- ✅ **PostgreSQL** - Added
- ✅ **JSON fallback** - Preserved
- ✅ **Manual control** - You choose database type

**Project ready!** 🚀
