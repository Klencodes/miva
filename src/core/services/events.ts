type EventCallback = () => void;

class EventService {
  private listeners: EventCallback[] = [];

  onRefresh(callback: EventCallback): void {
    this.listeners.push(callback);
  }

  offRefresh(callback: EventCallback): void {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  triggerRefresh(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in refresh handler:', error);
      }
    });
  }
}

export const eventService = new EventService();