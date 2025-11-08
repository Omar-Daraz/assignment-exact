import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { Task, TaskStatus } from "./entities/task.entity";
import { EventsService } from "../events/events.service";
import { WebSocketGateway } from "../websocket/websocket.gateway";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/entities/user.entity";

describe("TasksService", () => {
  let service: TasksService;
  let repository: Repository<Task>;
  let eventsService: EventsService;
  let webSocketGateway: WebSocketGateway;
  let usersService: UsersService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventsService = {
    create: jest.fn(),
  };

  const mockWebSocketGateway = {
    emitTaskUpdate: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockRepository,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        {
          provide: WebSocketGateway,
          useValue: mockWebSocketGateway,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
    eventsService = module.get<EventsService>(EventsService);
    webSocketGateway = module.get<WebSocketGateway>(WebSocketGateway);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new task", async () => {
      const createTaskDto = {
        title: "Test Task",
        description: "Test Description",
        status: TaskStatus.PENDING,
        assignedToId: "assigned-user-1",
      };
      const userId = "user-1";

      const mockAssignedUser = {
        id: "assigned-user-1",
        email: "assigned@test.com",
        name: "Assigned User",
        role: UserRole.USER,
      };

      const mockTask = {
        id: "task-1",
        ...createTaskDto,
        createdById: userId,
        assignedTo: mockAssignedUser,
        createdBy: { id: userId, name: "Test User" },
      };

      mockUsersService.findOne.mockResolvedValue(mockAssignedUser);
      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockEventsService.create.mockResolvedValue({});
      mockWebSocketGateway.emitTaskUpdate.mockReturnValue(undefined);

      const result = await service.create(createTaskDto, userId);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        createTaskDto.assignedToId
      );
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        createdById: userId,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventsService.create).toHaveBeenCalled();
      expect(mockWebSocketGateway.emitTaskUpdate).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });
  });

  describe("findOne", () => {
    it("should return a task by id for admin", async () => {
      const taskId = "task-1";
      const userId = "user-1";
      const userRole = "admin";
      const mockTask = {
        id: taskId,
        title: "Test Task",
        assignedToId: "assigned-user-1",
        assignedTo: { id: "assigned-user-1", name: "Assigned User" },
        createdBy: { id: "user-1", name: "Test User" },
      };

      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(taskId, userId, userRole);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: ["assignedTo", "createdBy"],
      });
      expect(result).toEqual(mockTask);
    });

    it("should return a task by id for assigned user", async () => {
      const taskId = "task-1";
      const userId = "assigned-user-1";
      const userRole = "user";
      const mockTask = {
        id: taskId,
        title: "Test Task",
        assignedToId: userId,
        assignedTo: { id: userId, name: "Assigned User" },
        createdBy: { id: "user-1", name: "Test User" },
      };

      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(taskId, userId, userRole);

      expect(result).toEqual(mockTask);
    });

    it("should throw ForbiddenException if user is not assigned to task", async () => {
      const taskId = "task-1";
      const userId = "user-1";
      const userRole = "user";
      const mockTask = {
        id: taskId,
        title: "Test Task",
        assignedToId: "other-user-1",
        assignedTo: { id: "other-user-1", name: "Other User" },
        createdBy: { id: "user-1", name: "Test User" },
      };

      mockRepository.findOne.mockResolvedValue(mockTask);

      await expect(service.findOne(taskId, userId, userRole)).rejects.toThrow(
        ForbiddenException
      );
    });

    it("should throw NotFoundException if task not found", async () => {
      const taskId = "non-existent";
      const userId = "user-1";
      const userRole = "admin";
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(taskId, userId, userRole)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("update", () => {
    it("should update a task", async () => {
      const taskId = "task-1";
      const userId = "user-1";
      const userRole = "admin";
      const updateTaskDto = { title: "Updated Task" };

      const existingTask = {
        id: taskId,
        title: "Original Task",
        createdById: userId,
        assignedToId: "assigned-user-1",
        status: TaskStatus.PENDING,
        assignedTo: { id: "assigned-user-1", name: "Assigned User" },
        createdBy: { id: userId, name: "Test User" },
      };

      const updatedTask = {
        ...existingTask,
        ...updateTaskDto,
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingTask)
        .mockResolvedValueOnce(updatedTask);
      mockRepository.save.mockResolvedValue(updatedTask);
      mockEventsService.create.mockResolvedValue({});
      mockWebSocketGateway.emitTaskUpdate.mockReturnValue(undefined);

      const result = await service.update(
        taskId,
        updateTaskDto,
        userId,
        userRole
      );

      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventsService.create).toHaveBeenCalled();
      expect(mockWebSocketGateway.emitTaskUpdate).toHaveBeenCalled();
      expect(result).toEqual(updatedTask);
    });
  });

  describe("remove", () => {
    it("should delete a task", async () => {
      const taskId = "task-1";
      const userId = "user-1";
      const userRole = "admin";

      const existingTask = {
        id: taskId,
        title: "Test Task",
        createdById: userId,
        assignedToId: "assigned-user-1",
        status: TaskStatus.PENDING,
        assignedTo: { id: "assigned-user-1", name: "Assigned User" },
        createdBy: { id: userId, name: "Test User" },
      };

      mockRepository.findOne.mockResolvedValue(existingTask);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockEventsService.create.mockResolvedValue({});
      mockWebSocketGateway.emitTaskUpdate.mockReturnValue(undefined);

      await service.remove(taskId, userId, userRole);

      expect(mockRepository.delete).toHaveBeenCalledWith(taskId);
      expect(mockEventsService.create).toHaveBeenCalled();
      expect(mockWebSocketGateway.emitTaskUpdate).toHaveBeenCalled();
    });
  });
});
