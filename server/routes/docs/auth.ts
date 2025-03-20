/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's casino username
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *       example:
 *         username: "Athan45"
 *         password: "secret123"
 * 
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's casino username (must exist in casino system)
 *         password:
 *           type: string
 *           format: password
 *           description: User's chosen password
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phone:
 *           type: string
 *           description: User's phone number
 *       example:
 *         username: "newplayer123"
 *         password: "secure456"
 *         email: "player@example.com"
 *         phone: "+639123456789"
 * 
 *     VerifyUsernameRequest:
 *       type: object
 *       required:
 *         - username
 *       properties:
 *         username:
 *           type: string
 *           description: User's casino username to verify
 *         isAgent:
 *           type: boolean
 *           description: Whether user is registering as an agent
 *       example:
 *         username: "checkplayer"
 *         isAgent: false
 * 
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token from previous login
 *       example:
 *         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the operation was successful
 *         message:
 *           type: string
 *           description: Status message
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: User ID
 *             username:
 *               type: string
 *               description: Username
 *             role:
 *               type: string
 *               description: User role
 *             casinoUsername:
 *               type: string
 *               description: Casino username
 *             casinoClientId:
 *               type: integer
 *               description: Casino client ID
 *         accessToken:
 *           type: string
 *           description: JWT access token
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token
 *       example:
 *         success: true
 *         message: "Login successful"
 *         user:
 *           id: 10
 *           username: "Athan45"
 *           role: "player"
 *           casinoUsername: "Athan45"
 *           casinoClientId: 535901599
 *         accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication operations
 * 
 * @swagger
 * securitySchemes:
 *   cookieAuth:
 *     type: apiKey
 *     in: cookie
 *     name: connect.sid
 *   bearerAuth:
 *     type: http
 *     scheme: bearer
 *     bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate a user with username and password
 *     tags: [Authentication]
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
 *       400:
 *         description: Invalid login credentials
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register user
 *     description: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid registration data
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/verify-username:
 *   post:
 *     summary: Verify username
 *     description: Verify if a username exists in the casino system and is eligible for registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyUsernameRequest'
 *     responses:
 *       200:
 *         description: Username verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 exists:
 *                   type: boolean
 *                   example: true
 *                 isRegistered:
 *                   type: boolean
 *                   example: false
 *                 userDetails:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: integer
 *                       example: 535901599
 *                     username:
 *                       type: string
 *                       example: "Athan45"
 *                     topManager:
 *                       type: string
 *                       example: "Marcthepogi"
 *                     type:
 *                       type: string
 *                       example: "player"
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Username not found in casino system
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Invalidate user session and tokens
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */