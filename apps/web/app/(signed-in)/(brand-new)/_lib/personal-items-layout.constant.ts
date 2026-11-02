import { FEED_CARD_SURFACE } from '@/components/organisms/feed-card/feed-card-surface.constant';
import { cn } from '@/lib/cn.util';

/** Two columns, and three once there is room beside the sidebar. */
export const RECEIVED_GRID = 'grid grid-cols-2 gap-3 lg:grid-cols-3';

/** The ground every card on the new Home sits on, a little closer in for a box this narrow. */
export const RECEIVED_TILE = cn(FEED_CARD_SURFACE, 'relative h-full p-4');
