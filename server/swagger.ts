import { Express } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './vite';

// Fix for ES modules - get equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Import all Swagger documentation files in routes/docs directory
 * This loads all the JSDoc comments for the API documentation
 */
function importSwaggerDocFiles() {
  const docsDir = path.join(__dirname, 'routes', 'docs');
  
  try {
    // Check if docs directory exists
    if (!fs.existsSync(docsDir)) {
      console.warn('Swagger docs directory not found:', docsDir);
      return;
    }
    
    // Import all .ts files in the docs directory
    const docFiles = fs.readdirSync(docsDir)
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(docsDir, file));
    
    // Log the imported files for debugging
    if (docFiles.length > 0) {
      console.log(`Imported ${docFiles.length} Swagger documentation files`);
    } else {
      console.warn('No Swagger documentation files found in:', docsDir);
    }
    
    return docFiles;
  } catch (error) {
    console.error('Error importing Swagger doc files:', error);
    return [];
  }
}

/**
 * Configure and set up Swagger documentation for the 747 Casino E-Wallet API
 */
export function setupSwagger(app: Express) {
  // Default swagger paths - fallback if doc files don't exist
  const defaultApiPaths = [
    './server/routes/**/*.ts',
    './server/index.ts'
  ];
  
  // Import all documentation files from docs directory if they exist
  const docFiles = importSwaggerDocFiles();
  
  // Swagger definition
  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: '747 Casino E-Wallet API',
      version: '1.0.0',
      description: 'API documentation for the 747 Casino E-Wallet Platform',
      contact: {
        name: 'Team Marc',
        email: 'support@747casino.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://747casino.com'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  };
  
  // Swagger options
  const options: swaggerJSDoc.Options = {
    swaggerDefinition,
    apis: docFiles && docFiles.length > 0 ? docFiles : defaultApiPaths
  };
  
  try {
    // Initialize swagger-jsdoc
    const swaggerSpec = swaggerJSDoc(options);
    
    // Serve swagger docs
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }', // Hide the default Swagger UI top bar
      customSiteTitle: '747 Casino E-Wallet API Documentation',
      customfavIcon: '/assets/favicon.ico'
    }));
    
    // Provide swagger.json endpoint
    app.get('/api/docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
    
    log('Swagger documentation available at /api/docs');
  } catch (error) {
    console.error('Error setting up Swagger:', error);
    log('Swagger documentation setup failed - API will still function normally');
  }
}