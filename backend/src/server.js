const app = require('./app');
const connectDB = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 EcoScrap API running in ${NODE_ENV} mode`);
    console.log(`📡 Server listening on port: ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`===============================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[UnhandledRejection]: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`[UncaughtException]: ${err.message}`);
    process.exit(1);
  });
};

startServer();
