import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);
    try {
      await this.cacheManager.del("users:all");
    } catch {}
    return savedUser;
  }

  async findAll(): Promise<User[]> {
    const cacheKey = "users:all";
    try {
      const cached = await this.cacheManager.get<User[]>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {}

    const users = await this.usersRepository.find({
      select: ["id", "email", "name", "role", "createdAt", "updatedAt"],
    });

    try {
      await this.cacheManager.set(cacheKey, users, 300);
    } catch {}
    return users;
  }

  async findOne(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    try {
      const cached = await this.cacheManager.get<User>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {}

    const user = await this.usersRepository.findOne({ where: { id } });
    if (user) {
      try {
        await this.cacheManager.set(cacheKey, user, 300);
      } catch {}
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.usersRepository.update(id, updateUserDto);
    try {
      await this.cacheManager.del(`user:${id}`);
      await this.cacheManager.del("users:all");
    } catch {}
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
    try {
      await this.cacheManager.del(`user:${id}`);
      await this.cacheManager.del("users:all");
    } catch {}
  }
}
