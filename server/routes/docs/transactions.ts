/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - type
 *         - amount
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           description: The transaction ID
 *         uuid:
 *           type: string
 *           format: uuid
 *           description: The transaction UUID
 *         userId:
 *           type: integer
 *           description: User ID associated with this transaction
 *         type:
 *           type: string
 *           enum: [deposit, withdrawal, transfer]
 *           description: Type of transaction
 *         amount:
 *           type: number
 *           description: Transaction amount
 *         currency:
 *           type: string
 *           enum: [PHP]
 *           description: Currency of transaction
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *           description: Current transaction status
 *         reference:
 *           type: string
 *           description: External reference ID
 *         description:
 *           type: string
 *           description: Transaction description
 *         metadata:
 *           type: object
 *           description: Additional transaction metadata
 *         gcashStatus:
 *           type: string
 *           description: GCash payment status
 *         casinoStatus:
 *           type: string
 *           description: Casino transfer status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Transaction creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Transaction last update timestamp
 *       example:
 *         id: 1
 *         uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         userId: 10
 *         type: "deposit"
 *         amount: 1000
 *         currency: "PHP"
 *         status: "completed"
 *         reference: "ref_1234567890"
 *         description: "GCash deposit"
 *         gcashStatus: "SUCCESS"
 *         casinoStatus: "completed"
 *         createdAt: "2023-01-01T00:00:00Z"
 *         updatedAt: "2023-01-01T00:05:00Z"
 *
 *     QrPayment:
 *       type: object
 *       required:
 *         - id
 *         - transactionId
 *       properties:
 *         id:
 *           type: integer
 *           description: The QR payment ID
 *         transactionId:
 *           type: integer
 *           description: Associated transaction ID
 *         qrCodeData:
 *           type: string
 *           description: QR code data or URL
 *         payUrl:
 *           type: string
 *           description: Payment URL for redirection
 *         provider:
 *           type: string
 *           description: Payment provider (e.g., GCash, PayMaya)
 *         status:
 *           type: string
 *           description: Payment status from provider
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: QR code expiration timestamp
 *       example:
 *         id: 1
 *         transactionId: 24
 *         qrCodeData: "https://example.com/qr/12345"
 *         payUrl: "https://pay.example.com/12345"
 *         provider: "GCash"
 *         status: "SUCCESS"
 *         expiresAt: "2023-01-01T01:00:00Z"
 * 
 *     GenerateQrRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           description: The amount to deposit
 *       example:
 *         amount: 100
 * 
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the operation was successful
 *         transaction:
 *           $ref: '#/components/schemas/Transaction'
 *         message:
 *           type: string
 *           description: Success or error message
 * 
 *     QrCodeResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the operation was successful
 *         transactionId:
 *           type: integer
 *           description: The transaction ID
 *         referenceId:
 *           type: string
 *           description: External reference ID
 *         qrCodeData:
 *           type: string
 *           description: QR code data or URL
 *         payUrl:
 *           type: string
 *           description: Payment URL for redirection
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: QR code expiration timestamp
 *
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management
 * 
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get user transactions
 *     description: Retrieve the authenticated user's transaction history
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of transactions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of transactions to skip
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, transfer]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter by transaction status
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     description: Retrieve details for a specific transaction
 *     tags: [Transactions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /payments/gcash/generate-qr:
 *   post:
 *     summary: Generate GCash QR code
 *     description: Generate a QR code for GCash payment
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateQrRequest'
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QrCodeResponse'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /payments/gcash/status/{reference}:
 *   get:
 *     summary: Check GCash payment status
 *     description: Check the status of a GCash payment by reference ID
 *     tags: [Payments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference ID
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "SUCCESS"
 *                 transactionId:
 *                   type: integer
 *                   example: 24
 *                 paymentDetails:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */