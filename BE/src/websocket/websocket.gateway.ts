import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";

@WSGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  },
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(" ")[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET") || "secret",
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      client.join(`user:${user.id}`);
      client.emit("connected", { message: "Connected to WebSocket" });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage("join-room")
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
  }

  emitTaskUpdate(eventType: string, task: any) {
    this.server.emit("task-update", {
      eventType,
      task,
      timestamp: new Date(),
    });

    if (task.assignedToId) {
      this.server.to(`user:${task.assignedToId}`).emit("task-assigned", {
        eventType,
        task,
        timestamp: new Date(),
      });
    }

    if (task.createdById) {
      this.server.to(`user:${task.createdById}`).emit("task-created", {
        eventType,
        task,
        timestamp: new Date(),
      });
    }
  }
}
