import type { Event } from "@/types/event";

export interface MapCanvasProps {
  events: Event[];
  selectedEventId: string | null;
  enableMarkerPopup?: boolean;
  onSelectEvent?: (id: string) => void;
  onReady?: (actions: { resetView: () => void; locateMe: () => void }) => void;
  onViewportCenterChange?: (latLng: [number, number]) => void;
}

export interface PostLocationPickerCanvasProps {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
}

