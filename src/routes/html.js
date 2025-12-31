import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import {
  getPaste,
  isUnavailable,
  incrementViewCount
} from '../services/pasteService.js';
import { getNow } from '../utils/Time.js';

const router = Router();

// Helper to render HTML template
const renderTemplate = async (templateName, data) => {
  const filePath = path.join(process.cwd(), 'src/views', `${templateName}.html`);
  let template = await fs.readFile(filePath, 'utf8');
  
  for (const [key, value] of Object.entries(data)) {
    template = template.replace(new RegExp(`<%- *${key} *%>`, 'g'), value);
  }
  
  return template;
};

// GET / (create page)
router.get('/', async (req, res) => {
  const createHtml = await fs.readFile('src/views/create.html', 'utf8');
  res.status(200).send(createHtml);
});

// GET /p/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const now = getNow(req);

  const paste = await getPaste(id);
  if (!paste || isUnavailable(paste, now)) {
    const errorHtml = await fs.readFile('src/views/error.html', 'utf8');
    return res.status(404).send(errorHtml);
  }

  await incrementViewCount(id);

  // Get updated paste after view increment
  const updatedPaste = await getPaste(id);
  
  let remainingViews = null;
  if (updatedPaste.max_views != null) {
    const remaining = updatedPaste.max_views - updatedPaste.view_count;
    remainingViews = remaining > 0 ? remaining : 0;
  }

  const data = {
    id,
    safeContent: updatedPaste.content.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    url: `${req.protocol}://${req.get('host')}/p/${id}`,
    remainingViews,
    expiresAt: updatedPaste.expiresAt ? updatedPaste.expiresAt.toLocaleString() : null
  };

  const viewHtml = await renderTemplate('view.html', data);
  res.status(200).send(viewHtml);
});

export default router;