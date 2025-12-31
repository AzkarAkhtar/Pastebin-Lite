import { Router } from 'express';
import { healthCheck } from '../services/pasteService.js';

const router = Router();

router.get('/healthz', async (req, res) => {
  try {
    const isHealthy = await healthCheck();
    res.status(200).json({ ok: isHealthy });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'persistence_unavailable' });
  }
});

export default router;