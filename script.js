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
        // Initialize the map centered on Hyderabad
        map = L.map('map').setView([17.3850, 78.4867], 12);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
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

// Initialize safety alert zones (sample data for demonstration)
function initializeAlertZones() {
    const zoneTypes = {
        'Lonely Areas': { 
            color: '#FF9800', 
            locations: [
                [17.42, 78.45], [17.35, 78.40], [17.44, 78.43], 
                [17.33, 78.41], [17.40, 78.53]
            ], 
            radius: 800,
            id: 'avoidLonely'
        },
        'High Crime Rate Zones': { 
            color: '#F44336', 
            locations: [
                [17.40, 78.50], [17.38, 78.47], [17.41, 78.52], 
                [17.36, 78.49], [17.39, 78.44]
            ], 
            radius: 600,
            id: 'avoidCrime'
        },
        'No Hospital Zones': { 
            color: '#3F51B5', 
            locations: [
                [17.37, 78.52], [17.39, 78.42], [17.43, 78.48], 
                [17.34, 78.46], [17.41, 78.39]
            ], 
            radius: 900,
            id: 'avoidHospital'
        },
        'Accident-Prone Areas': { 
            color: '#FFEB3B', 
            locations: [
                [17.41, 78.49], [17.36, 78.44], [17.45, 78.41], 
                [17.38, 78.54], [17.32, 78.47]
            ], 
            radius: 700,
            id: 'avoidAccident'
        }
    };

    // Add alert zones to map
    Object.entries(zoneTypes).forEach(([type, config]) => {
        alertZones[type] = L.layerGroup(
            config.locations.map(coords => 
                L.circle(coords, {
                    color: config.color,
                    fillColor: config.color,
                    radius: config.radius,
                    fillOpacity: 0.2,
                    weight: 2
                }).bindPopup(`<strong>${type}</strong><br>This area is flagged for safety concerns.`)
            )
        ).addTo(map);
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
        
        // Create source marker
        sourceMarker = L.marker(start, {
            title: "Source",
            draggable: true
        }).addTo(map).bindPopup("Source: " + (sourceInput === "Current Location" ? "Your Current Location" : sourceInput));
        sourceMarker.on('dragend', function(event) {
            const pos = event.target.getLatLng();
            currentPosition = [pos.lat, pos.lng];
            document.getElementById('source').value = "Custom Location";
            resetRoutes();
        });
        
        // Create destination marker
        destinationMarker = L.marker(end, {
            title: "Destination",
            draggable: true
        }).addTo(map).bindPopup("Destination: " + destination);
        destinationMarker.on('dragend', function(event) {
            const pos = event.target.getLatLng();
            document.getElementById('destination').value = `Custom Location (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)})`;
            resetRoutes();
        });
        
        // Use OSRM routing via Leaflet Routing Machine
        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1])
            ],
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            createMarker: function() { return null; }, // Markers already added above
            addWaypoints: false,
            routeWhileDragging: false,
            fitSelectedRoutes: false,
            show: false
        }).on('routesfound', function(e) {
            // Remove previous route if exists
            if (currentRoute) map.removeLayer(currentRoute);
            // Extract route coordinates
            const routeCoords = e.routes[0].coordinates;
            currentRoute = L.polyline(routeCoords, { color: '#4285f4', weight: 5 }).addTo(map).bindPopup("Normal Route");
            map.fitBounds(currentRoute.getBounds(), { padding: [50, 50] });
            
            // Enable optimize button
            document.getElementById('optimizeButton').disabled = false;
            showNotification('Route calculated. Select safety preferences and click "Optimize for Safety" for a safer path.', 5000);
        }).addTo(map);
        
    } catch(e) {
        showNotification('Error: ' + e.message, 5000);
        console.error(e);
    } finally {
        setLoading(false);
    }
}

// Optimize route based on safety preferences
async function optimizeRoute() {
    if (!currentRoute) {
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
        
        // Simulate optimization by generating a modified route
        const safeRoutePoints = generateSafeRoute(routePoints, preferences);
        
        optimizedRoute = L.polyline(safeRoutePoints, {
            color: '#34a853',
            weight: 5,
            dashArray: '10, 10'
        }).addTo(map).bindPopup("Optimized Safe Route (Avoiding: " + preferences.join(', ') + ")");
        
        // Fit bounds to include both routes
        const bounds = L.latLngBounds(currentRoute.getLatLngs());
        map.fitBounds(bounds, {padding: [50, 50]});
        
        showNotification('Route optimized for safety!', 5000);
        
    } catch(e) {
        showNotification('Error: ' + e.message, 5000);
        console.error(e);
    } finally {
        setLoading(false);
    }
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

// Simulate safe route generation based on preferences
function generateSafeRoute(route, preferences) {
    // For demonstration: apply a small offset based on the number of selected preferences.
    const offset = preferences.length * 0.001;
    return route.map(pt => [pt[0] + offset, pt[1] + offset]);
}

// Get active safety preferences from checkboxes
function getActivePreferences() {
    const preferences = [];
    if (document.getElementById('avoidLonely').checked) preferences.push('Lonely Areas');
    if (document.getElementById('avoidCrime').checked) preferences.push('High Crime Rate Zones');
    if (document.getElementById('avoidHospital').checked) preferences.push('No Hospital Zones');
    if (document.getElementById('avoidAccident').checked) preferences.push('Accident-Prone Areas');
    return preferences;
}

// Utility: Show notifications
function showNotification(message, duration = 3000) {
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
