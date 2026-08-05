# Pharmacy Management System

A full-stack pharmacy management system built with **Spring Boot 3.2.5** (Java 17) backend and **React 18** (Vite) frontend, featuring JWT authentication, role-based access control, Indian GST compliance, and automated database backups.

## Tech Stack

### Backend
| Component | Technology |
|---|---|
| Framework | Spring Boot 3.2.5 |
| Language | Java 17 |
| Database | MySQL 8.0 |
| ORM | Spring Data JPA / Hibernate 6.4 |
| Migrations | Flyway 9.22 |
| Security | Spring Security + JWT (jjwt 0.12.5) |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Code Gen | Lombok |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 18.2 |
| Bundler | Vite 5.2 |
| UI Library | MUI Material 5.15 |
| Data Grid | MUI X DataGrid 6.19 |
| Charts | Recharts 2.12 |
| HTTP Client | Axios 1.6 |
| CSV Parsing | PapaParse 5.4 |
| Excel | SheetJS (xlsx) 0.18 |

## Features

- **Multi-Role Authentication** — ADMIN, PHARMACIST, SALESPERSON with JWT-based stateless auth
- **Medicine Inventory** — Full CRUD with batch numbers, rack numbers, expiry tracking, low-stock alerts
- **Sales Management** — Create sales, auto-deduct stock, GST calculation (CGST + SGST), invoice generation
- **Purchase Management** — Record purchases, auto-add stock, supplier & invoice tracking
- **Purchase Import** — Upload CSV/XLS/XLSX files, auto-map columns, editable preview, bulk import
- **Returns Processing** — Process returns with automatic stock restock and refund calculation
- **Reports** — Daily, weekly, monthly, yearly sales/purchase reports with export
- **Dashboard** — Real-time stats with sales charts, top medicines, expiry alerts
- **Database Backups** — Automated daily backups via mysqldump, download, email notifications, OneDrive upload
- **Medicine Active/Inactive** — Stop medicines from appearing in sales while preserving history
- **Optimistic Locking** — Version-based concurrency control on medicines and purchases
- **Indian GST Compliance** — Intra-state CGST + SGST split, configurable GST rates (0%, 5%, 12%, 18%, 28%)

## Prerequisites

- **Java 17** (JDK, not JRE)
- **Node.js 18+** and npm
- **MySQL 8.0** running on `localhost:3306`
- **Maven 3.8+**

## Database Setup

```sql
CREATE DATABASE IF NOT EXISTS pharmacy_db;
-- Tables are auto-created by Flyway migrations on first run
```

Default credentials (in `application.properties`):
- MySQL: `root` / `root`
- App admin: `admin` / `admin123`

## Getting Started

### Backend

```bash
cd backend
mvn clean package -DskipTests
java -jar target/pharmacy-backend-1.0.0.jar
```

Backend runs on **http://localhost:8080**

Swagger UI: http://localhost:8080/swagger-ui.html

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5174** (proxies `/api` to backend)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/users` | List all users |
| PUT | `/api/auth/users/{id}` | Update user |
| PUT | `/api/auth/users/{id}/toggle` | Enable/disable user |
| DELETE | `/api/auth/users/{id}` | Delete user |

### Medicines
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/medicines` | List all medicines |
| GET | `/api/medicines/{id}` | Get medicine by ID |
| POST | `/api/medicines` | Create medicine |
| PUT | `/api/medicines/{id}` | Update medicine (optimistic lock) |
| DELETE | `/api/medicines/{id}` | Delete medicine |
| GET | `/api/medicines/search?name=` | Search by name |
| GET | `/api/medicines/expiry-alerts?days=30` | Expiry alerts |
| GET | `/api/medicines/low-stock?threshold=0` | Low stock alerts |

### Sales
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sales` | Create sale (auto-deducts stock) |
| GET | `/api/sales` | List all sales |
| GET | `/api/sales/{id}` | Get sale by ID |
| GET | `/api/sales/date-range` | Sales in date range |
| GET | `/api/sales/recent` | Recent sales |
| GET | `/api/sales/export` | Export sales CSV |

### Purchases
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/purchases` | Create purchase (auto-adds stock) |
| GET | `/api/purchases` | List all purchases |
| GET | `/api/purchases/{id}` | Get purchase by ID |
| GET | `/api/purchases/date-range` | Purchases in date range |
| GET | `/api/purchases/export` | Export purchases CSV |

### Returns
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/returns` | Process return (restock + refund) |
| GET | `/api/returns` | List all returns |
| GET | `/api/returns/{id}` | Get return by ID |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/daily?date=` | Daily report |
| GET | `/api/reports/weekly?startDate=` | Weekly report |
| GET | `/api/reports/monthly?date=` | Monthly report |
| GET | `/api/reports/yearly?date=` | Yearly report |

### Backups
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/backup` | List all backups |
| POST | `/api/backup/create` | Trigger backup |
| GET | `/api/backup/download/{id}` | Download backup |
| DELETE | `/api/backup/{id}` | Delete backup |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Aggregated dashboard data |

## Role Permissions

| Feature | ADMIN | PHARMACIST | SALESPERSON |
|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ |
| Sales | ✅ | ✅ | ✅ |
| Purchases | ✅ | ✅ | ❌ |
| Import Purchase | ✅ | ❌ | ❌ |
| Returns | ✅ | ✅ | ✅ |
| Stock | ✅ | ✅ | ❌ |
| Medicines | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Alerts | ✅ | ✅ | ❌ |
| Users | ✅ | ❌ | ❌ |
| Backups | ✅ | ❌ | ❌ |

## Database Schema

15 Flyway migrations create the following tables:

| Table | Description |
|---|---|
| `roles` | User roles (ADMIN, PHARMACIST, SALESPERSON) |
| `users` | User accounts with BCrypt passwords |
| `user_roles` | Many-to-many user-role mapping |
| `medicines` | Medicine inventory with optimistic locking |
| `sales` | Sales transactions |
| `sales_items` | Individual items in a sale |
| `purchases` | Purchase records with optimistic locking |
| `returns` | Return transactions |
| `backup_history` | Backup audit trail |

## Project Structure

```
HSProject/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/pharmacy/
│       ├── config/          # Security, Backup config
│       ├── controller/      # REST controllers (9)
│       ├── dto/             # Data Transfer Objects
│       ├── entity/          # JPA entities (8)
│       ├── exception/       # Global exception handler
│       ├── repository/      # Spring Data repositories
│       ├── security/        # JWT filter, token provider
│       └── service/         # Business logic (10)
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/      # Layout, ProtectedRoute
│       ├── context/         # AuthContext (JWT + roles)
│       ├── pages/           # 12 page components
│       └── services/        # Axios API layer
└── backups/                 # Automated DB backups
```

## Configuration

Key properties in `backend/src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/pharmacy_db
spring.datasource.username=root
spring.datasource.password=root

# JWT
jwt.secret.key=<your-256-bit-secret>
jwt.expiration.ms=86400000

# Backup
backup.local-path=D:/Project/HSProject/backups
backup.mysqldump-path=C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe

# CORS
app.cors.allowed-origins=http://localhost:5174
```

## License

MIT
