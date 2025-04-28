import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import {L ,Popup } from "leaflet";
import 'leaflet-canvas-marker';

const CanvasMarker = ({ position, icon, draggable, eventHandlers, children }) => {
    const map = useMap();

    useEffect(() => {
        const marker = L.canvasMarker(position, {
            icon,
            draggable,
        });

        if (eventHandlers) {
            Object.keys(eventHandlers).forEach((event) => {
                marker.on(event, eventHandlers[event]);
            });
        }

        marker.addTo(map);

        return () => {
            marker.remove();
        };
    }, [position, icon, draggable, eventHandlers, map]);

    return children ? <Popup>{children}</Popup> : null;
};

export default CanvasMarker;