import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import frontDeskRoutes from './routes/frontdesk.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import sharedRoutes from './routes/shared.routes.js';
import visitRoutes from './routes/visit.routes.js';
import labRoutes from './routes/lab.routes.js';
import portalRoutes from './routes/portal.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/shared', sharedRoutes);
app.use('/api', frontDeskRoutes); // Mounts /patients at root /api
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/portal', portalRoutes);

// Shared Patient Routes (if needed globally)
// app.use('/api/patients', patientRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date(),
        version: '1.0.0-enterprise'
    });
});

app.listen(PORT, () => {
    console.log(`HMS Server running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
