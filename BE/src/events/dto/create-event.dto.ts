export class CreateEventDto {
  eventType: string;
  entityType: string;
  entityId: string;
  userId?: string;
  message?: string;
  metadata?: Record<string, any>;
}

