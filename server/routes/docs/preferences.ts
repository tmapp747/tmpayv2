/**
 * @swagger
 * components:
 *   schemas:
 *     UserPreference:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *           description: User ID the preference belongs to
 *         key:
 *           type: string
 *           description: Preference key
 *         value:
 *           type: object
 *           description: Preference value (can be any JSON-serializable value)
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         userId: 10
 *         key: "theme"
 *         value: { "mode": "dark", "color": "blue" }
 *         lastUpdated: "2023-01-01T00:00:00Z"
 * 
 *     ThemePreference:
 *       type: object
 *       properties:
 *         mode:
 *           type: string
 *           enum: [light, dark, system]
 *           description: Theme mode preference
 *         color:
 *           type: string
 *           description: Primary color preference
 *       example:
 *         mode: "dark"
 *         color: "blue"
 * 
 *     NotificationPreference:
 *       type: object
 *       properties:
 *         email:
 *           type: boolean
 *           description: Email notification preference
 *         push:
 *           type: boolean
 *           description: Push notification preference
 *         sms:
 *           type: boolean
 *           description: SMS notification preference
 *       example:
 *         email: true
 *         push: false
 *         sms: true
 * 
 * @swagger
 * tags:
 *   name: Preferences
 *   description: User preferences management
 */

/**
 * @swagger
 * /user/preferences/theme:
 *   get:
 *     summary: Get user theme preference
 *     description: Retrieve the user's theme preference
 *     tags: [Preferences]
 *     responses:
 *       200:
 *         description: Theme preference retrieved successfully
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
 *                 value:
 *                   $ref: '#/components/schemas/ThemePreference'
 *       500:
 *         description: Server error
 * 
 *   post:
 *     summary: Update user theme preference
 *     description: Save or update the user's theme preference
 *     tags: [Preferences]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ThemePreference'
 *     responses:
 *       200:
 *         description: Theme preference updated successfully
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
 *                   example: "Theme preference updated"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /user/preferences/notifications:
 *   get:
 *     summary: Get user notification preferences
 *     description: Retrieve the user's notification preferences
 *     tags: [Preferences]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
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
 *                 value:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 * 
 *   post:
 *     summary: Update user notification preferences
 *     description: Save or update the user's notification preferences
 *     tags: [Preferences]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationPreference'
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
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
 *                   example: "Notification preferences updated"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /user/preferences/{key}:
 *   get:
 *     summary: Get user preference by key
 *     description: Retrieve a specific user preference by key
 *     tags: [Preferences]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference key
 *     responses:
 *       200:
 *         description: Preference retrieved successfully
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
 *                 value:
 *                   type: object
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 * 
 *   post:
 *     summary: Update user preference by key
 *     description: Save or update a specific user preference by key
 *     tags: [Preferences]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Preference updated successfully
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
 *                   example: "Preference updated"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 * 
 *   delete:
 *     summary: Delete user preference by key
 *     description: Remove a specific user preference by key
 *     tags: [Preferences]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Preference key
 *     responses:
 *       200:
 *         description: Preference deleted successfully
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
 *                   example: "Preference deleted"
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Preference not found
 *       500:
 *         description: Server error
 */