/**
 * ════════════════════════════════════════════════════════════════════════════
 * HEALTH CHECK API ROUTE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Provides comprehensive health check for monitoring and debugging:
 * ✅ Database connection status
 * ✅ Cache statistics
 * ✅ System memory usage
 * ✅ Uptime information
 * ✅ Environment details
 */

import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/lib/dbConnect";
import { getAllCacheStats } from "@/lib/cache";

export async function GET() {
  const startTime = Date.now();

  try {
    // Get database connection status
    const dbStatus = getConnectionStatus();

    // Get cache statistics
    const cacheStats = getAllCacheStats();

    // Get system memory usage
    const memoryUsage = process.memoryUsage();

    // Calculate overall health
    const isHealthy = dbStatus.isConnected;
    const status = isHealthy ? "healthy" : "unhealthy";

    // Build response
    const healthCheck = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,

      database: {
        connected: dbStatus.isConnected,
        state: dbStatus.readyStateText,
        attempts: dbStatus.connectionAttempts,
        lastConnected: dbStatus.lastConnected,
        lastError: dbStatus.lastError,
        poolSize: dbStatus.poolSize,
      },

      cache: {
        categories: {
          size: cacheStats.categories.size,
          hits: cacheStats.categories.hits,
          misses: cacheStats.categories.misses,
          hitRate: `${cacheStats.categories.hitRate.toFixed(2)}%`,
        },
        user: {
          size: cacheStats.user.size,
          hits: cacheStats.user.hits,
          misses: cacheStats.user.misses,
          hitRate: `${cacheStats.user.hitRate.toFixed(2)}%`,
        },
        aggregation: {
          size: cacheStats.aggregation.size,
          hits: cacheStats.aggregation.hits,
          misses: cacheStats.aggregation.misses,
          hitRate: `${cacheStats.aggregation.hitRate.toFixed(2)}%`,
        },
      },

      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
      },

      responseTime: `${Date.now() - startTime}ms`,
    };

    return NextResponse.json(healthCheck, {
      status: isHealthy ? 200 : 503,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}
