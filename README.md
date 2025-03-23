# Vahini Safety Navigation 🚶‍♀️🚶‍♂️

> Navigate safely through the urban landscape of Hyderabad

## Access Our protoype here
epik-whale463.github.io/VahiniMaps/

## Our Interface
![image](https://github.com/user-attachments/assets/085ef166-0c3a-4de0-9d41-c550ce3bb69d)


## 🌟 Why Vahini?

Vahini transforms how you navigate through Hyderabad by making safety the priority. Unlike standard navigation apps that only optimize for distance or time, Vahini helps you avoid potentially unsafe areas like high crime zones, areas with limited medical access, and accident-prone locations.

## 🔍 Smart Features

- **Safety-First Routing**: Intelligently routes around known safety concerns
- **Customizable Safety Preferences**: Choose which hazards to avoid based on your personal needs
- **Balanced Route Optimization**: Avoids unsafe areas without sending you on impractical detours
- **Real-Time Safety Alerts**: Get notified when approaching areas of concern
- **Panic Button**: Emergency assistance when you need it most

## 📱 User-Friendly Interface

Vahini's clean, intuitive interface makes safety navigation simple:

- Interactive map with safety zone visualization
- Simple search functionality for source and destination
- Clearly visible safety preference toggles
- Color-coded routes showing normal vs. safety-optimized paths
- Real-time notifications keep you informed at every step

## 🛠️ Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Mapping**: Leaflet.js with OpenStreetMap tiles
- **Routing**: OSRM (Open Source Routing Machine)
- **Geocoding**: Nominatim
- **Safety Data**: Hyderabad Police Department crime statistics + community reports

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Location services enabled (for current location detection)

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vahini-navigation.git
cd vahini-navigation
```

2. Open index.html in your browser:
```bash
# On macOS/Linux
open index.html

# On Windows
start index.html
```

3. Allow location access when prompted or manually enter your starting point

4. Enter your destination and select your safety preferences

5. Click "Calculate Route" to see the standard route, then "Optimize Route" to see the safety-enhanced alternative

## 🔒 Safety Preferences Explained

Vahini currently offers four safety preferences:

| Preference | Description | When To Use |
|------------|-------------|------------|
| 🌙 **Avoid Lonely Areas** | Areas with minimal foot traffic, poor lighting | Evening/night travel, walking alone |
| 🚨 **Avoid High Crime Zones** | Areas with elevated crime rates | All users, especially at night |
| 🏥 **Avoid No Hospital Zones** | Areas far from medical facilities | Elderly users, those with medical conditions |
| 💥 **Avoid Accident-Prone Areas** | Intersections with high accident rates | All users, especially during rush hour |

## 🚀 Additional Features

### 1. **Individual & General Routing**
   - **Individual Routing:** Personalized routes avoiding unsafe zones or unwanted areas.
   - **General Routing:** Standard real-time data-based routes with minimal detours.
   - **Eco-Friendly Routing:** Suggests fuel-efficient and low-emission paths.

### 2. **Incident Reporting**
   - Categorized into infrastructure, traffic, crime, environment, events, and disasters.
   - Users can add images, videos, and severity levels.
   - Verification system to confirm or resolve reports.

### 3. **Showcasing Area Reports**
   - Official crime and safety statistics.
   - Unofficial crowd-sourced reports.
   - "Trust Index" combining official and unofficial data.

### 4. **Stay Alert Zones**
   - Highlights historical and real-time danger zones.
   - Heat maps for visual representation.

### 5. **Notifications for Stay Alert Zones**
   - Alerts when entering high-risk areas.
   - Customizable notifications for specific threats.

### 6. **Alternative Paths for Alert Zones**
   - Suggests safer detours near risky zones.
   - Displays travel time differences.

### 7. **Emergency Contact & Police Assistance**
   - One-tap emergency service contact.
   - Predefined messages for quick location sharing.

### 8. **Locating Nearest Safe Areas**
   - Highlights malls, shops, and well-lit areas.
   - Filters for immediate assistance (pharmacies, ATMs).

### 9. **Night Mode Safety Indicator**
   - Identifies areas safer at night.
   - Considers crowd density and lighting conditions.

### 10. **Weather-Related Alerts**
   - Notifications for extreme weather affecting routes.
   - Predictions for flood-prone or disaster areas.

### 11. **User Ratings & Feedback on Zones**
   - Rate and review area safety.
   - Gamified incentives for helpful feedback.

### 12. **Customizable Alert Settings**
   - Choose alert types (traffic, crime, weather).
   - Mute alerts for specific regions or times.

### 🔮 **Upcoming Features**
- [ ] **AI-Based Safety Prediction**
- [ ] **Community Safety Reporting System**
- [ ] **Integration with Local Law Enforcement**
- [ ] **Android & iOS App Development**
- [ ] **Real-Time Traffic Integration**
- [ ] **Offline Mode**

## 🎖️ **Reward System**
- Points, badges, and discounts for incident reporting.
- Leaderboards for top contributors.

Vahini ensures a safer, smarter way to navigate Hyderabad while keeping you informed and protected.


## 📊 How Route Optimization Works

Our algorithm:
1. Calculates the standard shortest route
2. Identifies safety concerns along that route based on your preferences
3. Creates an optimized route that:
   - Prioritizes your safety by avoiding selected hazard zones
   - Limits detours to no more than 25% of the original route distance
   - Ensures you stay within city limits for practicality

## 🔮 Roadmap

We're actively working on these exciting enhancements:

- [ ] Machine learning model to predict safety issues based on time of day
- [ ] Community reporting of safety concerns
- [ ] Integration with local police emergency services
- [ ] Native mobile apps for Android and iOS
- [ ] Real-time traffic integration
- [ ] Offline mode for areas with poor connectivity

## 🤝 Contributing

We welcome contributions from developers, safety experts, and community members! See our [Contributing Guidelines](CONTRIBUTING.md) for details on how to get involved.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Support

- **Email**: support@vahini.org

---

*Built with ❤️ for the safety of Hyderabad citizens*
