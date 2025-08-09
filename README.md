# Bun API with PostgreSQL

A simple Bun API application and PostgreSQL, containerized with Docker.


## Technology Stack

**Bun Container: FROM oven/bun:1**
- OS Alpine Linux 3.20.6
- Bun: 1.2.18
- PG: 8.11.3

**PostgreSQL Container: FROM postgres:17.5**
- OS Debian GNU/Linux 12 (bookworm)
- PostgreSQL: 17.5

**Adminer Container: FROM adminer:5-standalone**
- OS Alpine Linux: 3.22.1
- Adminer: 5.3.0

**Grafana/k6 Container: FROM grafana/k6:1.1.0**
- OS Alpine Linux: 3.22.0
- Grafana/k6: 1.1.0


## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/opsnoopop/api_bun_postgresql.git
```

### 2. Navigate to Project Directory
```bash
cd api_bun_postgresql
```

### 3. Start the Application
```bash
docker compose up -d --build
```

### 4. Create table users
```bash
docker exec -i container_postgresql sh -c "PGPASSWORD='testpass' psql -U testuser -d testdb -c '
CREATE TABLE IF NOT EXISTS public.users (
  user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);'"
```


## API Endpoints

### Health Check
- **URL:** http://localhost:3001/
- **Method:** GET
- **Response:**
```json
{
  "message": "Hello World from Bun"
}
```

### Create user
- **URL:** http://localhost:3001/users
- **Method:** POST
- **Request**
```json
{
  "username":"optest",
  "email":"opsnoopop@hotmail.com"
}
```
- **Response:**
```json
{
  "message":"User created successfully",
  "user_id":1
}
```

### Get user
- **URL:** http://localhost:3001/users/1
- **Method:** GET
- **Response:**
```json
{
  "user_id":1,
  "username":"optest",
  "email":"opsnoopop@hotmail.com"
}
```


## Test Performance by sysbench

### sysbench e.g.
```text
step 1 prepare
step 2 run test someting
step 3 cleanup

sysbench \
...
oltp_read_write prepare; # step 1 prepare สร้าง table

sysbench \
...
oltp_read_write run;     # step 2 run test อ่าน เขียน พร้อมกัน

sysbench \
...
oltp_read_only run;      # step 2 run test อ่าน อย่างเดียว

sysbench \
...
oltp_write_only run;     # step 2 run test เขียน อย่างเดียว

sysbench \
...
oltp_update_index run;   # step 2 run test update index

sysbench \
...
oltp_point_select run;   # step 2 run test query แบบเลือก row เดียว

sysbench \
...
oltp_delete run;         # step 2 run test delete rows

sysbench \
...
oltp_read_write cleanup; # step 3 cleanup ลบ table
```

### sysbench step 1 prepare
```bash
docker run \
--name container_ubuntu_tool \
--rm \
-it \
--network global_bun \
opsnoopop/ubuntu-tool:1.0 \
sysbench \
--threads=2 \
--time=10 \
--db-driver="mysql" \
--mysql-host="container_postgresql" \
--mysql-port=5432 \
--mysql-user="testuser" \
--mysql-password="testpass" \
--mysql-db="testdb" \
--tables=10 \
--table-size=100000 \
oltp_read_write prepare;
```

### sysbench step 2 run test
```bash
docker run \
--name container_ubuntu_tool \
--rm \
-it \
--network global_bun \
opsnoopop/ubuntu-tool:1.0 \
sysbench \
--threads=2 \
--time=10 \
--db-driver="mysql" \
--mysql-host="container_postgresql" \
--mysql-port=5432 \
--mysql-user="testuser" \
--mysql-password="testpass" \
--mysql-db="testdb" \
--tables=10 \
--table-size=100000 \
oltp_read_write run;
```

### sysbench step 3 cleanup
```bash
docker run \
--name container_ubuntu_tool \
--rm \
-it \
--network global_bun \
opsnoopop/ubuntu-tool:1.0 \
sysbench \
--threads=2 \
--time=10 \
--db-driver="mysql" \
--mysql-host="container_postgresql" \
--mysql-port=5432 \
--mysql-user="testuser" \
--mysql-password="testpass" \
--mysql-db="testdb" \
--tables=10 \
--table-size=100000 \
oltp_read_write cleanup;
```


## Test Performance by grafana/k6

### grafana/k6 test Health Check
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_bun \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_bun_health_check.js
```

### grafana/k6 test Insert Create user
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_bun \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_bun_create_user.js
```

### grafana/k6 test Select Get user by id
```bash
docker run \
--name container_k6 \
--rm \
-it \
--network global_bun \
-v ./k6/:/k6/ \
grafana/k6:1.1.0 \
run /k6/k6_bun_get_user_by_id.js
```

### check entrypoint grafana/k6
```bash
docker run \
--name container_k6 \
--rm \
-it \
--entrypoint \
/bin/sh grafana/k6:1.1.0
```


## Stop the Application

### Truncate table users
```bash
docker exec -i container_postgresql sh -c "PGPASSWORD='testpass' psql -U testuser -d testdb -c '
Truncate testdb.users;"
```

### Delete table users
```bash
docker exec -i container_postgresql sh -c "PGPASSWORD='testpass' psql -U testuser -d testdb -c '
DELETE FROM testdb.users;"
```

### Stop the Application
```bash
docker compose down
```