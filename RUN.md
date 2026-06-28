# VS Boutique - How to Run the Project

This file contains instructions for starting the backend API and admin web dashboard on your laptop.

You can feed this file to the **Antigravity** agent, and the agent can automatically run the installation and start the servers.

---

## 🚀 Step 1: Install Dependencies & Generate Prisma Client

To install all Node.js modules and generate the local Prisma Client (which connects to your database), run the following commands:

### 1. Install Backend Dependencies & Generate Client
```bash
cd backend
npm install
npx prisma generate
```

### 2. Install Web Panel Dependencies
```bash
cd ../web
npm install
```

---

## 🏃 Step 2: Start Development Servers

Once dependencies are installed, you can start the application servers.

### 1. Start the Backend API Server
In a terminal window, run:
```bash
cd backend
npm run dev
```
*The backend server will start at `http://localhost:3005`.*

### 2. Start the Admin Web Panel
In a new terminal window, run:
```bash
cd web
npm run dev
```
*The React web admin panel will start at `http://localhost:5173`.*

---

## 📱 Step 3: Run Mobile App (Optional)
If you want to run the Expo React Native mobile client:
```bash
cd mobile
npm install
npx expo start -c
```

---

## 🔧 Troubleshooting

### IP Address Configuration
If you run the app on a mobile device or need to connect from other devices on the local network:
1. Find your laptop's current local IP address by running `ipconfig` (Windows) or `ifconfig` (macOS).
2. Run the IP updater script from the root directory:
   ```bash
   node update-ip.js <your_current_ip>
   ```
   *(e.g., `node update-ip.js 192.168.1.15`)*
   *(Or run `node update-ip.js localhost` to point everything back to your own machine)*
