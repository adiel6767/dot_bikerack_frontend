import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import CameraCapture from './CameraCapture';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvent, Polygon  } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from 'react-leaflet-cluster';
import * as arcgisRest from '@esri/arcgis-rest-request';
import { solveRoute } from '@esri/arcgis-rest-routing';
import { Modal, Button, Nav, Popover, Toast, Container, Row, Col, Form, Alert  } from 'react-bootstrap';
import { Table } from 'react-bootstrap';

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

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula to calculate distance between two coordinates
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}


function Main() {
    const [draggableMarkerId, setDraggableMarkerId] = useState(null);
    const [deletedMarkers, setDeletedMarkers] = useState([]);
    const [isRemovalMode, setIsRemovalMode] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showMarkerModal,setshowMarkerModal] = useState(false)
    const handleShowModal = () => setshowMarkerModal(true);
    const handleCloseModal = () => {
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
    const userData2 = JSON.parse(localStorage.getItem('userData'));
    const [AchievementsList,setAchievementsList] = useState([]);
    const [data, setData] = useState([]);
    const [userLocation, setUserLocation] = useState([]);
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


    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        
        if (storedUserData) {
            const userData = JSON.parse(storedUserData);
            if (userData.assessment_ids) {
                const assessmentIdsArray = userData.assessment_ids.split(',');
                setAssessmentIds(assessmentIdsArray);
            }
        }
        setLoading(false);
    }, []);

    const apiKey = process.env.REACT_APP_API_KEY; 
    


    const client = axios.create({
        baseURL: "https://dot-bikerack-backend-1.onrender.com",
        withCredentials: true 
      })



    // useEffect for fetching data
useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await fetch('https://data.cityofnewyork.us/resource/592z-n7dk.json');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const jsonData = await response.json();
            console.log('response', jsonData);
            setData(jsonData);
            console.log('data length', jsonData.length); // log jsonData.length instead of data.length
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData();
}, []);

// useEffect for geolocation
useEffect(() => {
    if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation = [position.coords.latitude, position.coords.longitude];
                setUserLocation(newLocation);
                localStorage.setItem('userLocation', JSON.stringify(newLocation)); // Save to local storage
                console.log('Updated user location:', newLocation);
            },
            (error) => {
                console.error('Error getting user location:', error);
            }
        );

        // Cleanup the watchPosition when the component unmounts
        return () => navigator.geolocation.clearWatch(watchId);
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}, []);

    
    useEffect(() => {
        if (data.length > 0) {
            const newGeofences = data.map(item => {
                const lat = parseFloat(item.latitude);
                const lng = parseFloat(item.longitude);
                const size = 0.00003;
                return [
                    [lat - size, lng - size],
                    [lat + size, lng - size],
                    [lat + size, lng + size],
                    [lat - size, lng + size]
                ];
            });
            setGeofences(newGeofences);
        }
    }, [data]);

    console.log(JSON.stringify(formData, null, 2));      
    const checkGeofence = (geofence, userLocation) => {
        const polygon = L.polygon(geofence);
        const latLng = L.latLng(userLocation[0], userLocation[1]);
        return polygon.getBounds().contains(latLng);
    };
    
    const handleRackClick = (rack) => {
        // Check if the rack's site_id is in the user's assessment_ids
        if (!assessmentIds.includes(rack.site_id)) {
            // Only allow setting the selected rack if it hasn't been assessed
            setSelectedRack(rack);
        } else {
            // Optionally show an alert or any feedback to the user
            alert("You have already assessed this bike rack.");
        }
    };
    // Handle form input change
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
    
        // Optional: Debugging the FormData content
        for (const pair of formDataToSend.entries()) {
            console.log(pair[0], pair[1]);  // Log each key-value pair for verification
        }
    
        // Submit the FormData to your backend first
        client.post('/create_assessment/', formDataToSend)
            .then((response) => {
                console.log('Assessment created successfully:', response.data);
                setTimeout(() => alert("Assessment submitted successfully!"), 100);
                // Now, fetch the user data after assessment is created
                client.get('/user/',{headers: {
                    Authorization: `Bearer ${token}`
                }})
                    .then((response) => {
                        console.log('User data:', response.data);
                        localStorage.setItem('userData', JSON.stringify(response.data));
                        const userData = JSON.parse(localStorage.getItem('userData'));

                        if (userData && userData.assessment_ids) {
                            const assessmentIdsArray = userData.assessment_ids.split(',');
                            setAssessmentIds(assessmentIdsArray);
                        }

                        console.log('Assessment IDs set in state:', assessmentIds); 
                    })
                    .catch((error) => {
                        console.error('Error fetching user data:', error);
                    });
            })
            .catch((error) => {
                console.error('Error creating assessment:', error);
                // Handle error (e.g., show an error message)
            });
    
        // Reset the form after submission
        setFormData({});
        setSelectedRack(null);
        handleClose();
    };
    
    const handleBackClick = () => {
        setSelectedRack(null);

    };

    const handleExitMarkerMode = () => {
        if (markers.length > 0) {
            handleSubmitMarkers(); 
        }
        setIsAddingMarker(false);
        setIsRemovalMode(false)
    };

    useEffect(() => {
        if (userLocation && geofences.length > 0) {
            let inside = false;
            for (let i = 0; i < geofences.length; i++) {
                if (checkGeofence(geofences[i], userLocation)) {
                    console.log(`User is inside geofence ${i + 1}`);
                    setIsInsideGeofence(true);
    
                    // Find the closest bike racks within this geofence
                    const sortedBikeRacks = data
                        .filter(item => checkGeofence([
                            [parseFloat(item.latitude) - 0.00003, parseFloat(item.longitude) - 0.00003],
                            [parseFloat(item.latitude) + 0.00003, parseFloat(item.longitude) - 0.00003],
                            [parseFloat(item.latitude) + 0.00003, parseFloat(item.longitude) + 0.00003],
                            [parseFloat(item.latitude) - 0.00003, parseFloat(item.longitude) + 0.00003]
                        ], userLocation))
                        .map(item => ({
                            ...item,
                            distance: calculateDistance(userLocation[0], userLocation[1], parseFloat(item.longitude), parseFloat(item.latitude))
                        }))
                        .sort((a, b) => a.distance - b.distance);
    
                    setClosestBikeRacks(sortedBikeRacks);
                    break; // Stop checking once we've found the user inside a geofence
                }
            }
        }
    }, [userLocation, geofences, data]);

    useEffect(() => {
        if (isInsideGeofence) {
            setShowToast(true);
        }
    }, [isInsideGeofence]);

    const handleSetDestination = async (e, index) => {
        // console.log('Button Value:', e.currentTarget.value);
        const destinationCoordinates = e.currentTarget.value.split(',').map(parseFloat);
        // console.log('destination',destinationCoordinates)
        
        if (destinationMarkerIndex === index) {
            // Unset the destination
            setDestinationMarkerIndex(null);
            setRouteCoordinates([]);
            return;
        }

        // Set the new destination
        setDestinationMarkerIndex(index);

        if (userLocation) {
            const authentication = arcgisRest.ApiKeyManager.fromKey(apiKey);


            const stops = [
                [userLocation[1], userLocation[0]],
                [destinationCoordinates[1], destinationCoordinates[0]], 
            ];

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
                setRouteCoordinates(routeCoordinates);
            } catch (error) {
                console.error('Error solving route:', error);
            }
        }
    };

    const customIcon = L.icon({
        iconUrl: markerIcon,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    const customIcon2 = L.icon({
        iconUrl: dragMakerIcon,
        iconSize: [38, 38], 
        iconAnchor: [19, 38], 
        popupAnchor: [0, -38], 
      });
    
    const userIcon = L.icon({
        iconUrl: userMarkerIcon,
        iconSize: [30, 30],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });
    
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
            Authorization: `Bearer ${token}`  // Include the token in the Authorization header
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
                console.log('achievementsArray',achievementsArray)
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

    const spiderfyShapePositions = (count, centerPt) => {
        const distanceFromCenter = 35;
        const markerDistance = 45;
        const lineLength = markerDistance * (count - 1);
        const lineStart = centerPt.y - lineLength / 2;
        const res = [];

        for (let i = count - 1; i >= 0; i--) {
            res[i] = L.point(centerPt.x + distanceFromCenter, lineStart + markerDistance * i);
        }

        return res;
    };
        
    const clusterOptions = {
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyShapePositions
    };

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
    

    const MapClickHandler = () => {
        useMapEvent('click', (e) => {
            alert("New marker added! Click save button to save to store all changes.");
            setMarkers((current) => [...current, e.latlng]);
            console.log(markers)
        });
        return null;
    };

    const handleDeleteMarker = (index, e) => {
        e.stopPropagation(); 
        setMarkers((current) => current.filter((_, i) => i !== index)); 
    };

    const handleSubmitMarkers = async () => {
        if (markers.length === 0) {
            setIsAddingMarker(false)
            alert("no markers added")
        }

        try {
            const response = await client.post('/submit_newmarkers/', { markers });
    
            if (response.status === 201) {  
                setMarkers([]); 
                alert("Markers successfully submitted!");
                handleShowModal(true);
                setIsAddingMarker(false);
            } else {
                alert("Failed to submit markers. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting markers:", error);
            alert("An error occurred while submitting markers.");
        }
    };

    const handleDeletedMarker = (item) => {
        setDeletedMarkers((prevMarkers) => {
            const updatedMarkers = [...prevMarkers, item.site_id];
            return updatedMarkers;
        });
        alert(`A request of deletion for ${item.site_id} has been created. Click save to store all changes`);
    };

    const handleExitModes = async () => {
        handleShowModal(true);
        setIsRemovalMode(false);
        setIsAddingMarker(false);
        setChangeMarkerLocation(false);
        setDeletedMarkers([])
        setMarkers([])
    };

    const handleSubmitDeletedMarkers = async () => {
        if (deletedMarkers.length === 0) {
            setIsRemovalMode(false);
            alert("no markers deleted")
            return; 
        }
    
        try {
            const response = await client.post('submit_deletemarkers/', {
                markers: deletedMarkers
            });
    
            console.log("Response: ", response.data);
    
            handleShowModal(true);
            setIsRemovalMode(false);
            alert('data saved successfully')
    
        } catch (error) {
            console.error("There was an error submitting the markers: ", error);
        }
    };

    
      const handleDragEnd = (e, siteId) => {
        const position = e.target.getLatLng();
        setNewPosition({ lat: position.lat, lng: position.lng });
        setCurrentMarker(siteId);  
        setshowMarkerModal(true);  
        setConfirmNewPosition(true)
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
            site_ID:selectedRack.site_id,
            newPosition: JSON.stringify(newPosition),
            boroname: selectedRack.boroname,
            latitude: selectedRack.latitude,
            longitude: selectedRack.longitude,
            }));
      }

      const handlePhotoCapture = (photo) => {
        console.log('handlePhotoCapture', photo);
      
        // Directly update formData with the photo (file)
        setFormData((prevData) => ({
          ...prevData,
          imageFile: photo, // Store the actual file (photo) in state, no need to use FormData here
        }));
      };
  
      const handleDragMarker = () => {
        setDraggableMarkerId(selectedRack.site_id)
        setshowMarkerModal(false)
        setChangeMarkerLocation(true)
        console.log('changeMarkerLocation',changeMarkerLocation)
    }
      
    const handleCloseChangeLocation = () => {
        setshowMarkerModal(false);
        setConfirmNewPosition(false)
        if (!changeMarkerLocation){
            setDraggableMarkerId(null)
            setFormData({})
            setSelectedRack(null)
        }

    }

    return (
        <div className="map-container">
            {!userLocation ? (
            <div>Loading...</div> // Loading indicator until userLocation is available
            ) : (
            !showMarkerModal && !show && (
                 <MapContainer center={userLocation} zoom={zoom} maxZoom={20}>
                 <TileLayer
                         url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                         attribution='&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                         maxZoom={20}
                 />
                 {isAddingMarker && <MapClickHandler />}
                 {userLocation && (
                     <Marker position={userLocation} icon={userIcon}>
                         <Popup>
                             <div>
                                 <h3>Your Location</h3>
                                 <p>Latitude: {userLocation[0]}</p>
                                 <p>Longitude: {userLocation[1]}</p>
                             </div>
                         </Popup>
                     </Marker>
                 )}
                 <MarkerClusterGroup {...clusterOptions}>
                     {data.map((item, index) => (
                         <Marker 
                         key={index} 
                         position={[parseFloat(item.latitude), parseFloat(item.longitude)]} 
                         icon={draggableMarkerId === item.site_id ? customIcon2 : customIcon}
                         draggable={draggableMarkerId === item.site_id}
                         eventHandlers={{
                            dragend: (e) => handleDragEnd(e, item.site_id),
                          }}
                         >
                             <Popup>
                                 <div>
                                     <h3>{item.site_id}</h3>
                                     <p>{item.latitude}</p>
                                     <p>{item.longitude}</p>
                                     {!changeMarkerLocation && !isRemovalMode && !isAddingMarker && (
                                         <button className={`btn btn-${destinationMarkerIndex === index ? 'danger' : 'primary'}`} value={`${(item.latitude)},${(item.longitude)}`} onClick={(e) => handleSetDestination(e, index)}> 
                                             {destinationMarkerIndex === index ? 'unset' : 'set as destination'}
                                         </button>
                                     )}
                                     {isRemovalMode && !deletedMarkers.includes(item.site_id) && (
                                         <button
                                             className="btn btn-danger"
                                             onClick={() => handleDeletedMarker(item)}
                                         >
                                             Remove Marker
                                         </button>
                                     )}
                                 </div>
                             </Popup>
                         </Marker>
                     ))}
                     {routeCoordinates.length > 0 && (
                         <Polyline positions={routeCoordinates} />
                     )}
                     {/* {geofences.map((geofence, index) => (
                         <Polygon key={index} positions={geofence}  />
                     ))} */}
                     {markers.map((position, idx) => {
                         return (
                             <Marker key={`marker-${idx}`} position={position} icon={customIcon}>
                                 <Popup>
                                     <div>
                                         <h3>New Marker</h3>
                                         <p>Latitude: {position.lat}</p>
                                         <p>Longitude: {position.lng}</p>
                                         {isAddingMarker && (
                                             <Button variant="danger" onClick={(e) => handleDeleteMarker(idx, e)}>
                                                 Delete Marker
                                             </Button>
                                         )}
                                     </div>
                                 </Popup>
                             </Marker>
                         );
                     })}
 
                     {isAddingMarker && (
                         <>
                         <Alert variant="info" style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                             You can now click on the map to create a new marker.
                         </Alert>
                         </>
     
                     )}

                    {changeMarkerLocation && (
                         <>
                         <Alert variant="info" style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                             You can now drag a marker to a new position.
                         </Alert>
                         </>
     
                     )}
 
                     {isRemovalMode &&(
                         <>
                         <Alert variant="danger" style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                             You can now delete a marker from  the map.
                         </Alert>
                         </>
                     )}
                 </MarkerClusterGroup>
             </MapContainer>
            )
            )}
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
                    <Button className='create_assessment' onClick={handleShowModal}>
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
                    <Modal.Title>{isAddingMarker || isRemovalMode || confirmNewPosition ? ('Save changes'):selectedRack ? `Create Assessment for ${selectedRack.site_id}` : 'Select Bikerack'}</Modal.Title>                
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
                            {closestBikeRacks.map((rack, index) => (
                                <Col key={index} className="card border-light mb-3" onClick={() => handleRackClick(rack)}                     style={{ 
                                    cursor: assessmentIds.includes(rack.site_id) ? 'not-allowed' : 'pointer', 
                                    width: '18rem', 
                                    marginRight: '15px', 
                                    marginBottom: '15px',
                                    opacity: assessmentIds.includes(rack.site_id) ? 0.5 : 1 // Dims the card if already assessed
                                }}>
                                    
                                    {rack.site_id}
                                </Col>
                            ))}
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
                                <CameraCapture onPhotoCapture={handlePhotoCapture} />
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