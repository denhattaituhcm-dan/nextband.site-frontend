// Event Engine core module
export type EventName = 
  | "hw.submitted"
  | "hw.graded"
  | "hw.opened"
  | "attendance.marked"
  | "enrollment.created"
  | "class.created";

export interface EventPayload {
  actorId?: string;
  actorName?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  classId?: string;
  studentId?: string;
  metadata?: Record<string, any>;
}

type EventHandler = (payload: EventPayload) => Promise<void> | void;

class EventEngine {
  private handlers: Map<EventName, EventHandler[]> = new Map();

  on(event: EventName, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  async emit(event: EventName, payload: EventPayload) {
    const list = this.handlers.get(event) || [];
    for (const handler of list) {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`Error processing event ${event}:`, err);
      }
    }
  }
}

export const eventEngine = new EventEngine();
