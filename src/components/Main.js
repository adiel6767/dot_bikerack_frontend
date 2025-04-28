import React, { useEffect, useState, useRef } from 'react';
import * as turf from "@turf/turf";
import mapboxgl from "mapbox-gl";
import axios from 'axios';
import * as arcgisRest from '@esri/arcgis-rest-request';
import { solveRoute } from '@esri/arcgis-rest-routing';
import { Modal, Button, Nav, Popover, Toast, Container, Row, Col, Form, Alert  } from 'react-bootstrap';
import { Table } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsonData from '../map3.json';
import { 
  userMarkerIcon,
  dragMakerIcon,
  markerIcon,  
  dogeIcon, 
  defaultAvatar, 
  bird, 
  cow, 
  sheep,  
  award, 
  badge, 
  honor, 
  medal, 
  medal_2, 
  verified, 
  cycling, 
  cycling1, 
  mountainbike, 
  racing 
} from '../img/images';
// CSS
import '../css/Main.css';

// mapboxgl.accessToken = "pk.eyJ1IjoiYWRpZWxtYXBib3giLCJhIjoiY201dDJmMDFxMGV4aTJpcG82NzI5OXIyciJ9.yqTyFMzDmb_ANTT2DMkGAg"; 
mapboxgl.accessToken = 'pk.eyJ1IjoiYWRpZWxtYXBib3giLCJhIjoiY201dDJmMDFxMGV4aTJpcG82NzI5OXIyciJ9.yqTyFMzDmb_ANTT2DMkGAg';


const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_RADIUS = 150;
const TRACKING_RADIUS = 0.01; 


function Main() {
    const [showPopup, setShowPopup] = useState(true) 
    const [nearbyMarkers,setNearbyMarkers] = useState(null);
    const [destination, setDestination] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true); 
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markerClusterGroupRef = useRef(null);
    const [draggableMarkerId, setDraggableMarkerId] = useState(null);
    const [deletedMarkers, setDeletedMarkers] = useState([]);
    const [isRemovalMode, setIsRemovalMode] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showMarkerModal,setshowMarkerModal] = useState(false)


    // const handleShowModal = () => setshowMarkerModal(true);


    const openMarkerModal = () => {
        setshowMarkerModal(true); 
        setShowPopup(false); 
    };
    
    const handleCloseModal = () => {
        setShowPopup(true); 
        setshowMarkerModal(false);
        setSelectedRack(null);
        if (!confirmNewPosition){
            setChangeMarkerLocation(false)
            setDraggableMarkerId(null)
        }
    };
    
    const [leaderboardTable, setLeaderboardTable] = useState([]);
    const [isInsideGeofence, setIsInsideGeofence] = useState(false);
    const [BadgesList,setBadgestList] = useState([]);
    const [UserBadgesIds, setUserBadgesIds] = useState([]);
    const [UserAchievementsIds,setUserAchievementsIds] = useState([]);
    const [showTable,setShowTable] = useState(false); 
    const [showPopover, setShowPopover] = useState(false);
    const targetRef = useRef(null);
    const [UserData, setUserData] = useState({})
    const userData2 = JSON.parse(sessionStorage.getItem('userData'));
    const [AchievementsList,setAchievementsList] = useState([]);
    const [data, setData] = useState(jsonData);      
    // const [userLocation, setUserLocation] = useState(null);
    const [userLocation, setUserLocation] = useState([ 40.8279 ,-73.8790]);  
    const [show, setShow] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showAchievements, setAchievements] = useState(false)
    const [showLeaderboard, setLeaderboard] = useState(false)
    const [showProfile, setShowProfile] = useState(false);
    const [showEmblem, setShowEmblem] = useState(false);
    const [userImageId, setUserImageId] = useState([]);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [geofences, setGeofences] = useState([]);
    const [destinationMarkerIndex, setDestinationMarkerIndex] = useState(null);
    const images = [bird,cow,sheep,dogeIcon]
    const [closestBikeRacks, setClosestBikeRacks] = useState([]);
    const [selectedRack, setSelectedRack] = useState(null); 
    const [formData, setFormData] = useState({});
    const [markers, setMarkers] = useState([]);
    const [isAddingMarker, setIsAddingMarker] = useState(false);
    const [changeMarkerLocation, setChangeMarkerLocation] = useState(false);
    const [confirmNewPosition, setConfirmNewPosition] = useState(false);
    const [currentMarker, setCurrentMarker] = useState(null);
    const [newPosition, setNewPosition] = useState({});
    const [zoom, setZoom] = useState(15)
    const [assessmentIds, setAssessmentIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);
    // const [map, setMap] = useState(null);

    
    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        
        if (storedUserData) {
            try {
                const userData = JSON.parse(storedUserData);
    
                if (userData.assessment_ids && typeof userData.assessment_ids === 'string') {
                    const assessmentIdsArray = userData.assessment_ids.split(',');
                    setAssessmentIds(assessmentIdsArray);
                } else {
                    console.warn("`assessment_ids` is missing or invalid in stored user data.");
                }
            } catch (error) {
                console.error('Failed to parse stored user data:', error);
            }
        } else {
            console.warn('No stored user data found in localStorage.');
        }
    
        setLoading(false);
    }, []);
    

    const apiKey = process.env.REACT_APP_API_KEY; 
     


    const client = axios.create({
        baseURL: "https://dot-bikerack-backend-1.onrender.com",
        withCredentials: true 
      })

      const handleRackClick = (rack) => {
        console.log("Rack clicked:", rack); // Logs the rack object
    
        if (!assessmentIds.includes(rack.Site_ID)) {
            setSelectedRack(rack);
        } else {
            toast.warn("You have already assessed this bike rack.");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSubmitAssessment();
        const token = localStorage.getItem('accessToken'); 

    
        const formDataToSend = new FormData();
        
        for (const key in formData) {
            if (formData.hasOwnProperty(key)) {
                formDataToSend.append(key, formData[key]);  
            }
        }
    
        
        // for (const pair of formDataToSend.entries()) {
        //     console.log(pair[0], pair[1]);  
        // }
    
        client.post('/create_assessment/', formDataToSend)
            .then((response) => {
                setTimeout(() => toast.success("Assessment submitted successfully!"), 100);
                client.get('/user/',{headers: {
                    Authorization: `Bearer ${token}`
                }})
                    .then((response) => {
                        localStorage.setItem('userData', JSON.stringify(response.data));
                        const userData = JSON.parse(localStorage.getItem('userData'));

                        if (userData && userData.assessment_ids) {
                            const assessmentIdsArray = userData.assessment_ids.split(',');
                            setAssessmentIds(assessmentIdsArray);
                        }

                    })
                    .catch((error) => {
                        console.error('Error fetching user data:', error);
                    });
            })
            .catch((error) => {
                console.error('Error creating assessment:', error);
            });
    
        setFormData({});
        setSelectedRack(null);
        handleClose();
    };
    
    const handleBackClick = () => {
        setSelectedRack(null);

    };
    
    const handleClose = () => setShow(false);

    const handleBack = () => {
        setShowAbout(false);
        setShowProfile(false);
        setShowPopover(false);
        setAchievements(false);
    }

    const handleShow = () => {
        setShow(true);
        setShowAbout(false);
        setShowProfile(false);
    }
    
    const handleAboutClick = () => {
        setShowAbout(true);
    }

    const handleProfileClick = () => {
        const token = localStorage.getItem('accessToken'); 
        if (!token) {
            console.error("No access token found");
            return;
        }
    
        const headers = {
            Authorization: `Bearer ${token}`  
        };
    
        client.get("/user/", { headers })
            .then(function(res) {
                setUserImageId(res.data.image_id);
                setUserData(res.data);
                setShowProfile(true);
                setShowTable(true);
                setLeaderboard(false);
                setAchievements(false);
                setShowEmblem(false);
                
                const achievementsArray = res.data.achievements;
                setUserAchievementsIds(achievementsArray.map(obj => obj.id));
                const badgesArray = res.data.badges;
                setUserBadgesIds(badgesArray.map(obj => obj.id));
    
                return client.get("/achievements/", { headers });
            })
            .then(function(achievementsRes) {
                setAchievementsList(achievementsRes.data);
    
                return client.get("/badge/", { headers });
            })
            .then(function(badgesRes) {
                setBadgestList(badgesRes.data);
    
                return client.get("/leaderboard/", { headers });
            })
            .then(function(leaderboardRes) {
                setLeaderboardTable(leaderboardRes.data);
            })
            .catch(function(error) {
                console.error("Error fetching data:", error);
            });
    };
    

    const handleAvatarClick = () => {
        setShowPopover(prevShowPopover => !prevShowPopover);
    }

    const handleClickLeaderboard = () => {
        setLeaderboard(true)
        setShowTable(false)
        setAchievements(false)
        setShowEmblem(false)
    }

    const handleClickAchievements = () => {
        setAchievements(true)
        setShowEmblem(false)
        setShowTable(false)
        setLeaderboard(false)
    };

    const handleClickEmblems = () => {
        setShowEmblem(true)
        setShowTable(false)
        setAchievements(false)
        setLeaderboard(false)
    }

    const handleClickInfo = () => {
        setShowTable(true)
        setAchievements(false)
        setShowEmblem(false)
        setLeaderboard(false)
    }

    const badgeImages = {
        "Assessment Champion": award,
        "Geofence Guru": badge,
        "Infrastructure Advocate": honor,
        "Precision Mapper": medal,
        "Community Guardian": medal_2,
        "Urban Explorer": verified
    };

    const achievementImages = {
        "Trailblazer":cycling,
        "Map Master":cycling1,
        "Surveyor":mountainbike,
        "Community Builder":racing

    }
    
    function handleImageClick(index) {
        setUserImageId(index)
        const accessToken = localStorage.getItem("accessToken");

        const csrfToken  = getCookie('csrftoken')
        
        const payload = {
            image_id: index
        }

        const config = {
            headers: {
                'X-CSRFToken': csrfToken,
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json' 
            }
        };

        client.patch('/user/', payload, config)
        .then(function(res){
            console.log('handleImageClick',res.data)
        })
        .catch(function(error){
            console.error('handleImageClick', error);
        })
    }


    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }


    function handleCreateNewMarker (e) {
        setZoom(20)
        setIsAddingMarker(true);
        handleCloseModal();  
        console.log("Marker adding mode enabled");
        console.log(isAddingMarker)
    }

    const handleRemoveMarker = () => {
        setZoom(20)
        setIsRemovalMode(true); 
        handleCloseModal()
    };
    

    // const MapClickHandler = () => {
    //     useMapEvent('click', (e) => {
    //         toast.success("New marker added! Click save button to save to store all changes.");
    //         setMarkers((current) => [...current, e.latlng]);
    //     });
    //     return null;
    // };
    const handleDeleteMarker = (index, e) => {
        e.stopPropagation(); 
        setMarkers((current) => current.filter((_, i) => i !== index)); 
    };

    const handleSubmitMarkers = async () => {
        if (markers.length === 0) {
            setIsAddingMarker(false)
            toast.info("no markers added")
        }

        try {
            const response = await client.post('/submit_newmarkers/', { markers });
    
            if (response.status === 201) {  
                setMarkers([]); 
                toast.success("Markers successfully submitted!");
                openMarkerModal(true);
                setIsAddingMarker(false);
            } else {
                toast.error("Failed to submit markers. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting markers:", error);
            toast.error("An error occurred while submitting markers.");
        }
    };

    const handleDeletedMarker = (item) => {
        setDeletedMarkers((prevMarkers) => {
            const updatedMarkers = [...prevMarkers, item.site_id];
            return updatedMarkers;
        });
        toast.info(`A request of deletion for ${item.site_id} has been created. Click save to store all changes`);
    };

    const handleExitModes = async () => {
        openMarkerModal(true);
        setIsRemovalMode(false);
        setIsAddingMarker(false);
        setChangeMarkerLocation(false);
        setDeletedMarkers([])
        setMarkers([])
    };

    const handleSubmitDeletedMarkers = async () => {
        if (deletedMarkers.length === 0) {
            setIsRemovalMode(false);
            toast.info("no markers deleted")
            return; 
        }
    
        try {
            const response = await client.post('submit_deletemarkers/', {
                markers: deletedMarkers
            });
    
    
            openMarkerModal(true);
            setIsRemovalMode(false);
            toast.success('data saved successfully')
    
        } catch (error) {
            console.error("There was an error submitting the markers: ", error);
        }
    };

    
      const handleConfirm = () => {    
        setChangeMarkerLocation(false)
        setConfirmNewPosition(false)
        setshowMarkerModal(true)
      };


      const handleSubmitAssessment = () => {
            setFormData((prevPositions) => ({
            ...prevPositions,
            user:userData2.username,
            site_ID:selectedRack.properties.Site_ID,
            newPosition: JSON.stringify(newPosition),
            boroname: selectedRack.properties.boroname,
            latitude: selectedRack.properties.latitude,
            longitude: selectedRack.properties.longitude,
            }));
      }

    console.log('formdata',formData)

    //   const handlePhotoCapture = (photo) => {
    //     console.log('handlePhotoCapture', photo);
      
    //     setFormData((prevData) => ({
    //       ...prevData,
    //       imageFile: photo, 
    //     }));
    //   };

    useEffect(() => {
        console.log("🛠 draggableMarkerId changed:", draggableMarkerId);
    }, [draggableMarkerId]);
  
    const handleDragMarker = () => {
        if (!selectedRack || !selectedRack.properties) {
            console.error("Selected rack is not defined or does not have properties");
            return;
        }
        setDraggableMarkerId(selectedRack.properties.Site_ID);
        setshowMarkerModal(false);
        setChangeMarkerLocation(true);
    };
      
    const handleCloseChangeLocation = () => {
        setshowMarkerModal(false);
        setConfirmNewPosition(false)
        if (!changeMarkerLocation){
            setDraggableMarkerId(null)
            setFormData({})
            setSelectedRack(null)
        }

    }

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                // const newLocation = [pos.coords.longitude, pos.coords.latitude];
                const newLocation = [-73.8776, 40.8286 ];
                setUserLocation(newLocation);
                
    
                if (map.current) {
                    const source = map.current.getSource('user-location');
                    if (source) {
                        source.setData({
                            type: 'FeatureCollection',
                            features: [
                                {
                                    type: 'Feature',
                                    geometry: { type: 'Point', coordinates: newLocation },
                                    properties: {},
                                },
                            ],
                        });
                    } else {
                        console.warn("⚠️ 'user-location' source not found.");
                    }
                }
    
                if (map.current && isInitialLoad) {
                    map.current.flyTo({ center: newLocation, zoom: 17, essential: true });
    
                    setTimeout(() => {
                        setIsInitialLoad(false);
                    }, 5000);
                }
            },
            (err) => {
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000, 
            }
        );
    
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isInitialLoad]);

    const handlePointClick = (e) => {

        if (!map.current || !e.features || e.features.length === 0) {
            console.error("Map instance or features are missing.");
            return;
        }

        const coordinates = e.features[0].geometry.coordinates;
        const siteId = e.features[0].properties.Site_ID;

        map.current.flyTo({
            center: coordinates,
            zoom: map.current.getZoom(),
            essential: true,
        });
        
if (showPopup) {
        const popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
            <div style="color: black;">
                <strong>Site ID:</strong> ${siteId}<br>
                <strong>Coordinates:</strong> ${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}
                <button 
                    id="popupButton" 
                    data-coordinates="${coordinates[0]},${coordinates[1]}" 
                    data-siteid="${siteId}"
                    style="margin-top: 5px; padding: 5px 10px; background: ${
                        destination && destination.siteId === siteId ? "red" : "#007bff"
                    }; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    ${destination && destination.siteId === siteId ? "Unset Destination" : "Set as Destination"}
                </button>
            </div>
        `)
        .addTo(map.current);
    }
    
    // Add event listener after popup renders
    setTimeout(() => {
        const button = document.getElementById("popupButton");
        if (button) {
            button.addEventListener("click", () => {
                const coords = button.getAttribute("data-coordinates").split(",").map(Number);
                const siteId = button.getAttribute("data-siteid");
    
                setDestination((prevDestination) => {
                    const isUnsetting = prevDestination && prevDestination.siteId === siteId;
    
                    // Manually update the button immediately
                    button.textContent = isUnsetting ? "Set as Destination" : "Unset Destination";
                    button.style.background = isUnsetting ? "#007bff" : "red";
    
                    if (isUnsetting) {
                        console.log("🚫 Unsetting destination...");
    
                        // **Clear route coordinates & remove from map**
                        setRouteCoordinates([]);
                        if (map.current.getSource("route")) {
                            map.current.removeLayer("route");
                            map.current.removeSource("route");
                        }
    
                        return null; // Unset destination
                    } else {
                        console.log("✅ Setting new destination...");
                        return { coordinates: coords, siteId }; // Set new destination
                    }
                });
            });
        }
    }, 100);
    };
      
    useEffect(() => {
        if (!mapContainer.current || map.current) return;
    
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/light-v10",
            center: userLocation || [-73.8790, 40.8279], // Default center
            zoom: 10,
        });
    
        map.current.on("load", () => {
            console.log("Map fully loaded ✅");
            setMapLoaded(true);
    
            if (!map.current.getSource("user-location")) {
                map.current.addSource("user-location", {
                    type: "geojson",
                    data: { type: "FeatureCollection", features: [] },
                });
    
                map.current.addLayer({
                    id: "user-location",
                    type: "circle",
                    source: "user-location",
                    paint: {
                        "circle-color": "red",
                        "circle-radius": 7,
                        "circle-stroke-width": 0,
                    },
                });
            }
    
            if (data.length > 0) {    
                const newGeofences = data.map((item, index) => {
                    const lat = parseFloat(item.latitude);
                    const lng = parseFloat(item.longitude);
                    const size = 0.00006;
    
                    return {
                        type: "Feature",
                        properties: { id: index },
                        geometry: {
                            type: "Polygon",
                            coordinates: [[
                                [lng - size, lat - size],
                                [lng + size, lat - size],
                                [lng + size, lat + size],
                                [lng - size, lat + size],
                                [lng - size, lat - size],
                            ]],
                        },
                    };
                });
    
                setGeofences(newGeofences);
    
                if (map.current.getSource("geofences")) {
                    map.current.removeLayer("geofence-layer");
                    map.current.removeSource("geofences");
                }
    
                map.current.addSource("geofences", {
                    type: "geojson",
                    data: {
                        type: "FeatureCollection",
                        features: newGeofences,
                    },
                });
    
                map.current.addLayer({
                    id: "geofence-layer",
                    type: "fill",
                    source: "geofences",
                    paint: {
                        "fill-color": "#3498db", 
                        "fill-opacity": 0,
                        "fill-outline-color": "#000000",
                    },
                });
    
                console.log("✅ Geofence layer added!");
            }
        });
    
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [data]);

    useEffect(() => {
        if (!map.current || !draggableMarkerId || data.length === 0) return;
    
        console.log("🔄 Updating for draggableMarkerId:", draggableMarkerId);
    
        // Find the selected marker's coordinates
        const selectedSite = data.find((site) => site.Site_ID === draggableMarkerId);
        if (!selectedSite) return;
    
        const { latitude, longitude } = selectedSite;
    
        // 🔹 Step 1: Update the color of the existing circle marker
        map.current.setPaintProperty("unclustered-point", "circle-color", [
            "case",
            ["==", ["get", "Site_ID"], draggableMarkerId], "#FFA500",  // 🟠 Orange for selected
            "#11b4da"  // 🔵 Default blue
        ]);
    
        // 🔹 Step 2: Create a regular draggable Mapbox marker
        const draggableMarker = new mapboxgl.Marker({
            color: "#FF0000", // 🔴 Red marker on top of the circle
            draggable: true
        })
            .setLngLat([longitude, latitude])
            .addTo(map.current);
    
        // 🔹 Step 3: Handle drag end
        draggableMarker.on("dragend", () => {
            const lngLat = draggableMarker.getLngLat();
            console.log("📍 New Marker Position:", lngLat);
        
            // ✅ Ensure values are numbers
            setNewPosition({ 
                latitude: Number(lngLat.lat), 
                longitude: Number(lngLat.lng) 
            });
            
            setConfirmNewPosition(true);
            setshowMarkerModal(true);
        });
        // Cleanup previous draggable marker when changing selection
        return () => {
            draggableMarker.remove();
        };
    
    }, [draggableMarkerId, data]);

    console.log('confirm',confirmNewPosition)

    
    useEffect(() => {
        if (!userLocation || !data.length) return;
    
        const markersGeoJSON = data.map((item) => {
            return turf.point([parseFloat(item.longitude), parseFloat(item.latitude)], { Site_ID: item.Site_ID, boroname: item.boroname, latitude: item.latitude, longitude: item.longitude });
        });
    
        const userPoint = turf.point(userLocation); 
        const nearbyMarkers = markersGeoJSON.filter(marker => {
            const distance = turf.distance(userPoint, marker, { units: "kilometers" });
            return distance <= TRACKING_RADIUS;
        });
        
        setClosestBikeRacks(nearbyMarkers); 
    
    }, [userLocation, data]);    
    

useEffect(() => {
    if (!userLocation || geofences.length === 0) return;
    
    geofences.forEach((geofence) => {
        const userPoint = turf.point(userLocation);
        const polygon = turf.polygon(geofence.geometry.coordinates);

        if (turf.booleanPointInPolygon(userPoint, polygon)) {
            setIsInsideGeofence(true);
        }
    });
}, [userLocation, geofences]);

    
    useEffect(() => {
        if (!userLocation || !destination) return; // Ensure both are available
   
        const fetchRoute = async () => {
            try {
                const authentication = arcgisRest.ApiKeyManager.fromKey(apiKey);
    
                const stops = [
                    [userLocation[0], userLocation[1]], 
                    [destination.coordinates[0], destination.coordinates[1]],   
                ];    
                const response = await solveRoute({
                    stops: stops,
                    authentication,
                });
        
                const paths = response.routes.features[0].geometry.paths[0]; 
                const routeCoordinates = paths.map(([lng, lat]) => [lng, lat]);
        
                setRouteCoordinates(routeCoordinates);
            } catch (error) {
                console.error("❌ Error solving route:", error);
            }
        };
    
        fetchRoute();
    }, [userLocation, destination]); 
    


    useEffect(() => {
        if (!mapLoaded || !map.current || routeCoordinates.length === 0) return;
    
        console.log("Updating route visualization...");
    
        const addRouteLayer = () => {
            console.log("🗺️ Adding/updating route source...");
    
            if (!map.current.getSource("route")) {
                map.current.addSource("route", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: routeCoordinates,
                        },
                    },
                });
    
                map.current.addLayer({
                    id: "route",
                    type: "line",
                    source: "route",
                    paint: {
                        "line-color": "#FF0000",
                        "line-width": 4,
                    },
                });
            } else {
                map.current.getSource("route").setData({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: routeCoordinates,
                    },
                });
            }
        };
    
        if (map.current.isStyleLoaded()) {
            addRouteLayer();
        } else {
            map.current.once("style.load", addRouteLayer);
        }
    }, [routeCoordinates, mapLoaded]);
    
    useEffect(() => {
        if (!mapLoaded || !data || !Array.isArray(data) || !map.current) return;

        const geoJSONData = {
            type: "FeatureCollection",
            features: data.map((item) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [item.longitude, item.latitude],
                },
                properties: { ...item },
            })),
        };

        if (!map.current.getSource("sites")) {
            map.current.addSource("sites", {
                type: "geojson",
                data: geoJSONData,
                cluster: true,
                clusterMaxZoom: CLUSTER_MAX_ZOOM,
                clusterRadius: CLUSTER_RADIUS,
            });

            map.current.addLayer({
                id: "clusters",
                type: "circle",
                source: "sites",
                filter: ["has", "point_count"],
                paint: {
                    "circle-color": "#e6a051",
                    "circle-radius": 20,
                },
            });

            map.current.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "sites",
                filter: ["has", "point_count"],
                layout: {
                    "text-field": "{point_count_abbreviated}",
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 12,
                },
            });

            map.current.addLayer({
                id: "unclustered-point",
                type: "circle",
                source: "sites",
                filter: ["!", ["has", "point_count"]],
                paint: {
                    "circle-color": "#11b4da",
                    "circle-radius": 8,
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "#fff",
                },
            });

            console.log("Data source and layers added!");
        } else {
            map.current.getSource("sites").setData(geoJSONData);
        }

        map.current.on("click", "unclustered-point", handlePointClick);
        map.current.on("click", "clusters", handleClusterClick);

        return () => {
            if (map.current) {
                map.current.off("click", "unclustered-point", handlePointClick);
                map.current.off("click", "clusters", handleClusterClick);
            }
        };
    }, [mapLoaded, data, handlePointClick]);

     // Handles clicking on a cluster to expand it
    const handleClusterClick = (e) => {
        if (!map.current) return;

        const features = map.current.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource("sites").getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            if (!map.current) return;

            map.current.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom,
            });
        });
    };

  return (
        <div className="map-container">
            <ToastContainer />
            {/* {!userLocation ? (
            <div>Loading...</div>
            ) : ( */}
            {/* !showMarkerModal && !show && ( */}
            {!mapLoaded && <p>Loading map...</p>}
                <div
                ref={mapContainer} 
                style={{ width: '100%', height: '100vh', overflow:'hidden' }} 
              />
            {/* ) */}
        
            {changeMarkerLocation && !showMarkerModal && !show &&(
                <Button variant="danger" className='create_assessment' onClick={handleExitModes}>
                            Back to Form
                </Button>
            )}
        
            {isAddingMarker && isInsideGeofence && (
                <Button variant="danger" className='create_assessment' onClick={handleExitModes}>
                            Exit Create Marker Mode
                </Button>
            )}

            
            {isRemovalMode && isInsideGeofence && (
                <Button variant="danger" className='create_assessment' onClick={handleExitModes}>
                            Exit Removal Mode
                </Button>
            )}
            {isAddingMarker && (
                    <Button variant='primary' className='floating-button'  onClick={handleSubmitMarkers}>Save</Button>
                )}
            {isRemovalMode && (
                <Button variant='primary' className='floating-button'  onClick={handleSubmitDeletedMarkers}>Save</Button>
            )}
            {!show && !showMarkerModal && !isAddingMarker && !isRemovalMode && (
                <Button className='floating-button' onClick={handleShow}>
                    Menu
                </Button>
            )}
            <div>
                {!show && !showMarkerModal && !isRemovalMode && !isAddingMarker && isInsideGeofence && !changeMarkerLocation && (
                    <Button className='create_assessment' onClick={openMarkerModal}>
                        Create Assessment
                    </Button>
                )}
            </div>

            <Toast 
                onClose={() => setShowToast(false)} 
                show={showToast} 
                delay={5000} 
                autohide
                className="bg-warning text-dark"
                style={{
                    position: 'fixed',
                    top: 20,
                    width:'300px',
                    zIndex: 1000,
                }}
            >
                <Toast.Header>
                    <strong className="mr-auto">Notification</strong>
                </Toast.Header>
                <Toast.Body>Click 'Create Assessment' to proceed.</Toast.Body>
            </Toast>
            
            <Modal show={showMarkerModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{isAddingMarker || isRemovalMode || confirmNewPosition ? ('Save changes'):selectedRack ? `Create Assessment for ${selectedRack.properties.Site_ID}` : 'Select Bikerack'}</Modal.Title>                
                </Modal.Header>
                    <Modal.Body>
                <Container>
                    {confirmNewPosition ?(
                        <Row className="g-3">
                            <h3>save new position?</h3>
                        </Row>
                    ) : isRemovalMode ? (
                        <Row className="g-3">
                            <h3>Are you sure you want to save this information?</h3>
                        </Row>
                     ) : !selectedRack ? (
                        <Row className="g-3">
                            <h3>Available Bike Racks</h3>
                            {closestBikeRacks.map((rack, index) => {
                                return (
                                    <Col 
                                        key={index} 
                                        className="card border-light mb-3" 
                                        onClick={() => handleRackClick(rack)}                     
                                        style={{ 
                                            cursor: assessmentIds.includes(rack.properties.Site_ID) ? 'not-allowed' : 'pointer', 
                                            height: '30px', 
                                            width: '18rem', 
                                            marginRight: '15px', 
                                            marginBottom: '15px',
                                            opacity: assessmentIds.includes(rack.properties.Site_ID) ? 0.5 : 1 
                                        }}
                                    >
                                        {rack.properties.Site_ID}
                                    </Col>
                                );
                            })}
                            <Alert variant="warning">
                                If you find a bike rack in the real world that is not registered in the database, please add a marker for its correct location. 
                                If a bike rack appears in the dataset but does not exist in the real world, you can remove it from the map.
                            </Alert>
                            <Button variant="primary" onClick={handleCreateNewMarker}>Add Missing Bike Rack</Button>
                            <Button variant="danger" onClick={handleRemoveMarker}>Remove Non-existent Bike Rack</Button>
                        </Row>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            <Form.Group controlId="formCondition">
                                <Form.Label>
                                    <b>Bike Rack Type</b>
                                </Form.Label>
                                <Form.Select
                                    name="rackType"
                                    value={formData.rackType || ''}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>Select the condition</option>
                                    <option value="Large Hoop">Large Hoop</option>
                                    <option value="Small Hoop">Small Hoop </option>
                                    <option value="U Rack">U Rack </option>
                                    <option value="Sled Rack">Sled Rack </option>
                                    <option value="Bike Corral">Bike Corral </option>
                                    <option value="Other Racks">Other Racks </option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group controlId="formCondition">
                                <Form.Label>
                                    <b>Bike Rack Condition</b>
                                </Form.Label>
                                <Form.Select
                                    name="condition"
                                    value={formData.condition || ''}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>Select the condition</option>
                                    <option value="Loose">Loose</option>
                                    <option value="Damaged">Damaged </option>
                                    <option value="Down">Down </option>
                                    <option value="Missing">Missing </option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group controlId="formImage">
                                <Form.Label>
                                    <b>Take a Picture</b>
                                </Form.Label>
                                {/* <CameraCapture onPhotoCapture={handlePhotoCapture} /> */}
                            </Form.Group>
                            <Form.Group controlId="formAssessment">
                                <Form.Label>
                                    <b>Change Bikerack Location</b>
                                </Form.Label>
                            </Form.Group>
                            <Button onClick={handleDragMarker}>Change Location</Button>
                            <div>{JSON.stringify(newPosition)}</div>
                            <Form.Group controlId="formAssessment">
                                <Form.Label>
                                    <b>Additional Comments</b>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    name="assessment"
                                    value={formData.assessment || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter any additional comments"
                                />
                            </Form.Group>
                            <br />
                            <Button variant="primary" type="submit" onClick={handleSubmitAssessment}>
                                Submit Assessment
                            </Button>
                        </Form>
                    )}
                </Container>
            </Modal.Body>
                <Modal.Footer>
                {selectedRack && !confirmNewPosition &&(
                    <Button 
                        variant="secondary" 
                        onClick={handleBackClick} 
                        style={{ marginRight: '10px' }}
                    >
                        Back
                    </Button>
                )}
                {confirmNewPosition && (
                    <Button variant='primary' onClick={handleConfirm}>Save</Button>
                )}
                    <Button variant="danger" onClick={handleCloseChangeLocation}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    {
                    showProfile ? (
                    <div>
                    <Modal.Title>Profile</Modal.Title>
                        <li className='profile-nav'>
                        <button className='nav-link' onClick={handleClickInfo}>
                            Info
                        </button>
                        <button className='nav-link' onClick={handleClickAchievements}>
                            Achievements
                        </button>
                        <button className='nav-link' onClick={handleClickEmblems}>
                            Emblems
                        </button>
                        <button className='nav-link' onClick={handleClickLeaderboard}>
                            Leaderboard
                        </button>
                        </li>
                    </div>):showAbout ? (
                        <Modal.Title>About</Modal.Title>
                    ):(
                    <Modal.Title>Menu</Modal.Title>
                    )}
                </Modal.Header>

                <Modal.Body>
                    {showAbout ? (
                        <section id="about" style={{padding: '20px'}}>
                        <h2>About NYC Bike Rack Assessments</h2>
                        <p>
                            Welcome to <strong>NYC Bike Rack Assessments</strong>, a community-driven platform dedicated to improving the quality and availability of bike racks throughout New York City.
                        </p>
                        <p>
                            Our mission is simple: empower cyclists to share their insights and help ensure that NYC remains a bike-friendly city. By creating assessments of bike racks, users contribute to a growing database that informs both the community and city planners about the condition, usability, and maintenance needs of bike racks across all five boroughs.
                        </p>
                        <h3>Here’s how you can make an impact:</h3>
                        <ul>
                            <li><strong>Create Assessments:</strong> Spot a bike rack? Rate its condition, note its accessibility, and report any issues. Every assessment helps keep NYC's cycling infrastructure up-to-date.</li>
                            <li><strong>Earn Emblems & Achievements:</strong> Your contributions don’t go unnoticed! As you complete more assessments, you’ll unlock various emblems and achievements that reflect your expertise and dedication to making NYC a better place for cyclists.</li>
                            <li><strong>Level Up:</strong> Gain experience points with every assessment and level up through your journey, from a rookie cyclist to a seasoned bike advocate!</li>
                        </ul>
                        <p>
                            Together, we can improve the cycling experience in New York City, one bike rack at a time.
                        </p>
                    </section>
                    
                    ) : showProfile ? (
                        <div>
                        <section id='profile'>
                            <div
                            className="avatar-frame"
                            onClick={handleAvatarClick}
                            ref={targetRef}
                            >
                            {userImageId === 0 ? (
                                <img src={bird} alt="" className="avatar-img" />
                            ) : userImageId === 1 ? (
                                <img src={cow} alt="" className="avatar-img" />
                            ) : userImageId === 2 ? (
                                <img src={sheep} alt="" className="avatar-img" />
                            ) : userImageId === 3 ? (
                                <img src={dogeIcon} alt="" className="avatar-img" />
                            ) : (
                                <img src={defaultAvatar} alt="" className="avatar-img" />
                            )}
                            </div>
                            {showPopover && (
                            <Popover.Body>
                                <br />
                                <div className="image-gallery" style={{ textAlign: 'left' }}> 
                                    {images.map((image, index) => (
                                    <img className='avatar-frame' key={index} src={image} alt={`${index}`} onClick={() => handleImageClick(index)} />
                                    ))}
                                </div>
                            </Popover.Body>
                        )}
                        <div>
                        <b>{UserData.username}</b>
                        <hr />
                        {showLeaderboard ? (<div>
                            <h1>Leaderboard</h1>
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>User</th>
                                        <th>Assessment Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboardTable.map((leader, index) => (
                                        <tr key={leader.id}>
                                            <td>{index + 1}</td>
                                            <td>{leader.username}</td>
                                            <td>{leader.assessment_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            </div>): 
                        showEmblem ? (
                        <div>
                            <h1>Emblems</h1>
                            <hr />
                            {BadgesList.map(badge => (
                            <div key={badge.id} className={`badge-container ${!UserBadgesIds.includes(badge.id) ? 'disabled' : ''}`}>
                                <img className='avatar-frame' src={badgeImages[badge.name]} alt={badge.name} style={{ border: 'none' }} />
                                <h4>{badge.name}</h4>
                                <p>{badge.description}</p>
                                {UserBadgesIds.includes(badge.id) ? <b>Achieved</b> : <b>In Progress</b>}
                                <hr />
                            </div>
                            ))}
                        </div>
                        ):
                        showAchievements ? (<div>
                            <h1>Achievements</h1>
                            <hr />
                            {AchievementsList.map(achievement => (
                                <div key={achievement.id} className={`achievement-container ${!UserAchievementsIds.includes(achievement.id) ? 'disabled' : ''}`}>
                                <img className='avatar-frame' src={achievementImages[achievement.name]} alt={achievement.name} style={{ border: 'none' }} />
                                    <h4>{achievement.name}</h4>
                                    <p>{achievement.description}</p>
                                    {UserAchievementsIds.includes(achievement.id) ? <b>Achieved</b>  : <b>In Progress</b>}
                                    <hr />
                                </div>
                            ))}
                            </div>): showTable ? (
                        <div>
                            <Table striped bordered hover>
                            <thead>
                                <tr>
                                <th>Assessment Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                <td>{UserData.assessment_count}</td>
                                </tr>
                                <tr>
                                </tr>
                            </tbody>
                        </Table>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                <th>Achievements Completed</th>
                                <th>Badges Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                <td>{UserData.achievements_completed}</td>
                                <td>{UserData.badges_earned}</td>
                                </tr>
                                <tr>
                                </tr>
                            </tbody>
                        </Table>
                        </div>
                        ) : null}
                        </div>
                        </section>
                        </div>
                    ) : (
                        <Nav className="navbar">
                        <ul className='navbar-nav'>
                            <li className='nav-item active'>
                            <button className='nav-link' onClick={handleProfileClick}>
                                Profile
                            </button>
                            </li>
                            <li className='nav-item active'>
                            <button className='nav-link' onClick={handleAboutClick}>About</button>
                            </li>
                        </ul>
                        </Nav>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    {showAbout || showProfile ? (
                        <Button variant='primary' onClick={handleBack}>Back</Button> 
                    ) : null}
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
         </div>
    );
}

export default Main;