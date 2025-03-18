
import { Router } from 'express';
import { storage } from '../storage';
import { requireAdmin } from '../middleware/roleAuth';

const router = Router();

// Protected admin routes
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = Array.from(storage.getAllUsers().values());
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const users = storage.getAllUsers();
    const transactions = await storage.getTransactionsSummary();
    
    res.json({
      success: true,
      stats: {
        totalUsers: users.size,
        ...transactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching stats" });
  }
});

export default router;
