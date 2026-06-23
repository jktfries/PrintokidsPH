# PrintokidsPH
The central hub for our codebase for the development of the website.

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
* **Frontend:** HTML5, Bootstrap 4, Tailwind CSS, JavaScript, XML, XSLT, XSD
* **Backend:** PHP
* **Database:** MySQL (Relational Database)
* **Design/Prototyping:** Wireframes & ERD provided in the `/docs` folder.

---

## Repo Structure
To avoid merge conflicts, please only work within the folder assigned to your current task:

* `/admin` - Secure backend pages (Dashboard, Inventory CRUD, Order Management).
* `/client` - Customer-facing portal (Shop, Customization, Event Booth Booking).
* `/logic` - Pure PHP processing scripts (Authentication, Auto-deduction, Queries).
* `/includes` - Reusable components (Tailwind headers, footers, database config).
* `/assets` - Static files (Compiled CSS, custom JS, images, logos).
* `/docs` - Project proposal, ERD, and wireframes for reference.

---

## Local Setup Instructions
To run this project on your local machine (using XAMPP/WAMP):

1. **Clone the repository** into your `htdocs` or `www` folder. 
2. **Database Setup:** * Open phpMyAdmin.
   * Create a new database named `printokids_db`.
   * Import the SQL schema file located in `/docs` (once generated).
3. **Configuration:**
   * Go to the `/includes` folder.
   * Copy `config.example.php` and rename it to `config.php`.
   * Update the credentials in `config.php` to match your local database (e.g., root, no password). **Never push `config.php` to GitHub.**

---

## Team Workflow (CRITICAL)
Please **DO NOT** download the repository as a `.zip` file or manually upload files via the website. Use GitHub Desktop or the command line.

1. **Pull Before You Code:** Always click `Fetch Origin` -> `Pull` in GitHub Desktop before starting your work to ensure you have everyone else's latest updates.
2. **Commit Often:** Don't wait until the end of the week to save your work. Make small, frequent commits with clear descriptions (e.g., *"Styled the checkout page button"* or *"Fixed inventory deduction query"*).
3. **Push to Main:** Once your feature is working locally, click `Push Origin` to share it with the group. 
4. **Communicate:** If you are about to make massive changes to core files (like `header.php`), message the group chat first so nobody overwrites your work.
