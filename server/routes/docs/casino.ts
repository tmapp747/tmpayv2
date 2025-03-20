/**
 * @swagger
 * components:
 *   schemas:
 *     CasinoUserDetails:
 *       type: object
 *       properties:
 *         clientId:
 *           type: integer
 *           description: Casino client ID
 *         username:
 *           type: string
 *           description: Casino username
 *         balance:
 *           type: number
 *           description: Casino balance
 *         type:
 *           type: string
 *           description: User type in casino system
 *         topManager:
 *           type: string
 *           description: Top manager username
 *         immediateManager:
 *           type: string
 *           description: Immediate manager username
 *       example:
 *         clientId: 535901599
 *         username: "Athan45"
 *         balance: 5000
 *         type: "player"
 *         topManager: "Marcthepogi"
 *         immediateManager: "platalyn@gmail.com"
 * 
 *     HierarchyNode:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID in casino system
 *         clientId:
 *           type: integer
 *           description: Casino client ID
 *         username:
 *           type: string
 *           description: Casino username
 *         parentClientId:
 *           type: integer
 *           description: Parent client ID
 *       example:
 *         id: 242975
 *         clientId: 535901599
 *         username: "Athan45"
 *         parentClientId: 459391
 * 
 *     CasinoDepositRequest:
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
 *     CasinoTransferRequest:
 *       type: object
 *       required:
 *         - amount
 *         - toUsername
 *       properties:
 *         amount:
 *           type: number
 *           description: The amount to transfer
 *         toUsername:
 *           type: string
 *           description: Recipient's username
 *         comment:
 *           type: string
 *           description: Optional comment for transfer
 *       example:
 *         amount: 100
 *         toUsername: "otherplayer"
 *         comment: "Gift transfer"
 * 
 * @swagger
 * tags:
 *   name: Casino
 *   description: Casino API integration
 */

/**
 * @swagger
 * /casino/user-info:
 *   get:
 *     summary: Get casino user info
 *     description: Retrieve the authenticated user's casino account details
 *     tags: [Casino]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Casino user information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/CasinoUserDetails'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Authentication required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /casino/user-stats/{username}:
 *   get:
 *     summary: Get casino user stats
 *     description: Retrieve casino stats for a specific user
 *     tags: [Casino]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Casino username
 *     responses:
 *       200:
 *         description: Casino user stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 clientId:
 *                   type: integer
 *                   example: 535901599
 *                 username:
 *                   type: string
 *                   example: "Athan45"
 *                 balance:
 *                   type: number
 *                   example: 5000
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /casino/user-hierarchy:
 *   post:
 *     summary: Get user hierarchy
 *     description: Retrieve the hierarchy tree for a user
 *     tags: [Casino]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Casino username to get hierarchy for
 *               isAgent:
 *                 type: boolean
 *                 description: Whether user is an agent (affects hierarchy retrieval)
 *             example:
 *               username: "Athan45"
 *               isAgent: false
 *     responses:
 *       200:
 *         description: Casino user hierarchy retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 hierarchy:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HierarchyNode'
 *                 user:
 *                   $ref: '#/components/schemas/HierarchyNode'
 *                 message:
 *                   type: string
 *                   example: "Hierarchy fetched successfully"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /casino/deposit:
 *   post:
 *     summary: Deposit to casino
 *     description: Deposit funds from e-wallet to casino account
 *     tags: [Casino]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CasinoDepositRequest'
 *     responses:
 *       200:
 *         description: Deposit successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactionId:
 *                   type: integer
 *                   example: 45
 *                 message:
 *                   type: string
 *                   example: "Deposit initiated successfully"
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Invalid request or insufficient funds
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /casino/transfer:
 *   post:
 *     summary: Transfer within casino
 *     description: Transfer funds to another user within the casino system
 *     tags: [Casino]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CasinoTransferRequest'
 *     responses:
 *       200:
 *         description: Transfer successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactionId:
 *                   type: string
 *                   example: "5f4d6s87a9"
 *                 message:
 *                   type: string
 *                   example: "Transfer completed successfully"
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Invalid request or insufficient balance
 *       500:
 *         description: Server error
 */