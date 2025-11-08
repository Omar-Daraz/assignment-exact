import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLog, EventLogDocument } from './schemas/event-log.schema';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(EventLog.name)
    private eventLogModel: Model<EventLogDocument>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<EventLog> {
    const eventLog = new this.eventLogModel(createEventDto);
    return eventLog.save();
  }

  async findAll(): Promise<EventLog[]> {
    return this.eventLogModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<EventLog[]> {
    return this.eventLogModel
      .find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .exec();
  }
}

