import { MapColors, TravelStatus } from '../types';

export const DEFAULT_COLORS: MapColors = {
  [TravelStatus.NONE]: '#f8f8f8',
  [TravelStatus.VISITED]: '#4CAF50',
  [TravelStatus.LIVED]: '#2196F3',
  [TravelStatus.FROM]: '#FF9800',
  [TravelStatus.CURRENT]: '#F44336'
};

export const COLOR_LABELS = {
  [TravelStatus.NONE]: 'Not visited',
  [TravelStatus.VISITED]: 'Visited',
  [TravelStatus.LIVED]: 'Lived there',
  [TravelStatus.FROM]: 'From here',
  [TravelStatus.CURRENT]: 'Live here now'
};