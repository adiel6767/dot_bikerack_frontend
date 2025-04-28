import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYWRpZWxtYXBib3giLCJhIjoiY201dDJmMDFxMGV4aTJpcG82NzI5OXIyciJ9.yqTyFMzDmb_ANTT2DMkGAg';

const MapboxMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 9 // starting zoom
    });
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />;
};

export default MapboxMap;