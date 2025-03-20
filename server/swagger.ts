/**
 * Swagger documentation configuration for 747 Casino E-Wallet API
 */
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { version } from '../package.json';

// Swagger definition
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '747 Casino E-Wallet API Documentation',
      version,
      description: 'API documentation for the 747 Casino E-Wallet Platform',
      license: {
        name: 'Proprietary',
        url: 'https://747.live',
      },
      contact: {
        name: 'Support',
        url: 'https://747.live/support',
        email: 'support@747.live',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and user management',
      },
      {
        name: 'User',
        description: 'User profile and information',
      },
      {
        name: 'Transactions',
        description: 'Financial transactions',
      },
      {
        name: 'Payments',
        description: 'Payment processing',
      },
      {
        name: 'Casino',
        description: 'Casino integrations',
      }
    ],
  },
  apis: [
    './server/routes/*.ts',
    './server/routes.ts',
    './server/routes/mobile/*.ts',
    './shared/schema.ts'
  ],
};

// Initialize swagger-jsdoc
const specs = swaggerJsdoc(options);

// Setup Swagger UI
export function setupSwagger(app: Express) {
  // Serve swagger docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "747 Casino E-Wallet API Documentation",
  }));
  
  // Serve swagger spec as JSON
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log('Swagger documentation available at /api/docs');
}