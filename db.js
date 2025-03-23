/**
 * Vahini Maps Database Module
 * 
 * In a real implementation, this would use SQLite or another database.
 * For this demo, we're using localStorage as a simple key-value store.
 */

const DB = {
    // Database name
    name: 'vahini_db',
    
    // Tables as object stores
    tables: {
        users: 'users',
        incidents: 'incidents',
        routes: 'routes',
        alertZones: 'alert_zones',
        safetyScores: 'safety_scores',
        rewards: 'rewards',
        settings: 'settings'
    },
    
    // Initialize database
    init() {
        console.log('Initializing database...');
        
        // Initialize tables if they don't exist
        for (const table of Object.values(this.tables)) {
            if (!localStorage.getItem(`${this.name}_${table}`)) {
                localStorage.setItem(`${this.name}_${table}`, JSON.stringify([]));
            }
        }
        
        // Initialize alert zones if they don't exist
        this.initializeAlertZones();
        
        console.log('Database initialized.');
    },
    
    // Get all records from a table
    getAll(table) {
        try {
            const data = localStorage.getItem(`${this.name}_${table}`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Error getting data from ${table}:`, error);
            return [];
        }
    },
    
    // Get record by ID
    getById(table, id) {
        try {
            const data = this.getAll(table);
            return data.find(item => item.id === id);
        } catch (error) {
            console.error(`Error getting record from ${table}:`, error);
            return null;
        }
    },
    
    // Insert a record
    insert(table, record) {
        try {
            const data = this.getAll(table);
            
            // Ensure record has an ID
            if (!record.id) {
                record.id = Date.now().toString();
            }
            
            // Add created timestamp
            record.created_at = new Date().toISOString();
            
            data.push(record);
            localStorage.setItem(`${this.name}_${table}`, JSON.stringify(data));
            
            return record;
        } catch (error) {
            console.error(`Error inserting into ${table}:`, error);
            return null;
        }
    },
    
    // Update a record
    update(table, id, updates) {
        try {
            const data = this.getAll(table);
            const index = data.findIndex(item => item.id === id);
            
            if (index === -1) {
                return null;
            }
            
            // Add updated timestamp
            updates.updated_at = new Date().toISOString();
            
            // Merge updates with existing record
            data[index] = { ...data[index], ...updates };
            
            localStorage.setItem(`${this.name}_${table}`, JSON.stringify(data));
            
            return data[index];
        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            return null;
        }
    },
    
    // Delete a record
    delete(table, id) {
        try {
            const data = this.getAll(table);
            const filteredData = data.filter(item => item.id !== id);
            
            localStorage.setItem(`${this.name}_${table}`, JSON.stringify(filteredData));
            
            return true;
        } catch (error) {
            console.error(`Error deleting from ${table}:`, error);
            return false;
        }
    },
    
    // Query records (simple filter)
    query(table, filterFn) {
        try {
            const data = this.getAll(table);
            return data.filter(filterFn);
        } catch (error) {
            console.error(`Error querying ${table}:`, error);
            return [];
        }
    },
    
    // Initialize alert zones with default data
    initializeAlertZones() {
        const alertZones = this.getAll(this.tables.alertZones);
        
        // Only initialize if no zones exist
        if (alertZones.length === 0) {
            const defaultZones = [
                {
                    id: 'lonely_1',
                    type: 'lonely',
                    name: 'Lonely Area 1',
                    center: [17.42, 78.45],
                    radius: 800,
                    safetyScore: 30,
                    description: 'Isolated area with low foot traffic during night hours'
                },
                {
                    id: 'lonely_2',
                    type: 'lonely',
                    name: 'Lonely Area 2',
                    center: [17.35, 78.40],
                    radius: 800,
                    safetyScore: 25,
                    description: 'Remote location with poor lighting and minimal surveillance'
                },
                {
                    id: 'crime_1',
                    type: 'crime',
                    name: 'High Crime Zone 1',
                    center: [17.40, 78.50],
                    radius: 600,
                    safetyScore: 10,
                    description: 'Area with history of frequent theft and assault incidents'
                },
                {
                    id: 'crime_2',
                    type: 'crime',
                    name: 'High Crime Zone 2',
                    center: [17.38, 78.47],
                    radius: 600,
                    safetyScore: 15,
                    description: 'Zone with reported muggings and property crime'
                },
                {
                    id: 'hospital_1',
                    type: 'hospital',
                    name: 'No Hospital Zone 1',
                    center: [17.37, 78.52],
                    radius: 900,
                    safetyScore: 40,
                    description: 'Area with limited access to medical facilities'
                },
                {
                    id: 'hospital_2',
                    type: 'hospital',
                    name: 'No Hospital Zone 2',
                    center: [17.39, 78.42],
                    radius: 900,
                    safetyScore: 35,
                    description: 'Region with no nearby medical services or pharmacies'
                },
                {
                    id: 'accident_1',
                    type: 'accident',
                    name: 'Accident-Prone Area 1',
                    center: [17.41, 78.49],
                    radius: 700,
                    safetyScore: 20,
                    description: 'Road segment with frequent traffic accidents and poor infrastructure'
                },
                {
                    id: 'accident_2',
                    type: 'accident',
                    name: 'Accident-Prone Area 2',
                    center: [17.36, 78.44],
                    radius: 700,
                    safetyScore: 25,
                    description: 'Junction with limited visibility and accident history'
                }
            ];
            
            // Insert default zones
            for (const zone of defaultZones) {
                this.insert(this.tables.alertZones, zone);
            }
            
            console.log('Default alert zones initialized.');
        }
    },
    
    // Add a reported incident
    reportIncident(incident) {
        // Ensure required fields
        if (!incident.type || !incident.location || !incident.severity) {
            console.error('Missing required incident fields');
            return null;
        }
        
        // Add additional fields
        incident.status = 'pending'; // pending, verified, resolved
        incident.votes = 0; // Community votes for verifying incident
        
        return this.insert(this.tables.incidents, incident);
    },
    
    // Get incidents near a location
    getIncidentsNearLocation(lat, lng, radius = 2000) {
        const incidents = this.getAll(this.tables.incidents);
        
        // Filter incidents within radius (very simple calculation)
        return incidents.filter(incident => {
            const distance = Math.sqrt(
                Math.pow(incident.location[0] - lat, 2) + 
                Math.pow(incident.location[1] - lng, 2)
            ) * 111000; // Rough conversion to meters
            
            return distance <= radius;
        });
    },
    
    // Save user route for history
    saveRoute(userId, routeData) {
        const route = {
            userId,
            source: routeData.source,
            destination: routeData.destination,
            distance: routeData.distance,
            duration: routeData.duration,
            safetyScore: routeData.safetyScore,
            timestamp: new Date().toISOString(),
            coordinates: routeData.coordinates
        };
        
        return this.insert(this.tables.routes, route);
    },
    
    // Get user routes
    getUserRoutes(userId) {
        return this.query(this.tables.routes, route => route.userId === userId);
    },
    
    // Add reward points for user
    addRewardPoints(userId, points, action) {
        const reward = {
            userId,
            points,
            action,
            timestamp: new Date().toISOString()
        };
        
        return this.insert(this.tables.rewards, reward);
    },
    
    // Get total reward points for user
    getUserTotalRewards(userId) {
        const rewards = this.query(this.tables.rewards, reward => reward.userId === userId);
        return rewards.reduce((total, reward) => total + reward.points, 0);
    },
    
    // Save user settings
    saveUserSettings(userId, settings) {
        // First check if settings exist
        const existingSettings = this.query(
            this.tables.settings, 
            setting => setting.userId === userId
        );
        
        if (existingSettings.length > 0) {
            return this.update(this.tables.settings, existingSettings[0].id, settings);
        }
        
        // Create new settings
        settings.userId = userId;
        return this.insert(this.tables.settings, settings);
    },
    
    // Get user settings
    getUserSettings(userId) {
        const settings = this.query(this.tables.settings, setting => setting.userId === userId);
        return settings.length > 0 ? settings[0] : null;
    }
};

// Auto-initialize database when loaded
document.addEventListener('DOMContentLoaded', () => {
    DB.init();
});

// Export the database object to window for global access
window.DB = DB;
