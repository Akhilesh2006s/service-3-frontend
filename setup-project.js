import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Telugu Learning Project...');

// Create .env file for backend
const backendEnvPath = path.join(__dirname, 'server', '.env');
const backendEnvContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://192.168.1.7:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:3000,http://192.168.1.7:5173,http://192.168.1.7:8080

# MongoDB Atlas Connection (using in-memory for now)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/telugu-learning?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

if (!fs.existsSync(backendEnvPath)) {
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Created backend .env file');
} else {
  console.log('✅ Backend .env file already exists');
}

// Create .env file for frontend
const frontendEnvPath = path.join(__dirname, '.env');
const frontendEnvContent = `VITE_API_BASE_URL=http://192.168.1.7:5000/api
VITE_APP_NAME=Telugu Learning Platform
`;

if (!fs.existsSync(frontendEnvPath)) {
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Created frontend .env file');
} else {
  console.log('✅ Frontend .env file already exists');
}

// Check if node_modules exist
const backendNodeModules = path.join(__dirname, 'server', 'node_modules');
const frontendNodeModules = path.join(__dirname, 'node_modules');

if (!fs.existsSync(backendNodeModules)) {
  console.log('📦 Installing backend dependencies...');
  console.log('Run: cd server && npm install');
}

if (!fs.existsSync(frontendNodeModules)) {
  console.log('📦 Installing frontend dependencies...');
  console.log('Run: npm install');
}

console.log('\n📋 SETUP COMPLETE!');
console.log('\n🚀 To start the project:');
console.log('1. Backend: cd server && npm start');
console.log('2. Frontend: npm run dev');
console.log('\n🌐 Access URLs:');
console.log('- Frontend: http://localhost:5173');
console.log('- Backend: http://192.168.1.7:5000');
console.log('\n👤 Test Users:');
console.log('- Trainer: amenityforge@gmail.com');
console.log('- Evaluator: akhileshsamayamanthula@gmail.com');
console.log('- Learner: amenityforge1@gmail.com');
console.log('\n🔑 All passwords are: password123'); 