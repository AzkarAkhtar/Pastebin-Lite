import { Router } from 'express';
import {
  createPaste,
  getPaste,
  isUnavailable,
  incrementViewCount
} from '../services/pasteService.js';
import { getNow } from '../utils/Time.js';

const router = Router();

// POST /api/pastes
router.post('/pastes', async (req, res) => {
  const { content, ttl_seconds, max_views } = req.body || {};

  if (typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content_required' });
  }

  if (ttl_seconds !== undefined) {
    if (!Number.isInteger(ttl_seconds) || ttl_seconds < 1) {
      return res.status(400).json({ error: 'invalid_ttl_seconds' });
    }
  }

  if (max_views !== undefined) {
    if (!Number.isInteger(max_views) || max_views < 1) {
      return res.status(400).json({ error: 'invalid_max_views' });
    }
  }

  try {
    const now = getNow(req);
    const paste = await createPaste({ content, ttl_seconds, max_views }, now);

    const host = req.get('host');
    const protocol = req.protocol || 'https';
    const url = `${protocol}://${host}/p/${paste.id}`;

    res.status(201).json({ id: paste.id, url });
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /api/pastes/:id
router.get('/pastes/:id', async (req, res) => {
  const { id } = req.params;
  const now = getNow(req);

  const paste = await getPaste(id);
  if (!paste || isUnavailable(paste, now)) {
    return res.status(404).json({ error: 'not_found' });
  }

  await incrementViewCount(id);

  // Fetch updated paste to get new view_count
  const updatedPaste = await getPaste(id);
  let remainingViews = null;
  if (updatedPaste.max_views != null) {
    const remaining = updatedPaste.max_views - updatedPaste.view_count;
    remainingViews = remaining > 0 ? remaining : 0;
  }

  res.status(200).json({
    content: updatedPaste.content,
    remaining_views: remainingViews,
    expires_at: updatedPaste.expiresAt ? updatedPaste.expiresAt.toISOString() : null
  });
});

export default router;