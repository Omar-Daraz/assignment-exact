import { Module, Logger } from "@nestjs/common";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger("CacheModule");
        const redisHost =
          configService.get<string>("REDIS_HOST") || "localhost";
        const redisPort = configService.get<number>("REDIS_PORT") || 6379;
        const useRedis = configService.get<string>("USE_REDIS") !== "false";
        const maxRetries = 5;
        const retryDelay = 2000;

        if (useRedis) {
          let lastError: Error | null = null;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const { redisStore } = await import("cache-manager-redis-yet");
              const store = await redisStore({
                socket: {
                  host: redisHost,
                  port: redisPort,
                  connectTimeout: 5000,
                  reconnectStrategy: (retries) => {
                    if (retries > 10) {
                      logger.error(
                        `Redis reconnection failed after ${retries} attempts`
                      );
                      return false;
                    }
                    return Math.min(retries * 100, 3000);
                  },
                },
              });

              const client = (store as any).client;
              if (client) {
                client.on("error", (err: Error) => {
                  logger.error(`Redis client error: ${err.message}`);
                });
                client.on("connect", () => {
                  logger.log(`Redis connected at ${redisHost}:${redisPort}`);
                });
                client.on("ready", () => {
                  logger.log(`Redis ready at ${redisHost}:${redisPort}`);
                });
              }

              logger.log(
                `Redis cache connected successfully at ${redisHost}:${redisPort}`
              );
              return {
                store: () => store,
                ttl: 300,
              };
            } catch (error) {
              lastError = error as Error;
              if (attempt < maxRetries) {
                logger.warn(
                  `Redis connection attempt ${attempt}/${maxRetries} failed (${redisHost}:${redisPort}), retrying in ${retryDelay}ms...`
                );
                await sleep(retryDelay);
              } else {
                logger.error(
                  `Redis connection failed after ${maxRetries} attempts (${redisHost}:${redisPort}): ${lastError.message}`
                );
                logger.warn("Falling back to in-memory cache");
              }
            }
          }
        } else {
          logger.log("Redis disabled, using in-memory cache");
        }

        return {
          ttl: 300,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
