// prisma.config.js
require('dotenv/config'); // loads .env for local dev
const { defineConfig, env } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'), // the CLI reads DBURL from here
  },
});
