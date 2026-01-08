<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=00D4AA&center=true&vCenter=true&width=435&lines=Mediquick:+AI-Powered+Medicine+Delivery;Full-Stack+MERN+%2B+Flask+Chatbot;MongoDB+%7C+Stripe+%7C+JWT;Live+on+Render" alt="Typing SVG" />

  <h1>Mediquick - Enterprise Health-Tech Platform</h1>

  <p>
    <a href="https://mediquick-pqv7.onrender.com/"><strong>Explore the Live Demo »</strong></a>
  </p>

  [![Live Demo](https://img.shields.io/badge/Demo-Live_on_Render-00D4AA?style=for-the-badge&logo=render)](https://mediquick-pqv7.onrender.com/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
  [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
</div>

---

## Executive Summary
Mediquick is a high-performance, full-stack e-commerce ecosystem tailored for the pharmaceutical industry. Beyond standard CRUD operations, it features a decoupled AI microservice for symptom-based consultations and a secure financial pipeline via Stripe. 

Built with the MERN stack, the project focuses on scalability, clean architectural boundaries, and production-grade security patterns.

## System Architecture
The application follows a Modular Monolith pattern for the core API, with a dedicated Python/Flask Microservice for AI processing to prevent blocking the Node.js event loop.



* **Frontend:** React 18 SPA with Tailwind CSS for optimized rendering and responsive UX.
* **Primary Backend:** Node.js/Express handling Business Logic, Auth, and Payments.
* **AI Service:** Flask-based proxy managing LLM prompt engineering and medical context.
* **Database:** MongoDB Atlas utilizing Aggregation Pipelines for high-speed catalog filtering.

---

## Key Technical Features

| Feature | Implementation Detail |
| :--- | :--- |
| **Identity Management** | Stateless JWT-based authentication with RBAC (Role-Based Access Control) for Users and Admins. |
| **AI Pharmacist** | Integrated Flask service providing real-time medicine suggestions based on user-described symptoms. |
| **Financial Pipeline** | Stripe Elements integration with secure Server-side Webhook validation for payment integrity. |
| **Inventory Engine** | Full Admin CRUD suite with real-time stock updates and order status management. |
| **Persistence** | Redux-Persist integration to maintain cart state across sessions and hardware failures. |

---

## Tech Stack

- **Frontend:** React 18, Redux Toolkit, Tailwind CSS, Axios, React Router 6
- **Backend:** Node.js, Express.js, Flask (Python)
- **Database:** MongoDB (Mongoose ODM)
- **Security:** JWT, Bcrypt, Helmet.js, CORS
- **Payments:** Stripe API
- **DevOps:** Render (CI/CD), Git

---

## Local Development Setup

### Prerequisites
* Node.js (v20+)
* Python (v3.10+)
* MongoDB Atlas Account

### 1. Clone and Install
```bash
git clone [https://github.com/AnuragGaonkar/ONLINE-MEDICINE-DELIVERY.git](https://github.com/AnuragGaonkar/ONLINE-MEDICINE-DELIVERY.git)
cd ONLINE-MEDICINE-DELIVERY
```

## Local Development Setup

### 2. Environment Variables
Create a `.env` file in the `/server` directory:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=sec_key
STRIPE_SECRET=secret_key
OPENAI_API_KEY=your_openai_key
```

### 3. Run the System

**Start Server:**
```bash
cd server
npm install
npm start
```

**Start Client:**
```bash
cd client
npm install
npm run dev
```

## Engineering Challenges and Resolutions

### Custom Rule-Based NLP Engine
* **Challenge**: Implementing a medical assistant without relying on expensive, non-deterministic external LLM APIs.
* **Resolution**: Engineered a custom NLP pipeline using **NLTK** and **FuzzyWuzzy**. Developed a state-aware session manager in Flask that tracks user intent (e.g., `ADD_TO_CART`, `SYMPTOMS`) and maintains context of the "last mentioned medicine" across a conversation, resulting in a lightweight, deterministic, and high-speed medical chatbot.

### The Race Condition Problem in Payments
* **Challenge**: Relying on the frontend to confirm a payment is insecure. A user could close the browser before the "Success" callback triggers, leading to a "Paid" order not being recorded.
* **Resolution**: Implemented **Stripe Webhooks**. The server listens for the `checkout.session.completed` event directly from Stripe's servers. This ensures the database is updated even if the user's connection drops.

### Reliable Order Confirmation (Email System)
* **Challenge**: Users need immediate confirmation of their order, but sending emails synchronously can slow down the checkout process.
* **Resolution**: Integrated an automated email trigger within the Stripe Webhook logic. Once the payment is verified, the system asynchronously dispatches a detailed order confirmation email, providing a reliable paper trail for the user.

### Performance Optimization via Microservices
* **Challenge**: Computational NLP tasks and database pings shouldn't block the primary e-commerce event loop.
* **Resolution**: Decoupled the AI logic into a dedicated **Flask Microservice**. This architecture allows the MERN backend to focus on high-speed transactions while the Python service handles string tokenization and fuzzy matching independently.

---

## Visuals and Demos

### System Architecture

<img src="public/Mediquick.png" alt="System Architecture Flow" width="100%"/>

### Video Walkthroughs

#### Desktop Experience
*Full-featured user journey including AI consultation, product search, and secure checkout.*
> [!IMPORTANT]
> **[Watch High-Resolution Desktop Demo](public/video/mediquick_desktop.mp4)**

#### Mobile Responsive Design
*Demonstrating fluid UI/UX transitions and mobile-first pharmaceutical browsing.*
> [!IMPORTANT]
> **[Watch High-Resolution Mobile Demo](public/video/mediquick_mobile.mp4)**

---

## Contact and Links
**Anurag Gaonkar** - [GitHub](https://github.com/AnuragGaonkar) | [LinkedIn](www.linkedin.com/in/anurag-gaonkar-68a463261)

Project Link: https://github.com/AnuragGaonkar/ONLINE-MEDICINE-DELIVERY
