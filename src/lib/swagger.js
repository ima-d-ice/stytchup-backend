// OpenAPI 3.1 definition for the StytchUp marketplace API.
// Served at GET /docs (Swagger UI) and GET /openapi.json (raw spec).
const swaggerJSDoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 4000;

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'StytchUp API',
      version: '1.0.0',
      description: [
        'Vertical fashion marketplace: catalog + custom orders over chat.',
        '',
        'Money is stored as integer **paise** (₹1 = 100).',
        '',
        'Order lifecycle: `PENDING` (paid) → `AWAITING_REQUIREMENTS` (sizing needed) →',
        '`IN_PROGRESS` (production) → `SHIPPED` → `COMPLETED`.',
        '`CANCELLED` / `REFUNDED` are terminal states.',
      ].join('\n'),
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Local dev' },
      { url: 'https://stytchup-backend.onrender.com', description: 'Production (example)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' }, name: { type: ['string', 'null'] },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['CUSTOMER', 'DESIGNER', 'ADMIN'] },
          },
        },
        Design: {
          type: 'object',
          properties: {
            id: { type: 'string' }, title: { type: 'string' },
            description: { type: ['string', 'null'] },
            price: { type: 'integer', description: 'Paise', example: 49900 },
            imageUrl: { type: 'string' },
            type: { type: 'string', enum: ['CATALOG', 'CUSTOM'] },
            designerId: { type: 'string' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'AWAITING_REQUIREMENTS', 'IN_PROGRESS', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
            },
            totalAmount: { type: 'integer', description: 'Paise' },
            buyerId: { type: 'string' }, designerId: { type: 'string' },
          },
        },
        Conversation: {
          type: 'object',
          properties: { id: { type: 'string' }, user1Id: { type: 'string' }, user2Id: { type: 'string' } },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' }, conversationId: { type: 'string' },
            text: { type: ['string', 'null'] }, isOffer: { type: 'boolean' },
            offerPrice: { type: ['integer', 'null'], description: 'Paise' },
            offerTitle: { type: ['string', 'null'] },
            offerStatus: { type: ['string', 'null'], enum: ['PENDING', 'ACCEPTED', 'REJECTED', null] },
          },
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' }, { name: 'Designs' }, { name: 'Designers' },
      { name: 'Profile' }, { name: 'Payments' }, { name: 'Inbox' },
      { name: 'Orders' }, { name: 'Admin' }, { name: 'System' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/index.js', './src/lib/swagger.js'],
};

const spec = swaggerJSDoc(options);

module.exports = { spec };
