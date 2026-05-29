import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import projectionRoutes from './routes/projections.js';
import schwabRoutes from './routes/schwab.js';
import marketRoutes from './routes/market.js';

const app = express();
const PORT = process.env.PORT || 3001;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    google: Boolean(process.env.GOOGLE_CLIENT_ID),
    schwab: Boolean(process.env.SCHWAB_CLIENT_ID),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projections', projectionRoutes);
app.use('/api/schwab', schwabRoutes);
app.use('/api/market', marketRoutes);

app.listen(PORT, () => {
  console.log(`SnowballR API running on http://localhost:${PORT}`);
});
