# Database Setup Guide

## PostgreSQL Setup

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Using createdb command
createdb child_security_db

# Or using psql
psql -U postgres
CREATE DATABASE child_security_db;
\q
```

### 3. Configure Connection

Update your `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/child_security_db
```

Example:
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/child_security_db
```

## Redis Setup

### 1. Install Redis

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows:**
Download from [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or use WSL

### 2. Verify Redis is Running

```bash
redis-cli ping
# Should return: PONG
```

### 3. Configure Redis Connection

Update your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=  # Leave empty if no password set
```

## Running Migrations

### Initial Setup

1. Create your first migration:
```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
```

2. Review the generated migration file in `alembic/versions/`

3. Apply the migration:
```bash
alembic upgrade head
```

### Common Migration Commands

```bash
# Create a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current migration version
alembic current

# Show migration history
alembic history
```

## Testing the Setup

### Test PostgreSQL Connection

```bash
psql -U postgres -d child_security_db
```

### Test Redis Connection

The application will automatically test Redis on startup. You can also test manually:

```bash
redis-cli ping
```

### Health Check

Once the backend is running, check the health endpoint:

```bash
curl http://localhost:8000/api/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "Child Security Monitoring API",
  "database": "PostgreSQL",
  "redis": "connected"
}
```

## Troubleshooting

### PostgreSQL Connection Issues

1. Verify PostgreSQL is running:
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql
```

2. Check if database exists:
```bash
psql -U postgres -l
```

3. Verify connection string in `.env` file

### Redis Connection Issues

1. Verify Redis is running:
```bash
redis-cli ping
```

2. Check Redis logs:
```bash
# macOS
tail -f /usr/local/var/log/redis.log

# Linux
sudo tail -f /var/log/redis/redis-server.log
```

3. Test connection manually:
```bash
redis-cli
> SET test "hello"
> GET test
> EXIT
```

## Production Considerations

For production deployment:

1. **Use strong passwords** for both PostgreSQL and Redis
2. **Enable SSL/TLS** for database connections
3. **Set up database backups** regularly
4. **Configure Redis persistence** (AOF or RDB)
5. **Use connection pooling** (already configured in `database.py`)
6. **Set appropriate TTL values** for Redis cache (see `redis_client.py`)

