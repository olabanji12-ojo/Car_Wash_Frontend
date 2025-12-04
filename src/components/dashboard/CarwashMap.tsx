import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Carwash {
  id: number;
  name: string;
  location: string;
  coordinates: [number, number]; // [lng, lat]
  rating: number;
  price: string;
}

const carwashes: Carwash[] = [
  {
    id: 1,
    name: "Sparkle Clean Auto Spa",
    location: "123 Oak St, Cityville",
    coordinates: [3.3792, 6.5244],
    rating: 4.8,
    price: "$25",
  },
  {
    id: 2,
    name: "Elite Detail Carwash",
    location: "456 Pine Ave, Townsville",
    coordinates: [3.3892, 6.5344],
    rating: 4.5,
    price: "$35",
  },
  {
    id: 3,
    name: "Supreme Shine Wash",
    location: "789 Elm Dr, Villagetown",
    coordinates: [3.3692, 6.5144],
    rating: 4.7,
    price: "$30",
  },
];

export const CarwashMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // TODO: Replace with your Mapbox public token from https://account.mapbox.com/access-tokens/
    mapboxgl.accessToken = 'pk.eyJ1IjoiYmp0b2Z1bm1pZSIsImEiOiJjbWVoc2pzd2swMHRnMmtzZGxpd3EwaXllIn0.GiS-6hLA9z75hEOJRQk7UQ';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [3.3792, 6.5244], // Lagos coordinates
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for each carwash
    carwashes.forEach((carwash) => {
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

      new mapboxgl.Marker(el)
        .setLngLat(carwash.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(
              `<div class="p-2">
                <h3 class="font-semibold">${carwash.name}</h3>
                <p class="text-sm text-gray-600">${carwash.location}</p>
                <p class="text-sm mt-1">⭐ ${carwash.rating} • ${carwash.price}</p>
              </div>`
            )
        )
        .addTo(map.current!);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[500px] rounded-lg border shadow-sm"
    />
  );
};
