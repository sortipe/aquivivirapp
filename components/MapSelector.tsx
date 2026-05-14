
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const MapSelector = ({ latitude, longitude, onLocationChange }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    // Initialize map and handle cleanup
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [latitude, longitude],
                zoom: 15,
                scrollWheelZoom: true, 
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                onLocationChange(lat, lng);
            });

            mapRef.current = map;

            // FIX: Critical for maps inside modals/tabs. 
            // Forces Leaflet to recalculate container size after render.
            setTimeout(() => {
                map.invalidateSize();
            }, 200);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); 

    // Synchronize map/marker with props
    useEffect(() => {
        if (mapRef.current) {
            const latLng = L.latLng(latitude, longitude);
            const map = mapRef.current;

            // Update map view only if the point is not in current view to avoid jarring movements
            if (!map.getBounds().contains(latLng)) {
                 map.setView(latLng, map.getZoom());
            }

            // Create or update marker
            if (markerRef.current) {
                markerRef.current.setLatLng(latLng);
            } else {
                const newMarker = L.marker(latLng, { draggable: true }).addTo(map);
                
                // Update location when marker is dragged
                newMarker.on('dragend', (event) => {
                    const marker = event.target;
                    const position = marker.getLatLng();
                    onLocationChange(position.lat, position.lng);
                });
                
                // Ensure clicking map moves marker (handled by map click event props update)
                markerRef.current = newMarker;
            }
        }
    }, [latitude, longitude, onLocationChange]);

    // FIX: Observer to handle container resizing (e.g. window resize, scrollbar appearance)
    useEffect(() => {
        if (!mapContainerRef.current || !mapRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            mapRef.current?.invalidateSize();
        });
        
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return _jsx("div", { ref: mapContainerRef, className: "h-full w-full z-0 outline-none" });
};

export default MapSelector;
