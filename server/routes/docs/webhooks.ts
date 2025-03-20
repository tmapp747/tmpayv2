/**
 * @swagger
 * components:
 *   schemas:
 *     DirectPayWebhook:
 *       type: object
 *       required:
 *         - refId
 *         - status
 *       properties:
 *         refId:
 *           type: string
 *           description: Reference ID from DirectPay (matches our transaction reference)
 *         status:
 *           type: string
 *           enum: [SUCCESS, PENDING, FAILED, CANCELLED]
 *           description: Payment status from DirectPay
 *         transactionAmount:
 *           type: number
 *           description: Transaction amount
 *         fee:
 *           type: number
 *           description: Transaction fee
 *         extra:
 *           type: object
 *           description: Additional transaction details
 *       example:
 *         refId: "ref_c6eb4249fe7eefde"
 *         status: "SUCCESS"
 *         transactionAmount: 100
 *         fee: 2.5
 *         extra: { "paymentMethod": "GCash" }
 * 
 *     SimpleWebhook:
 *       type: object
 *       required:
 *         - reference
 *         - status
 *       properties:
 *         reference:
 *           type: string
 *           description: Reference ID for the transaction
 *         status:
 *           type: string
 *           enum: [success, pending, failed, cancelled]
 *           description: Payment status
 *       example:
 *         reference: "ref_c6eb4249fe7eefde"
 *         status: "success"
 * 
 *     PaygramWebhook:
 *       type: object
 *       required:
 *         - invoiceCode
 *         - status
 *       properties:
 *         invoiceCode:
 *           type: string
 *           description: Invoice code from Paygram
 *         status:
 *           type: string
 *           enum: [paid, pending, expired, cancelled]
 *           description: Payment status from Paygram
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         currency:
 *           type: string
 *           description: Currency code
 *         referenceId:
 *           type: string
 *           description: Our reference ID for the transaction
 *       example:
 *         invoiceCode: "INV-123456"
 *         status: "paid"
 *         amount: 100
 *         currency: "PHPT"
 *         referenceId: "ref_c6eb4249fe7eefde"
 * 
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook endpoints for payment processors
 */

/**
 * @swagger
 * /webhook/direct-pay:
 *   post:
 *     summary: DirectPay webhook
 *     description: Webhook endpoint for DirectPay payment status updates
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DirectPayWebhook'
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Webhook processed successfully"
 *       400:
 *         description: Invalid webhook payload
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /webhook/simple:
 *   post:
 *     summary: Simple webhook
 *     description: Simple webhook endpoint for payment status updates
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SimpleWebhook'
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Webhook processed successfully"
 *       400:
 *         description: Invalid webhook payload
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /webhook/paygram:
 *   post:
 *     summary: Paygram webhook
 *     description: Webhook endpoint for Paygram payment status updates
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaygramWebhook'
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Webhook processed successfully"
 *       400:
 *         description: Invalid webhook payload
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */