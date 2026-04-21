# Lab Equipment Borrowing System (MERN + AWS RDS Ready)

A full-stack borrowing platform for engineering labs using React + Tailwind on the frontend and Node.js/Express + Prisma on the backend.

## 1. Tech Stack

- Frontend: React (Vite), Tailwind CSS, Shadcn-inspired reusable UI components
- Backend: Express REST API with clean architecture (routes, controllers, services)
- Database: PostgreSQL via Prisma ORM (works with AWS RDS PostgreSQL)
- AWS Integration: SNS email notifications using AWS SDK v3

## 2. Project Structure

```text
CCL Mini Project/
  frontend/
    src/
      App.js
      Dashboard.jsx
      AdminPanel.jsx
      components/ui/
      lib/
  backend/
    src/
      routes/
      controllers/
      services/
      config/
      middleware/
      server.js
    prisma/
      schema.prisma
      seed.js
    aws/
      iam-ec2-sns-rds-policy.json
    .env.example
```

## 3. Features

### Student Dashboard
- View available equipment in a responsive grid
- Request items (UI flow prepared)
- Track due dates and statuses

### Admin Panel
- View pending/approved/overdue requests
- Approve or reject requests
- Trigger overdue SNS alert actions

## 4. Local Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

### Backend

```bash
cd backend
npm install
copy .env.example .env
```

Update .env values:
- DATABASE_URL
- AWS_REGION
- AWS_SNS_TOPIC_ARN
- APP_BASE_URL

Run Prisma migration + generate client:

```bash
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js
npm run dev
```

API base: http://localhost:4000/api

Health check: http://localhost:4000/api/health

## 5. Database Schema

Implemented in backend/prisma/schema.prisma with:

- User
  - id, name, email, role (STUDENT/ADMIN)
- Equipment
  - id, name, category, description, totalQuantity, availableQuantity, isActive
- Request
  - id, userId, equipmentId, status, requestedFrom, requestedTo, approvedBy, approvedAt, returnedAt

MySQL option:
- Current Prisma datasource uses PostgreSQL for AWS RDS PostgreSQL.
- To use AWS RDS MySQL, change in schema.prisma:
  - provider = "mysql"
- Update DATABASE_URL format in .env:
  - mysql://db_user:db_password@rds-endpoint.amazonaws.com:3306/lab_borrowing

## 6. AWS SNS Integration

Implemented in backend/src/services/notificationService.js:

- sendApprovalNotification(...)
- sendOverdueNotification(...)

SNS message flow:
1. Admin approves request -> API updates request status
2. Backend publishes approval email event to SNS topic
3. Admin marks overdue -> API marks status OVERDUE
4. Backend publishes overdue email event to SNS topic

Tip:
- For direct email delivery, subscribe email endpoints to your SNS topic in AWS Console.

## 7. IAM Policy for EC2 Instance Role

Suggested policy file:
- backend/aws/iam-ec2-sns-rds-policy.json

This grants:
- sns:Publish and sns:GetTopicAttributes for your topic
- rds:DescribeDBInstances and rds:DescribeDBClusters for metadata checks

Important:
- Actual DB access to RDS is enforced via security groups, DB credentials, and network path, not IAM alone (for normal password auth).

## 8. Deploy Backend on AWS EC2 with PM2 + Nginx

### Step 1: Launch EC2

1. Launch Ubuntu 22.04 EC2 instance.
2. Attach IAM role containing SNS/RDS policy.
3. Security Group inbound rules:
   - 22 (SSH) from your IP
   - 80 (HTTP) from 0.0.0.0/0
   - 443 (HTTPS) from 0.0.0.0/0 (optional)

### Step 2: Connect and Install Runtime

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

### Step 3: Deploy Backend Code

```bash
git clone <your-repo-url>
cd "CCL Mini Project/backend"
npm install
cp .env.example .env
nano .env
```

Put production values in .env:
- DATABASE_URL with RDS endpoint
- AWS_REGION and AWS_SNS_TOPIC_ARN
- APP_BASE_URL with your frontend URL

### Step 4: Run Prisma Migrations in Production

```bash
npx prisma generate
npx prisma migrate deploy
```

### Step 5: Start API with PM2

```bash
pm2 start src/server.js --name lab-borrowing-api
pm2 save
pm2 startup
```

Test local on EC2:

```bash
curl http://localhost:4000/api/health
```

### Step 6: Configure Nginx Reverse Proxy

Create Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/lab-borrowing-api
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain-or-ec2-ip;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/lab-borrowing-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Now API is reachable via:
- http://your-domain-or-ec2-ip/api/health

### Step 7: (Optional) HTTPS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 9. API Endpoints

- GET /api/health
- GET /api/equipment
- POST /api/equipment
- PATCH /api/equipment/:id
- DELETE /api/equipment/:id
- GET /api/requests
- POST /api/requests
- PATCH /api/requests/:id/approve
- PATCH /api/requests/:id/reject
- PATCH /api/requests/:id/overdue

## 10. Future Improvements

- Authentication with JWT/Cognito
- Role-based route protection middleware
- Real request forms wired to backend from frontend buttons
- Cron job for automatic overdue scanning and SNS reminders
- Add tests (Jest + Supertest + React Testing Library)
