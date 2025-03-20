/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - username
 *         - email
 *         - balance
 *       properties:
 *         id:
 *           type: integer
 *           description: The user ID
 *         username:
 *           type: string
 *           description: The user's username
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         balance:
 *           type: number
 *           description: Current wallet balance
 *         pendingBalance:
 *           type: number
 *           description: Pending wallet balance
 *         casinoId:
 *           type: string
 *           description: Casino client ID
 *         casinoUsername:
 *           type: string
 *           description: Casino username
 *         casinoClientId:
 *           type: integer
 *           description: Casino client ID as number
 *         topManager:
 *           type: string
 *           description: User's top manager username
 *         immediateManager:
 *           type: string
 *           description: User's immediate manager username
 *         casinoUserType:
 *           type: string
 *           description: Type of casino user
 *         casinoBalance:
 *           type: number
 *           description: User's casino balance
 *         role:
 *           type: string
 *           enum: [player, agent, admin]
 *           description: User role
 *         status:
 *           type: string
 *           enum: [active, suspended, inactive, pending_review]
 *           description: User account status
 *       example:
 *         id: 1
 *         username: user123
 *         email: user@example.com
 *         balance: 1000
 *         pendingBalance: 0
 *         casinoId: "12345"
 *         role: player
 *         status: active
 * 
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: The user's username
 *         password:
 *           type: string
 *           description: The user's password
 *       example:
 *         username: user123
 *         password: securepassword
 * 
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - email
 *       properties:
 *         username:
 *           type: string
 *           description: The user's username
 *         password:
 *           type: string
 *           description: The user's password
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *       example:
 *         username: newuser123
 *         password: securepassword
 *         email: newuser@example.com
 * 
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the operation was successful
 *         user:
 *           $ref: '#/components/schemas/User'
 *         message:
 *           type: string
 *           description: Success or error message
 *
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and get session cookie
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
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
 *                   example: Invalid credentials
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account and log in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Username already exists or invalid data
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
 *                   example: Username already exists
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: User logout
 *     description: End the user session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /user/info:
 *   get:
 *     summary: Get current user info
 *     description: Retrieve information about the authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
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
 *                   example: Authentication required. Please log in again.
 */

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Refresh authentication session
 *     description: Extend the current user session
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session refreshed successfully
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
 *                   example: Session refreshed successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
 *                   example: Authentication required. Please log in again.
 */