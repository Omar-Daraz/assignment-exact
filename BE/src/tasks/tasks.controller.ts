import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User, UserRole } from "../users/entities/user.entity";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: User
  ) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.tasksService.findAll(user.id, user.role);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.tasksService.findOne(id, user.id, user.role);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: User
  ) {
    return this.tasksService.update(id, updateTaskDto, user.id, user.role);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param("id") id: string, @CurrentUser() user: User) {
    await this.tasksService.remove(id, user.id, user.role);
    return { message: "Task deleted successfully" };
  }
}
