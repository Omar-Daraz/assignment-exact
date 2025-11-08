import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Task } from "./entities/task.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { EventsService } from "../events/events.service";
import { WebSocketGateway } from "../websocket/websocket.gateway";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/entities/user.entity";

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private eventsService: EventsService,
    private webSocketGateway: WebSocketGateway,
    private usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const assignedUser = await this.usersService.findOne(
      createTaskDto.assignedToId
    );
    if (!assignedUser) {
      throw new NotFoundException("Assigned user not found");
    }
    if (assignedUser.role !== UserRole.USER) {
      throw new BadRequestException(
        'Tasks can only be assigned to users with role "user"'
      );
    }
    const task = this.tasksRepository.create({
      ...createTaskDto,
      createdById: userId,
    });
    const savedTask = await this.tasksRepository.save(task);
    const fullTask = await this.findOne(savedTask.id, userId, "admin");

    await this.eventsService.create({
      eventType: "task.created",
      entityType: "task",
      entityId: savedTask.id,
      userId,
      message: `Task "${savedTask.title}" was created`,
      metadata: { task: savedTask },
    });

    this.webSocketGateway.emitTaskUpdate("task.created", fullTask);
    await this.invalidateTasksCache();

    return fullTask;
  }

  private async invalidateTasksCache(): Promise<void> {
    try {
      const stores = (this.cacheManager as any).stores;
      if (stores && stores.length > 0) {
        const store = stores[0];
        if (store && typeof store.keys === "function") {
          const keys = await store.keys("tasks:*");
          for (const key of keys) {
            try {
              await this.cacheManager.del(key);
            } catch {}
          }
        } else {
          try {
            await this.cacheManager.del("tasks:all");
          } catch {}
        }
      } else {
        try {
          await this.cacheManager.del("tasks:all");
        } catch {}
      }
    } catch {
      try {
        await this.cacheManager.del("tasks:all");
      } catch {}
    }
  }

  async findAll(userId: string, userRole: string): Promise<Task[]> {
    const cacheKey =
      userRole === "admin" ? "tasks:all" : `tasks:user:${userId}`;
    try {
      const cached = await this.cacheManager.get<Task[]>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {}

    let tasks: Task[];
    if (userRole === "admin") {
      tasks = await this.tasksRepository.find({
        relations: ["assignedTo", "createdBy"],
        order: { createdAt: "DESC" },
      });
    } else {
      tasks = await this.tasksRepository.find({
        where: [{ assignedToId: userId }, { createdById: userId }],
        relations: ["assignedTo", "createdBy"],
        order: { createdAt: "DESC" },
      });
    }

    try {
      await this.cacheManager.set(cacheKey, tasks, 60);
    } catch {}
    return tasks;
  }

  async findOne(id: string, userId: string, userRole: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ["assignedTo", "createdBy"],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    if (userRole !== "admin" && task.assignedToId !== userId) {
      throw new ForbiddenException("You can only view tasks assigned to you");
    }
    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
    userRole: string
  ): Promise<Task> {
    const task = await this.findOne(id, userId, userRole);

    if (updateTaskDto.assignedToId) {
      const assignedUser = await this.usersService.findOne(
        updateTaskDto.assignedToId
      );
      if (!assignedUser) {
        throw new NotFoundException("Assigned user not found");
      }
      if (assignedUser.role !== UserRole.USER) {
        throw new BadRequestException(
          'Tasks can only be assigned to users with role "user"'
        );
      }
    }

    const oldAssignedToId = task.assignedToId;
    const oldStatus = task.status;

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.tasksRepository.save(task);
    const fullTask = await this.findOne(id, userId, userRole);

    const eventMetadata: any = { task: fullTask };
    let eventType = "task.updated";
    let message = `Task "${task.title}" was updated`;

    if (
      updateTaskDto.assignedToId &&
      oldAssignedToId !== updateTaskDto.assignedToId
    ) {
      eventType = "task.assigned";
      message = `Task "${task.title}" was assigned to ${
        fullTask.assignedTo?.name || "unassigned"
      }`;
      eventMetadata.assignedToId = updateTaskDto.assignedToId;
      eventMetadata.oldAssignedToId = oldAssignedToId;
    }

    if (updateTaskDto.status && oldStatus !== updateTaskDto.status) {
      eventType = "task.status_changed";
      message = `Task "${task.title}" status changed to ${updateTaskDto.status}`;
      eventMetadata.oldStatus = oldStatus;
      eventMetadata.newStatus = updateTaskDto.status;
    }

    await this.eventsService.create({
      eventType,
      entityType: "task",
      entityId: id,
      userId,
      message,
      metadata: eventMetadata,
    });

    this.webSocketGateway.emitTaskUpdate(eventType, fullTask);
    await this.invalidateTasksCache();

    return fullTask;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const task = await this.findOne(id, userId, userRole);

    await this.tasksRepository.delete(id);

    await this.eventsService.create({
      eventType: "task.deleted",
      entityType: "task",
      entityId: id,
      userId,
      message: `Task "${task.title}" was deleted`,
      metadata: { taskId: id },
    });

    this.webSocketGateway.emitTaskUpdate("task.deleted", { id });
    await this.invalidateTasksCache();
  }
}
