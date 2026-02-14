import { MapColors, TravelStatus } from '../types';

export const DEFAULT_COLORS: MapColors = {
  [TravelStatus.NONE]: '#e8e8e8',
  [TravelStatus.VISITED]: '#22C55E',
  [TravelStatus.LIVED]: '#3B82F6',
  [TravelStatus.FROM]: '#F59E0B',
  [TravelStatus.CURRENT]: '#EF4444'
};

export const COLOR_LABELS = {
  [TravelStatus.NONE]: 'Not visited',
  [TravelStatus.VISITED]: 'Visited',
  [TravelStatus.LIVED]: 'Lived there',
  [TravelStatus.FROM]: 'From here',
  [TravelStatus.CURRENT]: 'Live here now'
};