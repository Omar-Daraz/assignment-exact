import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "../cache/cache.module";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { Task } from "./entities/task.entity";
import { EventsModule } from "../events/events.module";
import { WebSocketModule } from "../websocket/websocket.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    EventsModule,
    WebSocketModule,
    UsersModule,
    CacheModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
