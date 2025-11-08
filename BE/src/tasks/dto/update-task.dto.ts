import { IsString, IsOptional, IsEnum, IsUUID } from "class-validator";
import { Transform } from "class-transformer";
import { TaskStatus } from "../entities/task.entity";

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsUUID(undefined, { message: "assignedToId must be a UUID" })
  @IsOptional()
  assignedToId?: string;
}
