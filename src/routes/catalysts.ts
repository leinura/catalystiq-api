import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const FALLBACK_CATALYSTS = [
  {
    id: '1',
    title: 'Iran peace deal SIGNED — Hormuz strait reopening confirmed',
    impact: 'HIGH',
    direction: 'bear',
    detail: 'Trump signed interim agreement June 19. Hormuz reopening. Oil fell 8.5%. Gold lost war premium.',
    affects: 'WTI Oil · Brent · XAU/USD · XAG/USD',
    publishedAt: new Date('2026-06-19'),
  },
  {
    id: '2',
    title: 'FOMC hawkish dot plot — 9 of 18 officials project rate hike',
    impact: 'HIGH',
    direction: 'bear',
    detail: 'Fed held 3.50–3.75% but dot plot shocked markets. Median year-end rate moved to 3.8%. USD surged.',
    affects: 'ALL instruments',
    publishedAt: new Date('2026-06-18'),
  },
  {
    id: '3',
    title: 'BoJ hiked 25bps to 1.0% — highest since 1995',
    impact: 'HIGH',
    direction: 'bear',
    detail: 'BoJ raised rates. JPY surging. USDJPY fell from 158.87 to 154.80. Carry trade unwinding.',
    affects: 'USD/JPY · EUR/JPY · GBP/JPY',
    publishedAt: new Date('2026-06-18'),
  },
];

router.get('/', async (req: Request, res: Response) => {
  try {
    const dbCatalysts = await prisma.catalyst.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    if (dbCatalysts.length > 0) {
      res.json({
        success: true,
        count: dbCatalysts.length,
        source: 'ai',
        data: dbCatalysts,
      });
    } else {
      res.json({
        success: true,
        count: FALLBACK_CATALYSTS.length,
        source: 'fallback',
        data: FALLBACK_CATALYSTS,
      });
    }
  } catch (err) {
    console.error('Catalysts fetch error:', err);
    res.json({
      success: true,
      count: FALLBACK_CATALYSTS.length,
      source: 'fallback',
      data: FALLBACK_CATALYSTS,
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, impact, direction, detail, affects } = req.body;
    if (!title || !impact || !direction || !detail || !affects) {
      res.status(400).json({ success: false, message: 'All fields required' });
      return;
    }
    const catalyst = await prisma.catalyst.create({
      data: { title, impact, direction, detail, affects },
    });
    res.json({ success: true, data: catalyst });
  } catch (err) {
    console.error('Catalyst create error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.catalyst.delete({
      where: { id: String(req.params.id) },
    });
    res.json({ success: true, message: 'Catalyst deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;