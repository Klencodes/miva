class NetworkService {
  private online = navigator.onLine;

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    this.online = true;
    console.log('Network: Online');
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new Event('networkOnline'));
  }

  private handleOffline() {
    this.online = false;
    console.log('Network: Offline');
    window.dispatchEvent(new Event('networkOffline'));
  }

  isOnline(): boolean {
    return this.online;
  }

  async checkConnection(): Promise<boolean> {
    if (!this.online) return false;
    
    try {
      // Try to fetch a small resource to confirm actual connectivity
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        headers: { 'Cache-Control': 'no-cache' }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const networkService = new NetworkService();