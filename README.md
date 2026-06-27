# PrintokidsPH

"A dynamic, automated B2C web application with a centralized database system developed for **Printokids PH**, a customized printing and gifting business. This system eliminates manual order processing bottlenecks by integrating interactive event bookings, product customization, and an automated inventory deduction system."

### Project Context
**Course:** ITS122P (Web Systems and Technologies 2)  
**Institution:** Mapúa University  
**Team (Group 1):**
* Franco Emmanuel T. Castillo
* Fiona Mykee R. Enriquez
* Jose II R. Del Carmen
* Josel Henri L. Caballero
* Joshua M. Naive
* Vernadith C. Senin

---

## Stack
* **Frontend:** HTML5, Bootstrap 5.1, Vanilla JavaScript
* **Backend:** PHP 8 (PDO/MySQL)
* **Database:** MySQL via XAMPP
* **Design/Prototyping:** Wireframes & ERD in `/docs`

---

## Repo Structure

```
PrintokidsPH/
├── admin/
│   ├── admin_login/index.html        ← Admin login page
│   └── admin_dashboard/
│       ├── admin_index.html          ← Admin dashboard (all tabs)
│       ├── admin_dashboard.js
│       └── admin_styles.css
├── api/                              ← PHP REST endpoints (PDO)
│   ├── auth.php                      ← Login, register, logout, session check
│   ├── products.php                  ← Product catalog (client-facing)
│   ├── inventory.php                 ← Stock management (admin)
│   ├── product_orders.php            ← Product orders + stock deduction
│   ├── orders.php                    ← Event bookings
│   ├── event_bookings.php            ← Event booking management (admin)
│   ├── customers.php                 ← Customer CRUD (admin)
│   ├── staff.php                     ← Staff CRUD (admin)
│   ├── dashboard.php                 ← Dashboard metrics (admin)
│   ├── newsletter.php                ← Newsletter subscriptions
│   ├── services.php                  ← Services reference data
│   └── upload.php                    ← Image upload for customization
├── client/
│   ├── index.html                    ← Homepage / shop
│   ├── styles.css                    ← Shared stylesheet
│   ├── auth.js                       ← Sign-in, sign-up, session management
│   ├── cart.js                       ← Shopping cart + checkout
│   ├── products.js                   ← Product grid + filters
│   ├── images/                       ← Client images and logos
│   ├── product_details/index.html    ← Product detail + customization page
│   └── my_account/index.html         ← Customer account, orders, bookings
├── database/
│   └── printokidsph_db.sql           ← Complete schema (16 tables + seed data)
├── docs/                             ← Project proposal, ERD, wireframes
├── includes/
│   ├── config.example.php            ← Database config template
│   └── config.php                    ← Your local config (gitignored — never commit)
├── logic/
│   └── seed_db.php                   ← DB connectivity check script
└── uploads/                          ← Customer design uploads (gitignored)
```

---

## Local Setup Instructions

### 1. Clone the repository
Clone into your XAMPP `htdocs` folder:
```
C:\xampp\htdocs\PrintokidsPH\
```
The project will be accessible at: `http://localhost/PrintokidsPH/`

### 2. Database setup
1. Open phpMyAdmin (`http://localhost/phpmyadmin`)
2. Create a new database named **`printokidsph_db`**
3. Select the database, go to **Import**, and import `database/printokidsph_db.sql`
4. This creates all 16 tables and seeds them with test data

### 3. Configuration
1. Go to the `/includes` folder
2. Copy `config.example.php` and rename the copy to `config.php`
3. Open `config.php` and update your credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'printokidsph_db');
   define('DB_USER', 'root');       // your MySQL username
   define('DB_PASS', '');           // your MySQL password (blank by default in XAMPP)
   ```
4. **Never push `config.php` to GitHub** — it is already in `.gitignore`

### 4. Access the project
| Page | URL |
|---|---|
| Client homepage | `http://localhost/PrintokidsPH/client/index.html` |
| Admin login | `http://localhost/PrintokidsPH/admin/admin_login/index.html` |
| Admin dashboard | `http://localhost/PrintokidsPH/admin/admin_dashboard/admin_index.html` |

**Default admin credentials:** Staff ID `1` / Password `admin1234`  
Change this after first login.

---

## Team Workflow

**DO NOT** download as a `.zip` or manually upload files via the GitHub website. Use GitHub Desktop or the command line.

1. **Pull before you code:** Always `Fetch Origin` → `Pull` before starting work
2. **Commit often:** Small, frequent commits with clear messages
3. **Push to main:** Once your feature works locally, push to share with the group
4. **Communicate:** Message the group before making large changes to shared files