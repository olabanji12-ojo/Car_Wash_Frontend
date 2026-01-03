import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, Home } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface LiveTrackingMapProps {
    workerLocation?: [number, number]; // [lng, lat]
    customerLocation: [number, number]; // [lng, lat]
}

// Global Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoiYmp0b2Z1bm1pZSIsImEiOiJjbWVoc2pzd2swMHRnMmtzZGxpd3EwaXllIn0.GiS-6hLA9z75hEOJRQk7UQ';

/**
 * Step 3: The Canvas (Educational Component)
 * This component visualizes the "Straight Line" tracking approach.
 * It uses Mapbox markers to show the provider (Car) and customer (House).
 */
export const LiveTrackingMap = ({ workerLocation, customerLocation }: LiveTrackingMapProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const workerMarker = useRef<mapboxgl.Marker | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;

        // Use Lagos coordinates as default if none provided
        const initialCenter = workerLocation || customerLocation || [3.3792, 6.5244];

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11', // Cleaner style for tracking
            center: initialCenter,
            zoom: 15,
            pitch: 45, // Slight 3D effect
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // Add Customer Marker (House)
        const houseEl = document.createElement('div');
        houseEl.innerHTML = renderToStaticMarkup(
            <div className="bg-red-500 p-2 rounded-full shadow-lg border-2 border-white">
                <Home className="w-5 h-5 text-white" />
            </div>
        );
        new mapboxgl.Marker(houseEl)
            .setLngLat(customerLocation)
            .addTo(map.current);

        // Initial Worker Marker (Car)
        const carEl = document.createElement('div');
        carEl.innerHTML = renderToStaticMarkup(
            <div className="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white animate-bounce">
                <Truck className="w-6 h-6 text-white" />
            </div>
        );

        workerMarker.current = new mapboxgl.Marker(carEl)
            .setLngLat(workerLocation || customerLocation)
            .addTo(map.current);

        // Add route line source and layer on load
        map.current.on('load', () => {
            if (!map.current) return;

            map.current.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            workerLocation || customerLocation,
                            customerLocation,
                        ],
                    },
                },
            });

            map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 4,
                    'line-dasharray': [2, 1],
                },
            });
        });

        return () => {
            map.current?.remove();
        };
    }, []);

    // Sync movement when workerLocation changes
    useEffect(() => {
        if (workerMarker.current && workerLocation && map.current) {
            // 1. Update marker position
            workerMarker.current.setLngLat(workerLocation);

            // 2. Update line geometry
            const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource;
            if (routeSource) {
                routeSource.setData({
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [workerLocation, customerLocation],
                    },
                });
            }

            // 3. Smoothly follow the worker
            map.current.easeTo({
                center: workerLocation,
                duration: 1000,
                essential: true
            });
        }
    }, [workerLocation]);

    return (
        <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden border shadow-inner bg-slate-50 group">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Legend / Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100 pointer-events-auto">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">Live Tracking</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Worker is moving...</p>
                </div>
            </div>
        </div>
    );
};
