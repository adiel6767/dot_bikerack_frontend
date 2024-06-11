import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';

// Leaflet and React-Leaflet
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import MarkerClusterGroup from 'react-leaflet-cluster';

// ArcGIS
import * as arcgisRest from '@esri/arcgis-rest-request';
import { solveRoute } from '@esri/arcgis-rest-routing';

// Bootstrap components
import { Modal, Button, Nav, Popover } from 'react-bootstrap';
import { Table } from 'react-bootstrap';

// Images
import { 
  userMarkerIcon,
  markerShadow,
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

function Main() {
    const [leaderboardTable, setLeaderboardTable] = useState([]);
    const [BadgesList,setBadgestList] = useState([]);
    const [UserBadgesIds, setUserBadgesIds] = useState([]);
    const [UserAchievementsIds,setUserAchievementsIds] = useState([]);
    const [showTable,setShowTable] = useState(false); 
    const [showPopover, setShowPopover] = useState(false);
    const targetRef = useRef(null);
    const [UserData, setUserData] = useState(false)
    const [AchievementsList,setAchievementsList] = useState([]);
    const [data, setData] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [show, setShow] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showAchievements, setAchievements] = useState(false)
    const [showLeaderboard, setLeaderboard] = useState(false)
    const [showProfile, setShowProfile] = useState(false);
    const [showEmblem, setShowEmblem] = useState(false);
    // const [userLocation, setUserLocation] = useState([ 40.864407, -73.822017]);
    const [userImageId, setUserImageId] = useState([]);
    const [userLocation2, setUserLocation2] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [destinationColor, setDestinationColor] = useState('primary');
    const [buttonText, setButtonText] = useState('set as destination');
    const [geofences, setGeofences] = useState([]);
    const images = [bird,cow,sheep,dogeIcon]

    const apiKey = process.env.REACT_APP_API_KEY;  

    const client = axios.create({
        baseURL: "https://dot-bikerack-backend.onrender.com/",
        withCredentials: true 
      })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('https://data.cityofnewyork.us/resource/au7q-njtk.json');
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const jsonData = await response.json();
                setData(jsonData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                position => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                    setUserLocation2([position.coords.longitude, position.coords.latitude]);
                },
                error => {
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
                const lat = parseFloat(item.y);
                const lng = parseFloat(item.x);
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
      
    const checkGeofence = (geofence, userLocation) => {
        const polygon = L.polygon(geofence);
        const latLng = L.latLng(userLocation[0], userLocation[1]);
        return polygon.getBounds().contains(latLng);
    };
    

    useEffect(() => {
        if (userLocation && geofences.length > 0) {
            for (let i = 0; i < geofences.length; i++) {
                if (checkGeofence(geofences[i], userLocation)) {
                    console.log(`User is inside geofence ${i + 1}`);
                    // Handle entering the geofence here
                } else {
                    // Handle exiting the geofence here
                }
            }
        }
    }, [userLocation, geofences]);

    const handleSetDestination = async (e) => {
        const destinationCoordinates = e.target.value.split(',').map(parseFloat);
        const newDestinationColor = destinationColor === 'primary' ? 'danger' : 'primary';
        setDestinationColor(newDestinationColor);
        setButtonText(buttonText === 'set as destination' ? 'unset' : 'set as destination');

        if (newDestinationColor === 'primary') {
            setRouteCoordinates([]);
        } else if (userLocation) {
            const authentication = arcgisRest.ApiKeyManager.fromKey(apiKey);

            try {
                const response = await solveRoute({
                    stops: [
                        userLocation2,
                        destinationCoordinates
                    ],
                    authentication
                });

                const { routes: { features: [{ geometry: { paths } }] } } = response;
                const routeCoordinates = paths[0].map(point => [point[1], point[0]]);
                setRouteCoordinates(routeCoordinates);
            } catch (error) {
                console.error('Error solving route:', error);
            }
        }
    };

    const customIcon = L.icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
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
        console.log('About clicked');
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
                console.log(UserData);
                
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
        "Prime Contributor": award,
        "Task Initiator": badge,
        "Wayfinder": honor,
        "Mile Marker": medal,
        "Novice Assessor": medal_2,
        "Path Pioneer": verified
    };

    const achievementImages = {
        "Trailblazer":cycling,
        "Initiator":cycling1,
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
    
    return (
        <div className="map-container">
            <MapContainer center={[40.754932, -73.984016]} zoom={12} maxZoom={20}>
                <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        maxZoom={20}
                />
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
                <MarkerClusterGroup>
                    {data.map((item, index) => (
                        <Marker key={index} position={[parseFloat(item.y), parseFloat(item.x)]} icon={customIcon}>
                            <Popup>
                                <div>
                                    <h3>{item.site_id}</h3>
                                    <p>{item.x}</p>
                                    <p>{item.y}</p>
                                    <button className={`btn btn-${destinationColor}`} value={`${item.x},${item.y}`} onClick={handleSetDestination}>
                                        {buttonText}
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    {routeCoordinates.length > 0 && (
                        <Polyline pathOptions={{ color: 'blue' }} positions={routeCoordinates} />
                    )}
                    {geofences.map((geofence, index) => (
                        <Polygon key={index} positions={geofence} />
                    ))}
                </MarkerClusterGroup>
            </MapContainer>

            <Button className='floating-button' onClick={handleShow}>
                Menu
            </Button>
            <Button className='create_assessment'> 
                Create Assessment
            </Button>
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
                        <section id='about'>
                        <p>about this project</p>
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
                                <th>Assessment Streak</th>
                                <th>Distance Traveled</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                <td>{UserData.assessment_count}</td>
                                <td>{UserData.assessment_streak}</td>
                                <td>{UserData.distance_traveled} miles</td>
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
                                <th>Mistery Boxes Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                <td>{UserData.achievements_completed}</td>
                                <td>{UserData.badges_earned}</td>
                                <td>{UserData.mistery_boxes_earned}</td>
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
