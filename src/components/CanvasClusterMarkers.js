import { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";


function CanvasClusterMarkers({ data, apiKey, arcgisRest, solveRoute, userLocation, setIsInsideGeofence }) {
  const map = useMap();
  const [destinationMarkerIndex, setDestinationMarkerIndex] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [geofences, setGeofences] = useState([]); 
  const markerClusterGroupRef = useRef(null); 
  const polylineRef = useRef(null); 
  const geofenceLayerRef = useRef(null); 
  const canvasRenderer = L.canvas({ padding: 0.5 });

  useEffect(() => {
    if (data.length > 0) {
      const newGeofences = data.map((item) => {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);
        const size = 0.0001;
        return [
          [lat - size, lng - size],
          [lat + size, lng - size],
          [lat + size, lng + size],
          [lat - size, lng + size],
        ];
      });
      setGeofences(newGeofences);
    }
  }, [data]);

  useEffect(() => {
    if (!map || geofences.length === 0) return;

    if (geofenceLayerRef.current) {
      map.removeLayer(geofenceLayerRef.current);
    }

    const geofenceLayer = L.layerGroup();
    geofences.forEach((geofence, index) => {
      const polygon = L.polygon(geofence, {
        color: "transparent", 
        weight: 0, 
        opacity: 0, 
        fillColor: "transparent", 
        fillOpacity: 0, 
      });
      polygon.bindPopup(`Geofence ${index + 1}`); 
      geofenceLayer.addLayer(polygon);
    });

    geofenceLayerRef.current = geofenceLayer;
    map.addLayer(geofenceLayer);
  }, [geofences, map]);

  const checkGeofence = (geofence, userLocation) => {
    const polygon = L.polygon(geofence);
    const latLng = L.latLng(userLocation[0], userLocation[1]);
    return polygon.getBounds().contains(latLng);
  };

  useEffect(() => {
    if (userLocation && geofences.length > 0) {
        let insideAnyGeofence = false; // Track if the user is inside any geofence

        geofences.forEach((geofence, index) => {
            if (checkGeofence(geofence, userLocation)) {
                console.log(`✅ User is inside geofence ${index + 1}`);
                insideAnyGeofence = true;
            }
        });

        setIsInsideGeofence(insideAnyGeofence); // Update state in Main.js
    } else {
      setIsInsideGeofence(false); // Reset if user is outside all geofences
    }
}, [userLocation, geofences, setIsInsideGeofence]);

  const handleSetDestination = (e, index) => {
    e.preventDefault();
    setDestinationMarkerIndex((prevIndex) => {
      if (prevIndex === index) {
        console.log("Unsetting destination for marker index:", index);
        setRouteCoordinates([]); 
        return null; 
      } else {
        console.log("Setting destination for marker index:", index);
        return index; 
      }
    });
  };

  useEffect(() => {
    if (destinationMarkerIndex !== null && userLocation) {
      const destinationCoordinates = data[destinationMarkerIndex];
      const authentication = arcgisRest.ApiKeyManager.fromKey(apiKey);
      const stops = [
        [userLocation[1], userLocation[0]], 
        [destinationCoordinates.longitude, destinationCoordinates.latitude], 
      ];

      const fetchRoute = async () => {
        try {
          const response = await solveRoute({
            stops: stops,
            authentication,
          });

          const {
            routes: {
              features: [{ geometry: { paths } }],
            },
          } = response;

          const routeCoordinates = paths[0].map((point) => [point[1], point[0]]);
          console.log("Route coordinates set:", routeCoordinates);
          setRouteCoordinates(routeCoordinates);
        } catch (error) {
          console.error("Error solving route:", error);
        }
      };

      fetchRoute();
    }
  }, [destinationMarkerIndex, userLocation, data, apiKey, arcgisRest, solveRoute]);

  useEffect(() => {
    if (!map) return;

    if (!markerClusterGroupRef.current) {
      markerClusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 200,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
      });

      data.forEach((item, index) => {
        const marker = L.circleMarker([item.latitude, item.longitude], {
          renderer: canvasRenderer,
          radius: 8,
          color: "#007BFF",
          fillColor: "#007BFF",
          fillOpacity: 0.8,
        });

        marker.options.customIndex = index;

        const getPopupContent = () => `
          <div>
            <h3>${item.Site_ID}</h3>
            <p>Latitude: ${item.latitude}</p>
            <p>Longitude: ${item.longitude}</p>
            <button
              class="btn btn-${destinationMarkerIndex === index ? 'danger' : 'primary'}"
              value="${item.latitude},${item.longitude}"
              id="popup-btn-${index}"
              style="cursor: pointer;"
            >
              ${destinationMarkerIndex === index ? 'Unset' : 'Set as Destination'}
            </button>
          </div>
        `;
        marker.bindPopup(getPopupContent());

        marker.on("popupopen", () => {
          const button = document.getElementById(`popup-btn-${index}`);
          if (button) {
            button.addEventListener("click", (e) => {
              handleSetDestination(e, index);
              marker.closePopup(); 
              marker.openPopup();
            });
          }
        });

        markerClusterGroupRef.current.addLayer(marker);
      });

      map.addLayer(markerClusterGroupRef.current);
    }

    markerClusterGroupRef.current.eachLayer((layer) => {
      if (layer.getPopup()) {
        const index = layer.options.customIndex;
        const isDestination = destinationMarkerIndex === index;

        const popupContent = `
          <div>
            <h3>${data[index]?.Site_ID || "Unknown"}</h3>
            <p>Latitude: ${layer.getLatLng().lat}</p>
            <p>Longitude: ${layer.getLatLng().lng}</p>
            <button
              class="btn btn-${isDestination ? 'danger' : 'primary'}"
              value="${layer.getLatLng().lat},${layer.getLatLng().lng}"
              id="popup-btn-${index}"
              style="cursor: pointer;"
            >
              ${isDestination ? 'Unset' : 'Set as Destination'}
            </button>
          </div>
        `;

        layer.setPopupContent(popupContent);

        setTimeout(() => {
          const button = document.getElementById(`popup-btn-${index}`);
          if (button) {
            button.addEventListener("click", (e) => {
              handleSetDestination(e, index);
              layer.closePopup(); 
              layer.openPopup();
            });
          }
        }, 0);
      }
    });
  }, [map, data, destinationMarkerIndex]);

  useEffect(() => {
    if (!map) return;

    map.createPane("polylinePane");
    map.getPane("polylinePane").style.zIndex = 399;

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (routeCoordinates.length > 0) {
      const polyline = L.polyline(routeCoordinates, {
        color: "blue",
        weight: 4,
        opacity: 0.8,
        pane: "polylinePane",
      }).addTo(map);

      polylineRef.current = polyline;
      map.fitBounds(polyline.getBounds());
    }
  }, [routeCoordinates, map]);

  return null;
}

export default CanvasClusterMarkers;