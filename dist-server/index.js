import { buildApp } from "./app.js";
import { env } from "./config/env.js";
async function start() {
    try {
        const app = await buildApp();
        await app.listen({
            port: parseInt(env.PORT),
            host: "0.0.0.0",
        });
        console.log(`
    🚀 IELTS API Server is running!
    
    📡 API URL: http://localhost:${env.PORT}/api/v1
    📖 Health:  http://localhost:${env.PORT}/api/v1/health
    
    🔧 Environment: ${env.NODE_ENV}
    `);
    }
    catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
}
start();
