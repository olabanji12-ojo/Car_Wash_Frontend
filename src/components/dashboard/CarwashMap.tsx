import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { Carwash } from '@/Contexts/CarwashService';

interface CarwashMapProps {
  carwashes?: Carwash[];
  center?: [number, number]; // [lng, lat]
}

export const CarwashMap = ({ carwashes = [], center = [3.3792, 6.5244] }: CarwashMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      // TODO: Replace with your Mapbox public token from https://account.mapbox.com/access-tokens/
      mapboxgl.accessToken = 'pk.eyJ1IjoiYmp0b2Z1bm1pZSIsImEiOiJjbWVoc2pzd2swMHRnMmtzZGxpd3EwaXllIn0.GiS-6hLA9z75hEOJRQk7UQ';

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: 12,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (error) {
      console.error('Failed to initialize map:', error);
      // Silently fail - map will just not render
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (map.current && center) {
      map.current.flyTo({ center, zoom: 12 });
    }
  }, [center]);

  // Update markers when carwashes change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each carwash
    carwashes.forEach((carwash) => {
      const coords = carwash.location?.coordinates;
      if (!coords || coords.length !== 2) return;

      const el = document.createElement('div');
      el.className = 'carwash-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#6366f1"/>
        </svg>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([coords[0], coords[1]])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(
              `<div class="p-2">
                <h3 class="font-semibold">${carwash.name}</h3>
                <p class="text-sm text-gray-600">${carwash.address}</p>
                <p class="text-sm mt-1">⭐ ${carwash.rating || '0.0'} • ${carwash.services?.[0]?.price ? `₦${carwash.services[0].price.toLocaleString()}` : 'Price N/A'}</p>
                ${carwash.distance_text ? `<p class="text-xs text-indigo-600 font-medium mt-1">${carwash.distance_text}</p>` : ''}
              </div>`
            )
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [carwashes]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[500px] rounded-lg border shadow-sm"
    />
  );
};
