import { Router, Request, Response } from 'express';
import { instruments } from '../data/instruments';
import { getLayerBreakdown, getScenarioProbabilities } from '../services/scoringEngine';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { cat } = req.query;
  const result = cat
    ? instruments.filter(i => i.cat === cat)
    : instruments;

  res.json({
    success: true,
    count: result.length,
    updatedAt: new Date().toISOString(),
    data: result,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const inst = instruments.find(i => i.id === req.params.id);
  if (!inst) {
    res.status(404).json({ success: false, message: 'Instrument not found' });
    return;
  }

  const layers = getLayerBreakdown(inst);
  const scenarios = getScenarioProbabilities(inst);

  res.json({
    success: true,
    data: {
      ...inst,
      layers,
      scenarios,
    },
  });
});

export default router;