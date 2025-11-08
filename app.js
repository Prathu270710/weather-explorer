let map = null;        // Will store our Leaflet map instance
let marker = null;     // Will store the current marker on the map
let currentView = 'home';  // Tracks which view is currently shown

function showView(view) {
    // Store the current view
    currentView = view;
    
    // Get references to both view elements
    const homeView = document.getElementById('home-view');
    const mapView = document.getElementById('map-view');
    
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Update active state on navigation links
    navLinks.forEach(link => {
        // Check if this link matches the current view
        if (link.dataset.view === view) {
            link.classList.add('active');    // Add active class
        } else {
            link.classList.remove('active'); // Remove active class
        }
    });
    
    // Show/hide views based on selection
    if (view === 'map') {
        // Show map view, hide home view
        homeView.style.display = 'none';
        mapView.style.display = 'block';
        
        // Initialize map only if it hasn't been created yet
        if (!map) {
            // Small delay to ensure DOM is ready
            setTimeout(() => initializeMap(), 100);
        }
    } else {
        // Show home view, hide map view
        homeView.style.display = 'block';
        mapView.style.display = 'none';
    }
}


function initializeMap() {
    console.log('Initializing map...');
    
    
    map = L.map('map').setView([40.7128, -74.0060], 4);
    
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',  // Credit to map providers
        maxZoom: 19  
    }).addTo(map);  
    
    map.on('click', handleMapClick);
    
    // Fix map sizing issues (sometimes needed when map is initially hidden)
    setTimeout(() => {
        map.invalidateSize();  // Recalculate map size
    }, 200);
    
    console.log('Map initialized successfully!');
}


function handleMapClick(e) {
    // Extract and round coordinates from click event
    const lat = e.latlng.lat.toFixed(4);  // Round to 4 decimal places
    const lon = e.latlng.lng.toFixed(4);
    
    console.log(`Map clicked at: ${lat}, ${lon}`);
    
    // Remove existing marker if there is one
    if (marker) {
        map.removeLayer(marker);  // Remove old marker from map
    }
    
    // Create new marker at clicked location
    marker = L.marker([lat, lon], {
        riseOnHover: true  // Marker rises slightly when mouse hovers over it
    }).addTo(map);  // Add marker to map
    
    // Add popup to marker
    marker.bindPopup(`Fetching weather data...`).openPopup();
    
    fetchWeatherData(lat, lon);
}


async function fetchWeatherData(lat, lon) {
    const weatherCard = document.getElementById('weather-card');
    const locationName = document.getElementById('location-name');
    const locationCoords = document.getElementById('location-coords');
    const weatherGrid = document.getElementById('weather-grid');
    
    weatherCard.classList.add('active');  // Make card visible
    locationName.textContent = 'Loading...';
    locationCoords.textContent = `${lat}°, ${lon}°`;
    weatherGrid.innerHTML = '<div class="spinner"></div>';  // Show loading spinner
    
    try {
        
        const weatherUrl = ``; //ENTER YOUR API KEY
        
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        
        const [weatherResponse, geoResponse] = await Promise.all([
            fetch(weatherUrl),  // Get weather data
            fetch(geoUrl)       // Get location name
        ]);
        
        if (!weatherResponse.ok || !geoResponse.ok) {
            throw new Error('Failed to fetch data');
        }
        
        // Convert responses to JSON
        const weatherData = await weatherResponse.json();
        const geoData = await geoResponse.json();
        
        console.log('Weather data received:', weatherData);
        console.log('Location data received:', geoData);
        
        // Display the data
        displayWeatherData(weatherData, geoData, lat, lon);
        
    } catch (error) {
        // Handle any errors that occur
        console.error('Error fetching data:', error);
        weatherGrid.innerHTML = '<p style="color: red;">Failed to load weather data. Please try again.</p>';
    }
}


function displayWeatherData(weatherData, geoData, lat, lon) {
    // Get DOM element references
    const locationName = document.getElementById('location-name');
    const locationCoords = document.getElementById('location-coords');
    const weatherGrid = document.getElementById('weather-grid');
    
    
    const city = geoData.address?.city || 
                geoData.address?.town || 
                geoData.address?.village || 
                geoData.address?.county ||
                'Unknown Location';
    const country = geoData.address?.country || '';
    
    // Update location display
    locationName.textContent = `${city}${country ? ', ' + country : ''}`;
    locationCoords.textContent = `Coordinates: ${lat}°, ${lon}°`;
    
    // Extract current weather from API response
    const current = weatherData.current_weather;
    const hourlyData = weatherData.hourly;
    
    // Get current hour for accessing hourly data arrays
    const currentHour = new Date().getHours();
    
    // Weather code to description mapping (WMO codes)
    const weatherCodes = {
        0: 'Clear Sky ☀️',
        1: 'Mainly Clear 🌤️',
        2: 'Partly Cloudy ⛅',
        3: 'Overcast ☁️',
        45: 'Foggy 🌫️',
        48: 'Rime Fog 🌫️',
        51: 'Light Drizzle 🌦️',
        53: 'Moderate Drizzle 🌦️',
        55: 'Dense Drizzle 🌧️',
        61: 'Slight Rain 🌧️',
        63: 'Moderate Rain 🌧️',
        65: 'Heavy Rain 🌧️',
        71: 'Slight Snow ❄️',
        73: 'Moderate Snow ❄️',
        75: 'Heavy Snow ❄️',
        77: 'Snow Grains ❄️',
        80: 'Rain Showers 🌧️',
        81: 'Rain Showers 🌧️',
        82: 'Heavy Showers 🌧️',
        85: 'Snow Showers 🌨️',
        86: 'Heavy Snow 🌨️',
        95: 'Thunderstorm ⛈️',
        96: 'Thunderstorm ⛈️',
        99: 'Severe Storm ⛈️'
    };
    
    const weatherDesc = weatherCodes[current.weathercode] || 'Unknown';
    
    if (marker) {
        marker.setPopupContent(`<strong>${city}</strong><br>Click card below for details`);
    }
    
    
    weatherGrid.innerHTML = `
        <div class="weather-item weather-main">
            <label>Temperature</label>
            <span class="value">${Math.round(current.temperature)}°C</span>
        </div>
        <div class="weather-item weather-main">
            <label>Condition</label>
            <span class="value">${weatherDesc}</span>
        </div>
        <div class="weather-item">
            <label>Wind Speed</label>
            <span class="value">${Math.round(current.windspeed)} km/h</span>
        </div>
        <div class="weather-item">
            <label>Wind Direction</label>
            <span class="value">${current.winddirection}°</span>
        </div>
        <div class="weather-item">
            <label>Humidity</label>
            <span class="value">${hourlyData.relativehumidity_2m[currentHour]}%</span>
        </div>
        <div class="weather-item">
            <label>Precipitation</label>
            <span class="value">${hourlyData.precipitation[currentHour] || 0} mm</span>
        </div>
    `;
}


document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('city-search');
    
    searchInput.addEventListener('keypress', async function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            const city = this.value.trim();  
            
            console.log(`Searching for city: ${city}`);
            
            try {
                
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
                const data = await response.json();
                
                // Check if we found the city
                if (data && data.length > 0) {
                    // Extract coordinates
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    
                    console.log(`City found at: ${lat}, ${lon}`);
                    
                    // Switch to map view
                    showView('map');
                    
                    // Wait for map to be ready, then go to location
                    setTimeout(() => {
                        if (map) {
                            // Move map to city location with zoom level 10
                            map.setView([lat, lon], 10);
                            
                            // Create fake click event to trigger weather fetch
                            const latlng = L.latLng(lat, lon);
                            handleMapClick({ latlng });
                        }
                    }, 500);  // Wait 500ms for map to initialize
                } else {
                    // City not found
                    alert('City not found. Please try another search.');
                }
            } catch (error) {
                // Handle any errors
                console.error('Search error:', error);
                alert('Search failed. Please try again.');
            }
        }
    });
});


console.log('Weather Dashboard loaded successfully!');
console.log('Click "Open Map" to start exploring weather around the world!');
