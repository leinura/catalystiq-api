import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const ADMIN_KEY = process.env.ADMIN_KEY || 'catalystiq_admin_2026';

// GET all track records
router.get('/', async (req: Request, res: Response) => {
  try {
    const records = await prisma.trackRecord.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const stats = {
      total: records.length,
      wins: records.filter(r => r.result === 'win').length,
      losses: records.filter(r => r.result === 'loss').length,
      open: records.filter(r => r.result === 'open').length,
      skips: records.filter(r => r.result === 'skip').length,
    };

    const winRate = stats.total > 0
      ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
      : 0;

    res.json({
      success: true,
      stats: { ...stats, winRate },
      data: records,
    });
  } catch (err) {
    console.error('Track record fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST new trade result (admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_KEY) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      symbol, direction, score, entry,
      sl, tp1, tp2, result, pips, note,
    } = req.body;

    if (!symbol || !direction || !score || !entry || !result) {
      res.status(400).json({
        success: false,
        message: 'symbol, direction, score, entry and result are required',
      });
      return;
    }

    const record = await prisma.trackRecord.create({
      data: {
        symbol,
        direction,
        score: parseInt(score),
        entry,
        sl: sl ? parseFloat(sl) : null,
        tp1: tp1 ? parseFloat(tp1) : null,
        tp2: tp2 ? parseFloat(tp2) : null,
        result,
        pips: pips || null,
        note: note || null,
      },
    });

    res.json({ success: true, data: record });
  } catch (err) {
    console.error('Track record create error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH update result (admin only)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_KEY) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { result, pips, note, closedAt } = req.body;

    const record = await prisma.trackRecord.update({
      where: { id: String(req.params.id) },
      data: {
        result,
        pips: pips || null,
        note: note || null,
        closedAt: closedAt ? new Date(closedAt) : new Date(),
      },
    });

    res.json({ success: true, data: record });
  } catch (err) {
    console.error('Track record update error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE a record (admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== ADMIN_KEY) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await prisma.trackRecord.delete({
      where: { id: String(req.params.id) },
    });

    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;