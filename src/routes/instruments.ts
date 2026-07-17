import { Router, Request, Response } from 'express';
import { instruments } from '../data/instruments';
import { getLayerBreakdown, getScenarioProbabilities } from '../services/scoringEngine';
import { newsSummaries } from '../services/newsSummaries';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { cat } = req.query;
  const result = cat
    ? instruments.filter(i => i.cat === cat)
    : instruments;

  const enriched = result.map(i => ({
    ...i,
    description: newsSummaries[i.id] || (i as any).description,
  }));

  res.json({
    success: true,
    count: enriched.length,
    updatedAt: new Date().toISOString(),
    data: enriched,
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
      description: newsSummaries[inst.id] || (inst as any).description,
      layers,
      scenarios,
    },
  });
});

export default router;