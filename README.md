echo "# NeuroFleetX - Backend Setup Guide

This backend is built with **Spring Boot + MySQL**.  
Follow these steps carefully to set it up on your local system.

---

## 🔗 Frontend Live Link  
The deployed frontend is available here:  
**https://neuro-fleet-x.vercel.app/**  

---

## 1️⃣ Prerequisites
- Install **Java 17+**  
- Install **Maven** (or use IntelliJ/VS Code with Maven support)  
- Install **MySQL**  

---

## 2️⃣ Database Setup
1. Open MySQL and create a database:
   \`\`\`sql
   CREATE DATABASE fleet_management;
   \`\`\`

2. (Optional) Import schema/data if someone provides you a dump file:
   \`\`\`bash
   mysql -u root -p fleet_management < db_dump.sql
   \`\`\`

---

## 3️⃣ Application Configuration

Create the config file at:
\`\`\`
src/main/resources/application.properties
\`\`\`

Use the below example and update with your **own credentials**:  

\`\`\`properties
spring.datasource.url=jdbc:mysql://localhost:3306/neurofleetx
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
\`\`\`

⚠️ **Important:** Do **NOT** commit real usernames/passwords. Each developer must set their own.

---

## 4️⃣ Run the Backend

Start the Spring Boot backend with:
\`\`\`bash
mvn spring-boot:run
\`\`\`

The server will be available at:
\`\`\`
http://localhost:8001
\`\`\`

---

## 5️⃣ Branching Workflow (Git)

1. Clone the repo:
   \`\`\`bash
   git clone https://github.com/Subhadip956425/NeuroFleetX.git
   cd NeuroFleetX
   \`\`\`

2. Create your own branch:
   \`\`\`bash
   git checkout -b yourname-branch
   git push origin yourname-branch
   \`\`\`

3. Add, commit, and push your code:
   \`\`\`bash
   git add .
   git commit -m \"Added backend code\"
   git push origin yourname-branch
   \`\`\`

---

## 6️⃣ Common Issues

- **Database connection fails?**
  - Make sure MySQL is running  
  - Verify username/password in \`application.properties\`  
  - Check that database \`neurofleetx\` exists  

---

## 7️⃣ Frontend

Frontend setup instructions will be added later in the **frontend repo/folder**.

---

## 🗂 Database Export/Import

To share your DB schema & data, use:

- **Export DB** (create \`db_dump.sql\`):
  \`\`\`bash
  mysqldump -u root -p fleet_management > db_dump.sql
  \`\`\`

- **Import DB** (restore someone’s dump):
  \`\`\`bash
  mysql -u root -p fleet_management < db_dump.sql
  \`\`\`

---
" > README.md
