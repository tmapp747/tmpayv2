/**
 * Admin Routes for 747 Casino E-Wallet Platform
 * 
 * These routes are protected by admin-level authentication and provide
 * administrative functionality for managing users, transactions, and system settings.
 */

import { Router, Request, Response } from "express";
import { db } from "../../db";
import { storage } from "../../storage";
import { roleAuthMiddleware } from "../middleware";
import { cleanupOrphanedRecords } from "../../cleanupOrphans";
import { processPendingCasinoTransfers } from "../../../process-pending-transfers";
import { resourceActionMap } from "@shared/schema";

const router = Router();

// Get all users with role-based access control
router.get("/users", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const users = Array.from(storage.getAllUsers().values());
    
    // Admin users can see all users, but agents can only see their own downlines
    const filteredUsers = req.user?.role === 'admin'
      ? users
      : users.filter(user => user.immediateManager === req.user?.username);
    
    return res.json({
      success: true,
      users: filteredUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        statusReason: user.statusReason,
        lastLogin: user.lastLoginAt,
        casinoUsername: user.casinoUsername,
        casinoClientId: user.casinoClientId,
        casinoBalance: user.casinoBalance,
        topManager: user.topManager,
        immediateManager: user.immediateManager,
        isVip: user.isVip,
        vipLevel: user.vipLevel,
        vipSince: user.vipSince,
        referredBy: user.referredBy
      }))
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get role permissions
router.get("/roles/permissions", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const roles = ['admin', 'agent', 'player'];
    const result: Record<string, string[]> = {};
    
    for (const role of roles) {
      result[role] = await storage.getRolePermissions(role);
    }
    
    // Include available resources and actions from the schema
    const resources = Object.keys(resourceActionMap);
    const resourceActions: Record<string, string[]> = {};
    
    for (const resource of resources) {
      resourceActions[resource] = resourceActionMap[resource as keyof typeof resourceActionMap];
    }
    
    return res.json({
      success: true,
      rolePermissions: result,
      availableResources: resources,
      resourceActions
    });
  } catch (error) {
    console.error('Error getting role permissions:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update role permissions
router.post("/roles/permissions/:role", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permissions must be an array' });
    }
    
    if (!['admin', 'agent', 'player'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    await storage.updateRolePermissions(role, permissions);
    
    return res.json({
      success: true,
      message: `Updated permissions for ${role} role`,
      role,
      permissions
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update user role
router.post("/users/:userId/role", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    
    if (!['admin', 'agent', 'player'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await storage.updateUserRole(userId, role as any);
    
    return res.json({
      success: true,
      message: `Updated role for user ${user.username}`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        userType: updatedUser.casinoUserType
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update user status
router.post("/users/:userId/status", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { status, reason } = req.body;
    
    if (!['active', 'suspended', 'inactive', 'pending_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await storage.updateUserStatus(userId, status as any, reason);
    
    return res.json({
      success: true,
      message: `Updated status for user ${user.username}`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        statusReason: updatedUser.statusReason
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Manage manual payment status
router.post("/manual-payment/:id/status", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    if (!['pending', 'processing', 'payment_completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const manualPayment = await storage.getManualPayment(paymentId);
    if (!manualPayment) {
      return res.status(404).json({ success: false, message: 'Manual payment not found' });
    }
    
    // Update manual payment status
    const updatedPayment = await storage.updateManualPayment(paymentId, {
      status,
      adminId: req.user?.id || null,
      adminNotes: notes || null
    });
    
    // If payment is completed, update transaction status
    if (status === 'payment_completed') {
      const transaction = await storage.getTransaction(manualPayment.transactionId);
      if (transaction) {
        await storage.updateTransactionStatus(
          transaction.id,
          'payment_completed',
          transaction.reference,
          { manuallyCompleted: true, completedBy: req.user?.username }
        );
      }
    }
    
    return res.json({
      success: true,
      message: `Updated manual payment status to ${status}`,
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Error updating manual payment status:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all manual payments
router.get("/manual-payments", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const manualPayments = Array.from(storage.getAllManualPayments().values());
    
    // Enrich with user information
    const enrichedPayments = await Promise.all(manualPayments.map(async (payment) => {
      const user = await storage.getUser(payment.userId);
      const transaction = await storage.getTransaction(payment.transactionId);
      
      return {
        ...payment,
        username: user?.username || 'Unknown',
        amount: payment.amount,
        createdAt: payment.createdAt,
        method: payment.paymentMethod,
        status: payment.status,
        notes: payment.notes,
        adminNotes: payment.adminNotes,
        proofImageUrl: payment.proofImageUrl,
        reference: payment.reference,
        transactionStatus: transaction?.status || 'unknown'
      };
    }));
    
    return res.json({
      success: true,
      payments: enrichedPayments
    });
  } catch (error) {
    console.error('Error getting manual payments:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all transactions with admin filtering capability
router.get("/transactions", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const { userId, type, method, status, startDate, endDate, limit, offset } = req.query;
    
    const options: any = {};
    
    if (type) options.type = type as string;
    if (method) options.method = method as string;
    if (status) options.status = status as string;
    if (limit) options.limit = parseInt(limit as string);
    if (offset) options.offset = parseInt(offset as string);
    
    if (startDate) {
      options.startDate = new Date(startDate as string);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate as string);
    }
    
    const userIdNum = userId ? parseInt(userId as string) : 0;
    const transactions = await storage.getTransactionsByUserId(userIdNum, options);
    
    // Get summary statistics
    const summary = await storage.getTransactionsSummary(options);
    
    return res.json({
      success: true,
      transactions,
      summary
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin dashboard summary data
router.get("/dashboard", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const users = Array.from(storage.getAllUsers().values());
    const transactions = Array.from(storage.getAllUsers().values());
    
    // QR payments
    const activeQrPayments = Array.from(storage.getAllQrPayments().values())
      .filter(qp => qp.status === 'pending' || qp.status === 'processing');
    
    // Telegram payments
    const activeTelegramPayments = Array.from(storage.getAllTelegramPayments().values())
      .filter(tp => tp.status === 'pending' || tp.status === 'processing');
    
    // Manual payments requiring approval
    const pendingManualPayments = Array.from(storage.getAllManualPayments().values())
      .filter(mp => mp.status === 'pending');
    
    return res.json({
      success: true,
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        playerCount: users.filter(u => u.role === 'player').length,
        agentCount: users.filter(u => u.role === 'agent').length,
        adminCount: users.filter(u => u.role === 'admin').length,
        totalTransactions: transactions.length,
        activeQrPayments: activeQrPayments.length,
        activeTelegramPayments: activeTelegramPayments.length,
        pendingManualPayments: pendingManualPayments.length
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Maintenance endpoints
router.post("/payments/cleanup-expired", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    await cleanupOrphanedRecords();
    return res.json({
      success: true,
      message: 'Cleaned up expired/orphaned payments'
    });
  } catch (error) {
    console.error('Error cleaning up expired payments:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post("/payments/process-pending-transfers", roleAuthMiddleware(['admin']), async (req: Request, res: Response) => {
  try {
    const result = await processPendingCasinoTransfers();
    return res.json({
      success: true,
      message: 'Processed pending casino transfers',
      result
    });
  } catch (error) {
    console.error('Error processing pending transfers:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;