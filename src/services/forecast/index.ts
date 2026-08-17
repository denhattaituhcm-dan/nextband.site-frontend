import { ForecastService } from './ForecastService';
import { MockForecastService } from './MockForecastService';

// Singleton instance ready to be replaced with SupabaseForecastService in future phases
export const forecastService: ForecastService = new MockForecastService();

export * from './types';
export * from './ForecastService';
