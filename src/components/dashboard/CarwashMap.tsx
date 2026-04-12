import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Carwash } from '@/Contexts/CarwashService';

interface CarwashMapProps {
  carwashes?: Carwash[];
  center?: [number, number]; // [lng, lat]
  onAreaChange?: (lat: number, lng: number) => void; // 🆕 Dynamic discovery callback
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const CarwashMap = ({ carwashes = [], center = [3.3792, 6.5244], onAreaChange }: CarwashMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserDragging = useRef(false);

  // Debounced callback fired after user stops dragging the map
  const handleMoveEnd = useCallback(() => {
    if (!map.current || !onAreaChange || !isUserDragging.current) return;

    // Clear previous debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const mapCenter = map.current!.getCenter();
      // Mapbox center: { lng, lat }
      onAreaChange(mapCenter.lat, mapCenter.lng);
      isUserDragging.current = false;
    }, 800); // 800ms debounce — waits until user is done dragging
  }, [onAreaChange]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: center,
        zoom: 12,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Track when user starts dragging vs programmatic panning
      map.current.on('dragstart', () => {
        isUserDragging.current = true;
      });

      // Only trigger search when user drags (not programmatic flyTo calls)
      map.current.on('moveend', handleMoveEnd);

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Wire up moveend when callback changes
  useEffect(() => {
    if (!map.current) return;
    map.current.off('moveend', handleMoveEnd);
    map.current.on('moveend', handleMoveEnd);
  }, [handleMoveEnd]);

  // Programmatic center update (does NOT trigger discovery - isUserDragging stays false)
  useEffect(() => {
    if (map.current && center) {
      isUserDragging.current = false;
      map.current.flyTo({ center, zoom: 13, duration: 1200 });
    }
  }, [center]);

  // Update markers when carwashes change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    carwashes.forEach((carwash) => {
      const coords = carwash.location?.coordinates;
      if (!coords || coords.length !== 2) return;

      const el = document.createElement('div');
      el.style.cssText = `
        width: 40px; height: 52px;
        cursor: pointer;
        transition: transform 0.2s ease;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));
      `;
      el.onmouseover = () => { el.style.transform = 'scale(1.25) translateY(-4px)'; };
      el.onmouseleave = () => { el.style.transform = 'scale(1) translateY(0)'; };
      // High-contrast marker: white background + blue pin with car wash icon
      el.innerHTML = `
        <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- White shadow drop -->
          <ellipse cx="20" cy="50" rx="7" ry="3" fill="rgba(0,0,0,0.3)"/>
          <!-- Pin body -->
          <path d="M20 0C12.27 0 6 6.27 6 14C6 24.5 20 40 20 40C20 40 34 24.5 34 14C34 6.27 27.73 0 20 0Z" fill="#2563eb"/>
          <!-- White circle background -->
          <circle cx="20" cy="14" r="9" fill="white"/>
          <!-- Car wash droplet icon -->
          <text x="20" y="19" text-anchor="middle" font-size="11" fill="#2563eb">🚗</text>
        </svg>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([coords[0], coords[1]])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, maxWidth: '240px' })
            .setHTML(
              `<div style="padding:10px;font-family:sans-serif;">
                <h3 style="font-weight:700;font-size:14px;margin:0 0 4px">${carwash.name}</h3>
                <p style="font-size:12px;color:#6b7280;margin:0 0 4px">${carwash.address}</p>
                <p style="font-size:12px;margin:0">⭐ ${carwash.rating || '0.0'} · ${carwash.services?.[0]?.price ? `₦${Number(carwash.services[0].price).toLocaleString()}` : 'Price N/A'}</p>
                ${carwash.distance_text ? `<p style="font-size:11px;color:#6366f1;font-weight:600;margin:4px 0 0">${carwash.distance_text}</p>` : ''}
              </div>`
            )
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [carwashes]);

  return (
    <div className="relative w-full h-[500px] rounded-lg border shadow-sm overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Subtle "drag to discover" hint */}
      {onAreaChange && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
            Drag map to explore nearby carwashes
          </div>
        </div>
      )}
    </div>
  );
};
