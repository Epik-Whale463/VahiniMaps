// Global variables
let map;
let currentPosition = null;
let sourceMarker = null;
let destinationMarker = null;
let currentRoute = null;
let optimizedRoute = null;
let alertZones = {};
let routePoints = [];
let notificationTimeout;
let isLoading = false;
let routingControl = null;
let safetyScores = {};
let lastCalculatedRoute = null;
let incidentLayers = {};

// Map initialization
document.addEventListener('DOMContentLoaded', function() {
    // Load Leaflet Routing Machine CSS and JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js';
    script.onload = function() {
        // Initialize the map centered on Hyderabad with a custom style
        map = L.map('map', {
            zoomControl: true,
            attributionControl: true,
            minZoom: 10,
            maxZoom: 19,
            zoomAnimation: true,
            markerZoomAnimation: true,
            fadeAnimation: true
        }).setView([17.3850, 78.4867], 12);
        
        // Add a custom styled map layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            className: 'map-tiles'
        }).addTo(map);
        
        // Initialize alert zones
        initializeAlertZones();
        
        // Get user's current location
        detectUserLocation();
        
        // Set up event listeners
        setupEventListeners();
        
        // Show welcome notification
        showNotification('Welcome to Vahini! Set your destination to begin.', 5000);
    };
    document.head.appendChild(script);
});

// Initialize safety alert zones with improved visibility
function initializeAlertZones() {
    const zoneTypes = {
        'Lonely Areas': { 
            color: '#FF9800',
            borderColor: '#F57C00',
            locations: [
                [17.42, 78.45], [17.35, 78.40], [17.44, 78.43], 
                [17.33, 78.41], [17.40, 78.53]
            ], 
            radius: 800,
            id: 'avoidLonely',
            safetyScore: 30
        },
        'High Crime Rate Zones': { 
            color: '#F44336',
            borderColor: '#D32F2F',
            locations: [
                [17.40, 78.50], [17.38, 78.47], [17.41, 78.52], 
                [17.36, 78.49], [17.39, 78.44]
            ], 
            radius: 600,
            id: 'avoidCrime',
            safetyScore: 10
        },
        'No Hospital Zones': { 
            color: '#3F51B5',
            borderColor: '#303F9F',
            locations: [
                [17.37, 78.52], [17.39, 78.42], [17.43, 78.48], 
                [17.34, 78.46], [17.41, 78.39]
            ], 
            radius: 900,
            id: 'avoidHospital',
            safetyScore: 40
        },
        'Accident-Prone Areas': { 
            color: '#FFC107',
            borderColor: '#FFA000',
            locations: [
                [17.41, 78.49], [17.36, 78.44], [17.45, 78.41], 
                [17.38, 78.54], [17.32, 78.47]
            ], 
            radius: 700,
            id: 'avoidAccident',
            safetyScore: 20
        }
    };

    // Add alert zones to map with improved styling
    Object.entries(zoneTypes).forEach(([type, config]) => {
        // Store safety scores for each zone type
        safetyScores[config.id] = config.safetyScore;
        
        // Create circles for each zone
        const circles = config.locations.map(coords => 
            L.circle(coords, {
                color: config.borderColor,
                fillColor: config.color,
                radius: config.radius,
                fillOpacity: 0.15,
                weight: 3,
                className: `alert-zone ${config.id}`
            }).bindPopup(`
                <div class="alert-popup">
                    <h3>${type}</h3>
                    <p>This area is flagged for safety concerns.</p>
                    <div class="safety-score">Safety Score: ${config.safetyScore}/100</div>
                    <div class="alert-icon ${config.id}"></div>
                </div>
            `)
        );
        
        // Store zone information for route optimization
        alertZones[type] = {
            layer: L.layerGroup(circles).addTo(map),
            config: config,
            circles: circles
        };
    });
}

// Set up event listeners
function setupEventListeners() {
    document.getElementById('routeButton').addEventListener('click', calculateRoute);
    document.getElementById('optimizeButton').addEventListener('click', optimizeRoute);
    document.getElementById('resetButton').addEventListener('click', resetMap);
    document.getElementById('useCurrentLocation').addEventListener('click', useCurrentLocation);
    document.getElementById('panicButton').addEventListener('click', activatePanicMode);
    
    document.getElementById('source').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') calculateRoute();
    });
    
    document.getElementById('destination').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') calculateRoute();
    });
    
    // Map click to set destination marker
    map.on('click', function(e) {
        if (isLoading) return;
        
        const { lat, lng } = e.latlng;
        setDestinationMarker([lat, lng]);
        document.getElementById('destination').value = `Custom Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        
        // Reset routes when destination is changed
        resetRoutes();
    });
}

// Detect user's current location
function detectUserLocation() {
    if ('geolocation' in navigator) {
        showNotification('Detecting your location...', 10000);
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const { latitude, longitude } = position.coords;
                currentPosition = [latitude, longitude];
                document.getElementById('source').placeholder = "Current Location (Detected)";
                document.getElementById('source').value = "Current Location";
                map.setView([latitude, longitude], 13);
                sourceMarker = L.marker([latitude, longitude], {
                    title: "Your Current Location",
                    draggable: true
                }).addTo(map).bindPopup("Your Current Location").openPopup();
                sourceMarker.on('dragend', function(event) {
                    const marker = event.target;
                    const pos = marker.getLatLng();
                    currentPosition = [pos.lat, pos.lng];
                    document.getElementById('source').value = "Custom Location";
                    resetRoutes();
                });
                showNotification('Location detected!', 2000);
            },
            function(error) {
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enter source manually.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable. Please enter source manually.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out. Please enter source manually.";
                        break;
                    default:
                        errorMessage = "Unknown error occurred. Please enter source manually.";
                }
                showNotification(errorMessage, 5000);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        showNotification('Geolocation not supported by your browser. Please enter source manually.', 5000);
    }
}

// Use current location handler
function useCurrentLocation() {
    if ('geolocation' in navigator) {
        showNotification('Updating location...', 5000);
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const { latitude, longitude } = position.coords;
                currentPosition = [latitude, longitude];
                document.getElementById('source').value = "Current Location";
                if (sourceMarker) {
                    sourceMarker.setLatLng([latitude, longitude]);
                } else {
                    sourceMarker = L.marker([latitude, longitude], {
                        title: "Your Current Location",
                        draggable: true
                    }).addTo(map);
                    sourceMarker.on('dragend', function(event) {
                        const marker = event.target;
                        const pos = marker.getLatLng();
                        currentPosition = [pos.lat, pos.lng];
                        document.getElementById('source').value = "Custom Location";
                        resetRoutes();
                    });
                }
                map.setView([latitude, longitude], 13);
                showNotification('Location updated!', 2000);
            },
            function(error) {
                showNotification('Error updating location. Please try again.', 3000);
            }
        );
    } else {
        showNotification('Geolocation not supported by your browser.', 3000);
    }
}

// Calculate normal route without optimization using OSRM via Leaflet Routing Machine
async function calculateRoute() {
    const sourceInput = document.getElementById('source').value;
    const destination = document.getElementById('destination').value;
    
    if (!destination) {
        showNotification('Please enter a destination', 3000);
        return;
    }
    
    setLoading(true);
    
    try {
        // Remove optimized route if present
        if (optimizedRoute) {
            map.removeLayer(optimizedRoute);
            optimizedRoute = null;
        }
        
        // Remove previous routing control if exists
        if (routingControl) {
            map.removeControl(routingControl);
        }
        
        let start;
        if (sourceInput === "Current Location" && currentPosition) {
            start = currentPosition;
        } else {
            start = await geocode(sourceInput);
        }
        
        const end = await geocode(destination);
        
        // Remove existing markers if any
        if (sourceMarker) map.removeLayer(sourceMarker);
        if (destinationMarker) map.removeLayer(destinationMarker);
        
        // Create source marker with custom icon
        sourceMarker = L.marker(start, {
            title: "Source",
            draggable: true,
            icon: L.divIcon({
                className: 'custom-marker source-marker',
                html: '<i class="fas fa-map-marker-alt"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(map).bindPopup(`
            <div class="marker-popup">
                <h3>Source</h3>
                <p>${sourceInput === "Current Location" ? "Your Current Location" : sourceInput}</p>
            </div>
        `);
        
        sourceMarker.on('dragend', function(event) {
            const pos = event.target.getLatLng();
            currentPosition = [pos.lat, pos.lng];
            document.getElementById('source').value = "Custom Location";
            resetRoutes();
        });
        
        // Create destination marker with custom icon
        destinationMarker = L.marker(end, {
            title: "Destination",
            draggable: true,
            icon: L.divIcon({
                className: 'custom-marker destination-marker',
                html: '<i class="fas fa-flag"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        }).addTo(map).bindPopup(`
            <div class="marker-popup">
                <h3>Destination</h3>
                <p>${destination}</p>
            </div>
        `);
        
        destinationMarker.on('dragend', function(event) {
            const pos = event.target.getLatLng();
            document.getElementById('destination').value = `Custom Location (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})`;
            resetRoutes();
        });
        
        // Use OSRM routing via Leaflet Routing Machine with improved styling
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1])
            ],
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            createMarker: function() { return null; },
            addWaypoints: false,
            routeWhileDragging: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            show: false,
            lineOptions: {
                styles: [
                    {
                        color: '#2196F3',
                        weight: 6,
                        opacity: 0.8,
                        className: 'route-line normal-route'
                    }
                ]
            }
        }).on('routesfound', function(e) {
            const routes = e.routes;
            const route = routes[0];
            
            // Store the route coordinates for optimization
            lastCalculatedRoute = route;
            routePoints = route.coordinates;
            
            if (currentRoute) map.removeLayer(currentRoute);
            
            // Create the route line with proper styling
            currentRoute = L.polyline(route.coordinates, {
                color: '#2196F3',
                weight: 6,
                opacity: 0.8,
                className: 'route-line normal-route'
            }).addTo(map).bindPopup(`
                <div class="route-popup">
                    <h3>Normal Route</h3>
                    <p>Distance: ${(route.summary.totalDistance / 1000).toFixed(2)} km</p>
                    <p>Estimated time: ${formatTime(route.summary.totalTime)}</p>
                </div>
            `);
            
            // Check for alerts along the route
            const alertsOnRoute = checkRouteForAlerts(route.coordinates, getActivePreferences());
            if (alertsOnRoute.length > 0) {
                showNotification(`Warning: This route passes through ${alertsOnRoute.length} unsafe zones. Consider using "Optimize for Safety".`, 8000);
            }
            
            map.fitBounds(currentRoute.getBounds(), { padding: [50, 50] });
            document.getElementById('optimizeButton').disabled = false;
        }).addTo(map);
        
    } catch(e) {
        showNotification('Error: ' + e.message, 5000);
        console.error(e);
    } finally {
        setLoading(false);
    }
}

// Format time in minutes and seconds
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes} min ${remainingSeconds} sec`;
}

// Check if route passes through alert zones
function checkRouteForAlerts(routeCoordinates, preferences) {
    let alerts = [];
    
    // Get safety preferences
    const safetyPrefs = preferences || getActivePreferences();
    
    // Check each zone type
    Object.entries(alertZones).forEach(([zoneName, zoneData]) => {
        // Skip zones not in user preferences
        const zoneId = zoneData.config.id;
        if (!safetyPrefs[zoneId]) return;
        
        // Check each circle in this zone type
        zoneData.circles.forEach(circle => {
            const zoneCenter = circle.getLatLng();
            const zoneRadius = circle.getRadius();
            
            // Check if any route point is inside this circle
            const routePointsInZone = routeCoordinates.filter(coord => {
                const distance = L.latLng(coord).distanceTo(zoneCenter);
                return distance < zoneRadius;
            });
            
            // If route passes through this zone, add an alert
            if (routePointsInZone.length > 0) {
                alerts.push({
                    type: zoneName,
                    coordinates: zoneCenter,
                    safetyImpact: zoneData.config.safetyScore
                });
            }
        });
    });
    
    // Check for user-reported incidents near route
    for (const type in incidentLayers) {
        incidentLayers[type].forEach(marker => {
            const incidentPos = marker.getLatLng();
            
            // Check if any route point is close to this incident
            const isNearRoute = routeCoordinates.some(coord => {
                const distance = L.latLng(coord).distanceTo(incidentPos);
                return distance < 200; // Within 200 meters
            });
            
            if (isNearRoute) {
                alerts.push({
                    type: `User Reported: ${type}`,
                    coordinates: incidentPos,
                    safetyImpact: 15 // Default impact score for user reports
                });
            }
        });
    }
    
    // Get unique alerts (by type)
    const uniqueAlerts = [];
    const alertTypes = {};
    
    alerts.forEach(alert => {
        if (!alertTypes[alert.type]) {
            alertTypes[alert.type] = true;
            uniqueAlerts.push(alert);
        }
    });
    
    return uniqueAlerts;
}

// Optimize route based on safety preferences with improved styling
async function optimizeRoute() {
    if (!currentRoute || !lastCalculatedRoute) {
        showNotification('Please calculate a route first', 3000);
        return;
    }
    
    const preferences = getActivePreferences();
    if (preferences.length === 0) {
        showNotification('Please select at least one safety preference', 3000);
        return;
    }
    
    setLoading(true);
    
    try {
        if (optimizedRoute) {
            map.removeLayer(optimizedRoute);
        }
        
        // Get the active alert zones based on preferences
        const activeAlertTypes = preferences.map(pref => {
            switch(pref) {
                case 'Lonely Areas': return 'avoidLonely';
                case 'High Crime Rate Zones': return 'avoidCrime';
                case 'No Hospital Zones': return 'avoidHospital';
                case 'Accident-Prone Areas': return 'avoidAccident';
                default: return null;
            }
        }).filter(Boolean);
        
        // Get waypoints for optimization
        const waypoints = generateSafeWaypoints(
            [sourceMarker.getLatLng(), destinationMarker.getLatLng()],
            activeAlertTypes
        );
        
        // Create a new routing control for the optimized route
        const safeRoutingControl = L.Routing.control({
            waypoints: waypoints,
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            createMarker: function() { return null; },
            addWaypoints: true,
            routeWhileDragging: false,
            fitSelectedRoutes: false,
            showAlternatives: false,
            show: false,
            lineOptions: {
                styles: [
                    {
                        color: '#4CAF50',
                        weight: 6,
                        opacity: 0.8,
                        dashArray: '10, 10',
                        className: 'route-line safe-route'
                    }
                ]
            }
        });
        
        safeRoutingControl.on('routesfound', function(e) {
            const safeRoute = e.routes[0];
            
            // Calculate safety score improvement
            const originalSafetyScore = calculateRouteSafetyScore(lastCalculatedRoute.coordinates);
            const newSafetyScore = calculateRouteSafetyScore(safeRoute.coordinates);
            const scoreImprovement = newSafetyScore - originalSafetyScore;
            
            // Calculate time difference
            const timeDifference = safeRoute.summary.totalTime - lastCalculatedRoute.summary.totalTime;
            
            optimizedRoute = L.polyline(safeRoute.coordinates, {
                color: '#4CAF50',
                weight: 6,
                opacity: 0.8,
                dashArray: '10, 10',
                className: 'route-line safe-route'
            }).addTo(map).bindPopup(`
                <div class="route-popup">
                    <h3>Safe Route</h3>
                    <p>Distance: ${(safeRoute.summary.totalDistance / 1000).toFixed(2)} km</p>
                    <p>Estimated time: ${formatTime(safeRoute.summary.totalTime)}</p>
                    <p>Safety improvement: ${scoreImprovement > 0 ? '+' : ''}${scoreImprovement.toFixed(0)}%</p>
                    <p>Additional travel time: ${formatTime(Math.max(0, timeDifference))}</p>
                    <p>This route avoids:</p>
                    <ul>
                        ${preferences.map(pref => `<li>${pref}</li>`).join('')}
                    </ul>
                </div>
            `);
            
            showNotification('Route optimized for safety! Safety score improved by ' + scoreImprovement.toFixed(0) + '%', 5000);
            
            // Clean up the temporary routing control
            map.removeControl(safeRoutingControl);
        }).addTo(map);
        
    } catch(e) {
        showNotification('Error: ' + e.message, 5000);
        console.error(e);
    } finally {
        setLoading(false);
    }
}

// Calculate a safety score for a route
function calculateRouteSafetyScore(routeCoordinates) {
    // Base safety score starts at 100 (completely safe)
    let safetyScore = 100;
    
    // Get alerts along the route
    const alertsOnRoute = checkRouteForAlerts(routeCoordinates, getActivePreferences());
    
    // Reduce safety score based on alert zones
    for (const alert of alertsOnRoute) {
        // The lower the zone's safety score, the more it reduces the route's safety score
        safetyScore -= (100 - alert.safetyImpact) / alertsOnRoute.length;
    }
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, safetyScore));
}

// Generate waypoints to create a safer route
function generateSafeWaypoints(endPoints, alertTypesToAvoid) {
    const [start, end] = endPoints;
    const waypoints = [L.latLng(start.lat, start.lng)];
    
    // If there are no alert types to avoid, just return direct route
    if (alertTypesToAvoid.length === 0) {
        waypoints.push(L.latLng(end.lat, end.lng));
        return waypoints;
    }
    
    // Get all alert circles that should be avoided
    const circlesToAvoid = [];
    for (const [zoneName, zoneData] of Object.entries(alertZones)) {
        if (alertTypesToAvoid.includes(zoneData.config.id)) {
            circlesToAvoid.push(...zoneData.circles);
        }
    }
    
    // If no circles to avoid, return direct route
    if (circlesToAvoid.length === 0) {
        waypoints.push(L.latLng(end.lat, end.lng));
        return waypoints;
    }
    
    // Calculate midpoint between start and end
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    
    // Calculate distance between points
    const distance = Math.sqrt(
        Math.pow(end.lat - start.lat, 2) + 
        Math.pow(end.lng - start.lng, 2)
    );
    
    // Generate intermediate waypoints
    let waypointsAdded = 0;
    
    // Try to find safe alternative points
    for (let i = 1; i <= 5; i++) {
        // Create potential waypoints at varying distances from the midpoint
        const potentialPoints = [
            { lat: midLat + (distance * 0.2 * i), lng: midLng },
            { lat: midLat - (distance * 0.2 * i), lng: midLng },
            { lat: midLat, lng: midLng + (distance * 0.2 * i) },
            { lat: midLat, lng: midLng - (distance * 0.2 * i) }
        ];
        
        // Check each potential point to see if it's safe
        for (const point of potentialPoints) {
            const latLng = L.latLng(point.lat, point.lng);
            let isSafe = true;
            
            // Check if point is in any of the circles to avoid
            for (const circle of circlesToAvoid) {
                if (latLng.distanceTo(circle.getLatLng()) <= circle.getRadius()) {
                    isSafe = false;
                    break;
                }
            }
            
            // If safe, add as waypoint
            if (isSafe) {
                waypoints.push(latLng);
                waypointsAdded++;
                break;
            }
        }
        
        // If we've added waypoints, stop looking
        if (waypointsAdded > 0) break;
    }
    
    // Add the endpoint
    waypoints.push(L.latLng(end.lat, end.lng));
    return waypoints;
}

// Reset routes (both normal and optimized)
function resetRoutes() {
    if (currentRoute) {
        map.removeLayer(currentRoute);
        currentRoute = null;
    }
    if (optimizedRoute) {
        map.removeLayer(optimizedRoute);
        optimizedRoute = null;
    }
    document.getElementById('optimizeButton').disabled = true;
}

// Reset the map completely
function resetMap() {
    resetRoutes();
    if (sourceMarker) {
        map.removeLayer(sourceMarker);
        sourceMarker = null;
    }
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
        destinationMarker = null;
    }
    document.getElementById('source').value = "Current Location";
    document.getElementById('destination').value = "";
}

// Geocode function using Nominatim
async function geocode(query) {
    if (query === 'Current Location' && currentPosition) {
        return currentPosition;
    }
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
    const data = await response.json();
    if (!data || data.length === 0) {
        throw new Error('Location not found');
    }
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

// Get active safety preferences from checkboxes
function getActivePreferences() {
    const preferences = {};
    if (document.getElementById('avoidLonely').checked) preferences['avoidLonely'] = true;
    if (document.getElementById('avoidCrime').checked) preferences['avoidCrime'] = true;
    if (document.getElementById('avoidHospital').checked) preferences['avoidHospital'] = true;
    if (document.getElementById('avoidAccident').checked) preferences['avoidAccident'] = true;
    return preferences;
}

// Utility: Show notifications
function showNotification(message, duration = 3000, type = 'info') {
    const notification = document.getElementById('notification');
    notification.classList.remove('hidden');
    document.getElementById('notification-text').textContent = message;
    if (notificationTimeout) clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
        notification.classList.add('hidden');
    }, duration);
}

// Utility: Set loading overlay visibility
function setLoading(isActive) {
    const loading = document.getElementById('loading');
    loading.style.display = isActive ? 'flex' : 'none';
}

// Set destination marker on map (used when clicking on the map)
function setDestinationMarker(latlng) {
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }
    destinationMarker = L.marker(latlng, { title: "Destination" }).addTo(map).bindPopup("Destination");
    resetRoutes();
}

// Report an incident to help other users
function reportIncident(position, type, severity, description) {
    if (!position || !type) {
        showNotification('Please provide incident location and type', 3000, 'warning');
        return false;
    }
    
    try {
        // Create the incident marker
        const marker = addIncidentMarker(position, type, severity, description);
        
        // Store the incident if database is available
        if (window.DB && window.auth && window.auth.isLoggedIn()) {
            const incident = {
                location: position,
                type: type,
                severity: severity,
                description: description,
                timestamp: new Date().toISOString(),
                reportedBy: window.auth.getCurrentUser().id
            };
            
            window.DB.reportIncident(incident);
            
            // Update user's contribution count
            appState.incidentsReported++;
            
            // Trigger reward system
            document.dispatchEvent(new CustomEvent('incidentReported'));
            
            showNotification('Incident reported successfully!', 3000, 'success');
            return true;
        } else if (!window.auth || !window.auth.isLoggedIn()) {
            showNotification('Please log in to report incidents', 3000, 'warning');
            return false;
        } else {
            // Still add the marker but notify about database issue
            showNotification('Incident added to map, but could not be saved permanently', 3000, 'warning');
            return true;
        }
    } catch (error) {
        console.error('Error reporting incident:', error);
        showNotification('Could not report incident: ' + error.message, 3000, 'error');
        return false;
    }
}

// Add an incident marker to the map
function addIncidentMarker(position, type, severity, description) {
    // Define marker properties based on incident type and severity
    const markerConfig = getIncidentMarkerConfig(type, severity);
    
    // Create the marker with custom icon
    const marker = L.marker(position, {
        icon: L.divIcon({
            className: `incident-marker ${type.toLowerCase()} severity-${severity}`,
            html: `<div class="marker-icon">${markerConfig.icon}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })
    }).addTo(map);
    
    // Add popup with incident details
    marker.bindPopup(`
        <div class="incident-popup">
            <h3>${type}</h3>
            <div class="severity">
                <span>Severity:</span>
                <div class="severity-indicator level-${severity}">
                    ${Array(severity).fill('●').join('')}${Array(5-severity).fill('○').join('')}
                </div>
            </div>
            <p>${description || 'No additional details provided.'}</p>
            <div class="incident-time">Reported: ${new Date().toLocaleString()}</div>
        </div>
    `);
    
    // Add marker to incident layers for management
    if (!incidentLayers[type]) {
        incidentLayers[type] = [];
    }
    incidentLayers[type].push(marker);
    
    return marker;
}

// Get configuration for incident marker based on type and severity
function getIncidentMarkerConfig(type, severity) {
    const configs = {
        'Robbery': {
            icon: '💰',
            color: '#FF3B30' // Red
        },
        'Assault': {
            icon: '👊',
            color: '#FF3B30' // Red
        },
        'Harassment': {
            icon: '⚠️',
            color: '#FF9500' // Orange
        },
        'Suspicious Activity': {
            icon: '👁️',
            color: '#FF9500' // Orange
        },
        'Road Issue': {
            icon: '🚧',
            color: '#FFCC00' // Yellow
        },
        'Poor Lighting': {
            icon: '💡',
            color: '#FFCC00' // Yellow
        }
    };
    
    // Default config if type not found
    return configs[type] || {
        icon: '⚠️',
        color: '#FF3B30'
    };
}

// Activate panic mode
function activatePanicMode() {
    if (!window.auth || !window.auth.isLoggedIn()) {
        showNotification('Please log in to use the panic feature', 3000, 'warning');
        return;
    }
    
    // Show panic mode notification
    showNotification('Panic mode activated! Notifying emergency contacts...', 5000, 'warning');
    
    // Highlight user's current location
    if (currentPosition) {
        const panicMarker = L.marker(currentPosition, {
            icon: L.divIcon({
                className: 'panic-marker',
                html: '<i class="fas fa-exclamation-triangle"></i>',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })
        }).addTo(map).bindPopup('Your current location in panic mode').openPopup();
        
        // Flash the marker to draw attention
        setInterval(() => {
            panicMarker.setOpacity(panicMarker.options.opacity === 1 ? 0.5 : 1);
        }, 500);
    }
    
    // Notify emergency contacts (simulated)
    notifyEmergencyContacts();
}

// Simulate notifying emergency contacts
function notifyEmergencyContacts() {
    // In a real implementation, this would send notifications to user's emergency contacts
    console.log('Notifying emergency contacts...');
    
    // Simulate delay
    setTimeout(() => {
        showNotification('Emergency contacts notified successfully!', 3000, 'success');
    }, 2000);
}
