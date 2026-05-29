import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listProjections,
  createProjection,
  deleteProjection,
} from '../db.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  res.json({ projections: listProjections(req.user.id) });
});

router.post('/', requireAuth, (req, res) => {
  const {
    name,
    etfTicker,
    initialDeposit,
    yearsOfGrowth,
    contributionAmount,
    contributionFrequency,
    estimatedRate,
    compareTicker,
  } = req.body;

  if (!etfTicker || yearsOfGrowth == null) {
    return res.status(400).json({ error: 'etfTicker and yearsOfGrowth are required' });
  }

  const projection = createProjection(req.user.id, {
    name: name || `${etfTicker} projection`,
    etfTicker,
    initialDeposit: Number(initialDeposit) || 0,
    yearsOfGrowth: Number(yearsOfGrowth) || 1,
    contributionAmount: Number(contributionAmount) || 0,
    contributionFrequency: contributionFrequency || 'monthly',
    estimatedRate: Number(estimatedRate) || 0,
    compareTicker: compareTicker || null,
  });

  res.status(201).json({ projection });
});

router.delete('/:id', requireAuth, (req, res) => {
  const deleted = deleteProjection(req.user.id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Projection not found' });
  }
  res.json({ ok: true });
});

export default router;
