import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getLayerBreakdown, getScenarioProbabilities } from '../services/scoringEngine';

const router = Router();

/**
 * GET /api/instruments
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const cat = req.query.cat as string | undefined;

    const instruments = await prisma.instrument.findMany({
      where: cat ? { cat } : {},
      orderBy: {
        score: 'desc',
      },
    });

    res.json({
      success: true,
      count: instruments.length,
      updatedAt: new Date().toISOString(),
      data: instruments,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch instruments',
    });
  }
});

/**
 * GET /api/instruments/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {

    const id = req.params.id as string;

    const instrument = await prisma.instrument.findUnique({
      where: {
        id,
      },
    });

    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: 'Instrument not found',
      });
    }

    const layers = getLayerBreakdown(instrument as any);
    const scenarios = getScenarioProbabilities(instrument as any);

    res.json({
      success: true,
      data: {
        ...instrument,
        layers,
        scenarios,
      },
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: 'Server error',
    });

  }
});

export default router;