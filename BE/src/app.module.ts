import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TasksModule } from "./tasks/tasks.module";
import { EventsModule } from "./events/events.module";
import { WebSocketModule } from "./websocket/websocket.module";
import { CacheModule } from "./cache/cache.module";
import { User } from "./users/entities/user.entity";
import { Task } from "./tasks/entities/task.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || "postgres",
      password: process.env.DATABASE_PASSWORD || "postgres",
      database: process.env.DATABASE_NAME || "task_management",
      entities: [User, Task],
      synchronize: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/task_management"
    ),
    AuthModule,
    UsersModule,
    TasksModule,
    EventsModule,
    WebSocketModule,
    CacheModule,
  ],
})
export class AppModule {}
