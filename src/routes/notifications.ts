import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/register-token', async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      res.status(400).json({ success: false, message: 'userId and token required' });
      return;
    }
    await prisma.user.update({
      where: { id: String(userId) },
      data: { fcmToken: String(token) },
    });
    res.json({ success: true, message: 'Token registered' });
  } catch (err) {
    console.error('Register token error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/test', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Token required' });
      return;
    }
    console.log(`Test notification requested for token: ${token}`);
    res.json({ success: true, message: 'Test notification logged' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Notifications service running' });
});

export default router;