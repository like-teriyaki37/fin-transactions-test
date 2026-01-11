export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    statementTimeout: parseInt(process.env.STATEMENT_TIMEOUT_MS || '200', 10),
    lockTimeout: parseInt(process.env.LOCK_TIMEOUT_MS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
