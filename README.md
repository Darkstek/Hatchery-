Hatchery Monitor 🐣
Full-stack IoT application for real-time monitoring of chicken egg incubators. Built as a university semester project.
Features

Real-time temperature monitoring with historical chart
Automatic alerts for out-of-range temperatures (36.5°C – 38.5°C)
Gateway status monitoring (online/offline)
Secure REST API with JWT authentication and API key authorization
Responsive dashboard accessible from any device

Tech Stack
Frontend: React.js, Recharts, Axios — deployed on Vercel
Backend: Node.js, Express.js — deployed on Render.com
Database: MongoDB Atlas
IoT: HARDWARIO Core Module, Node-RED gateway on Raspberry Pi
Architecture
IoT Node → Gateway (Node-RED / RPi) → REST API (HTTPS) → Cloud Backend → React Dashboard
Live Demo
[hatchery.vercel.app](https://hatchery-five.vercel.app)
