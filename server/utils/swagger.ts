import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinanceTracker API Documentation',
      version,
      description: 'API documentation for FinanceTracker application',
      license: {
        name: 'MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'API Support',
        email: 'support@financetracker.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'financetracker.sid'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            code: {
              type: 'string'
            }
          }
        },
        Transaction: {
          type: 'object',
          required: ['type', 'amount', 'description'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense']
            },
            amount: {
              type: 'number',
              minimum: 0
            },
            description: {
              type: 'string',
              minLength: 1
            },
            date: {
              type: 'string',
              format: 'date-time'
            },
            receiptUrl: {
              type: 'string',
              format: 'uri'
            },
            category: {
              type: 'string'
            }
          }
        },
        TransactionSummary: {
          type: 'object',
          properties: {
            totalIncome: {
              type: 'number'
            },
            totalExpenses: {
              type: 'number'
            },
            balance: {
              type: 'number'
            }
          }
        }
      }
    }
  },
  apis: ['./server/routes/*.ts'], // Rutas para buscar anotaciones
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Ruta para la documentación de la API
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Ruta para obtener el spec en formato JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
