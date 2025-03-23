/**
 * Vahini Maps Authentication Module
 * Handles user login, registration, and profile management
 * Uses localStorage for client-side storage in this implementation
 */

// Global auth state
const authState = {
    user: null,
    loggedIn: false,
    reward: {
        points: 0,
        level: 1,
        badges: []
    }
};

// Initialize the authentication system
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setupAuthEventListeners();
    setupUserProfileEvents();
    loadUserFromStorage();
});

// Initialize authentication system
function initAuth() {
    // Initialize SQLite database (simulated in this implementation)
    // In a real implementation, this would connect to a backend
    console.log('Initializing authentication system...');
}

// Setup event listeners for authentication forms
function setupAuthEventListeners() {
    // Tab switching
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });
    
    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });
    
    // Login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        loginUser(email, password);
    });
    
    // Register form submission
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const termsAccepted = document.getElementById('register-terms').checked;
        
        if (password !== confirmPassword) {
            showAuthError('Passwords do not match');
            return;
        }
        
        if (!termsAccepted) {
            showAuthError('You must accept the Terms & Conditions');
            return;
        }
        
        registerUser(name, email, phone, password);
    });
    
    // Demo login
    document.getElementById('demo-login').addEventListener('click', () => {
        loginWithDemo();
    });
}

// Load user from localStorage if available
function loadUserFromStorage() {
    const storedUser = localStorage.getItem('vahini_user');
    
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            loginSuccess(user);
            console.log('User loaded from local storage:', user.name);
        } catch (err) {
            console.error('Failed to parse stored user:', err);
            logout();
        }
    }
}

// Login a user with credentials
function loginUser(email, password) {
    // In a real implementation, this would verify against a server
    // For demo, we'll use simulated users
    const users = getSimulatedUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showAuthError('User not found');
        return;
    }
    
    // Very simple password check (in a real app, this would use proper hashing)
    if (user.password !== password) {
        showAuthError('Invalid password');
        return;
    }
    
    // Login successful
    loginSuccess(user);
}

// Register a new user
function registerUser(name, email, phone, password) {
    // In a real implementation, this would send data to a server
    // For demo, we'll just simulate registration
    const users = getSimulatedUsers();
    
    // Check if email is already in use
    if (users.some(u => u.email === email)) {
        showAuthError('Email is already registered');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        password, // In a real app, this would be hashed
        dateCreated: new Date().toISOString(),
        rewards: {
            points: 100, // Starting points for new users
            level: 1,
            badges: ['newcomer']
        }
    };
    
    // In a real app, this would be saved to a database
    console.log('New user registered:', newUser);
    
    // Auto login after registration
    loginSuccess(newUser);
}

// Login with demo account
function loginWithDemo() {
    const demoUser = {
        id: 'demo123',
        name: 'Demo User',
        email: 'demo@vahini.app',
        phone: '9876543210',
        dateCreated: new Date().toISOString(),
        rewards: {
            points: 750,
            level: 3,
            badges: ['newcomer', 'reporter', 'navigator', 'helper']
        }
    };
    
    loginSuccess(demoUser);
}

// Process successful login
function loginSuccess(user) {
    // Store user data
    authState.user = user;
    authState.loggedIn = true;
    authState.rewards = user.rewards || { points: 0, level: 1, badges: [] };
    
    // Save to localStorage for persistence
    localStorage.setItem('vahini_user', JSON.stringify(user));
    
    // Update UI
    hideAuthOverlay();
    updateUserDisplay(user);
    
    // Show welcome notification
    window.showNotification(`Welcome, ${user.name}! You're logged in successfully.`, 3000);
}

// Logout user
function logout() {
    // Clear auth state
    authState.user = null;
    authState.loggedIn = false;
    
    // Clear localStorage
    localStorage.removeItem('vahini_user');
    
    // Update UI
    showAuthOverlay();
    updateUserDisplay(null);
    
    // Show notification
    window.showNotification('You have been logged out', 3000);
}

// Update user display in the header
function updateUserDisplay(user) {
    const usernameDisplay = document.getElementById('username-display');
    const profileBtn = document.getElementById('user-profile-btn');
    
    if (user) {
        usernameDisplay.textContent = user.name.split(' ')[0]; // Show first name only
        profileBtn.style.display = 'block';
    } else {
        usernameDisplay.textContent = 'User';
        profileBtn.style.display = 'none';
    }
}

// Setup user profile dropdown events
function setupUserProfileEvents() {
    const profileBtn = document.getElementById('user-profile-btn');
    const dropdown = document.getElementById('user-dropdown');
    
    // Toggle dropdown
    profileBtn.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Handle logout
    document.getElementById('user-logout-link').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Handle profile view
    document.getElementById('user-profile-link').addEventListener('click', (e) => {
        e.preventDefault();
        showUserProfile();
    });
    
    // Handle rewards view
    document.getElementById('user-rewards-link').addEventListener('click', (e) => {
        e.preventDefault();
        showUserRewards();
    });
    
    // Handle settings
    document.getElementById('user-settings-link').addEventListener('click', (e) => {
        e.preventDefault();
        showUserSettings();
    });
}

// Show user profile
function showUserProfile() {
    if (!authState.user) {
        showAuthOverlay();
        return;
    }
    
    // Create profile modal
    const profileModal = document.createElement('div');
    profileModal.className = 'modal-overlay';
    
    const user = authState.user;
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    profileModal.innerHTML = `
        <div class="user-profile-section">
            <div class="modal-header">
                <h2>My Profile</h2>
                <button class="close-button"><i class="fas fa-times"></i></button>
            </div>
            <div class="user-profile-header">
                <div class="user-avatar">${initials}</div>
                <div class="user-info">
                    <h2>${user.name}</h2>
                    <div class="user-meta">
                        <div><i class="fas fa-envelope"></i> ${user.email}</div>
                        <div><i class="fas fa-phone"></i> ${user.phone || 'Not provided'}</div>
                        <div><i class="fas fa-calendar"></i> Member since ${new Date(user.dateCreated).toLocaleDateString()}</div>
                    </div>
                </div>
            </div>
            <div class="user-stats">
                <div class="user-stat">
                    <div class="stat-value">${user.rewards?.points || 0}</div>
                    <div class="stat-label">Safety Points</div>
                </div>
                <div class="user-stat">
                    <div class="stat-value">${user.rewards?.level || 1}</div>
                    <div class="stat-label">Safety Level</div>
                </div>
                <div class="user-stat">
                    <div class="stat-value">${user.rewards?.badges?.length || 0}</div>
                    <div class="stat-label">Badges Earned</div>
                </div>
            </div>
            <div class="progress-section">
                <h3>Level Progress</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${calculateLevelProgress(user.rewards?.points || 0)}%"></div>
                </div>
                <div class="progress-info">
                    ${user.rewards?.points || 0} points • Next level at ${getNextLevelPoints(user.rewards?.level || 1)} points
                </div>
            </div>
            <div class="action-buttons">
                <button class="secondary-button">Edit Profile</button>
                <button class="text-button close-modal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(profileModal);
    
    // Add event listeners
    profileModal.querySelector('.close-button').addEventListener('click', () => {
        document.body.removeChild(profileModal);
    });
    
    profileModal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(profileModal);
    });
}

// Show user rewards
function showUserRewards() {
    if (!authState.user) {
        showAuthOverlay();
        return;
    }
    
    // Create rewards modal
    const rewardsModal = document.createElement('div');
    rewardsModal.className = 'modal-overlay';
    
    const user = authState.user;
    const rewards = user.rewards || { points: 0, level: 1, badges: [] };
    
    // All possible badges
    const allBadges = [
        { id: 'newcomer', name: 'Newcomer', icon: 'fa-star', description: 'Joined Vahini Maps' },
        { id: 'reporter', name: 'Reporter', icon: 'fa-exclamation-circle', description: 'Reported 5 incidents' },
        { id: 'navigator', name: 'Navigator', icon: 'fa-route', description: 'Completed 10 safe routes' },
        { id: 'helper', name: 'Community Helper', icon: 'fa-hands-helping', description: 'Helped improve safety data' },
        { id: 'explorer', name: 'Explorer', icon: 'fa-compass', description: 'Explored 20 new areas safely' },
        { id: 'guardian', name: 'Safety Guardian', icon: 'fa-shield-alt', description: 'Maintained high safety scores' }
    ];
    
    // Generate badge HTML
    const badgesHTML = allBadges.map(badge => {
        const isUnlocked = rewards.badges.includes(badge.id);
        return `
            <div class="reward-badge ${isUnlocked ? '' : 'locked'}">
                <i class="fas ${badge.icon}"></i>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-description">${isUnlocked ? badge.description : 'Locked'}</div>
            </div>
        `;
    }).join('');
    
    rewardsModal.innerHTML = `
        <div class="user-profile-section">
            <div class="modal-header">
                <h2>My Rewards</h2>
                <button class="close-button"><i class="fas fa-times"></i></button>
            </div>
            <div class="progress-section">
                <h3><i class="fas fa-award"></i> Safety Level ${rewards.level}</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${calculateLevelProgress(rewards.points)}%"></div>
                </div>
                <div class="progress-info">
                    ${rewards.points} points • Next level at ${getNextLevelPoints(rewards.level)} points
                </div>
            </div>
            <div class="user-rewards">
                <h3><i class="fas fa-medal"></i> Badges</h3>
                <div class="rewards-list">
                    ${badgesHTML}
                </div>
            </div>
            <div class="reward-history">
                <h3><i class="fas fa-history"></i> Recent Activities</h3>
                <div class="history-list">
                    <div class="history-item">
                        <div class="history-icon"><i class="fas fa-route"></i></div>
                        <div class="history-details">
                            <div class="history-title">Completed Safe Route</div>
                            <div class="history-meta">+20 points • 2 days ago</div>
                        </div>
                    </div>
                    <div class="history-item">
                        <div class="history-icon"><i class="fas fa-exclamation-circle"></i></div>
                        <div class="history-details">
                            <div class="history-title">Reported Incident</div>
                            <div class="history-meta">+50 points • 5 days ago</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="text-button close-modal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(rewardsModal);
    
    // Add event listeners
    rewardsModal.querySelector('.close-button').addEventListener('click', () => {
        document.body.removeChild(rewardsModal);
    });
    
    rewardsModal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(rewardsModal);
    });
}

// Show user settings
function showUserSettings() {
    if (!authState.user) {
        showAuthOverlay();
        return;
    }
    
    // Create settings modal
    const settingsModal = document.createElement('div');
    settingsModal.className = 'modal-overlay';
    
    settingsModal.innerHTML = `
        <div class="user-profile-section">
            <div class="modal-header">
                <h2>Settings</h2>
                <button class="close-button"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="settings-section">
                <h3>Notifications</h3>
                <div class="settings-option">
                    <div class="settings-label">Safety Alerts</div>
                    <label class="switch">
                        <input type="checkbox" id="setting-safety-alerts" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="settings-option">
                    <div class="settings-label">Weather Alerts</div>
                    <label class="switch">
                        <input type="checkbox" id="setting-weather-alerts" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="settings-option">
                    <div class="settings-label">Reward Notifications</div>
                    <label class="switch">
                        <input type="checkbox" id="setting-reward-notifs" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Map Preferences</h3>
                <div class="settings-option">
                    <div class="settings-label">Show Safety Zones</div>
                    <label class="switch">
                        <input type="checkbox" id="setting-show-zones" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="settings-option">
                    <div class="settings-label">Night Mode Maps</div>
                    <label class="switch">
                        <input type="checkbox" id="setting-night-mode">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>Privacy</h3>
                <div class="settings-option">
                    <div class="settings-label">Share My Reports</div>
                    <label class="switch">
                        <input type="checkbox" id="setting-share-reports" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="settings-option">
                    <div class="settings-label">Location History</div>
                    <label class="switch">
                        <input type="checkbox" id="setting-location-history">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="primary-button save-settings">Save Settings</button>
                <button class="text-button close-modal">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(settingsModal);
    
    // Add event listeners
    settingsModal.querySelector('.close-button').addEventListener('click', () => {
        document.body.removeChild(settingsModal);
    });
    
    settingsModal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(settingsModal);
    });
    
    settingsModal.querySelector('.save-settings').addEventListener('click', () => {
        // In a real app, this would save settings to the user profile
        saveUserSettings();
        document.body.removeChild(settingsModal);
        window.showNotification('Settings saved successfully', 3000);
    });
}

// Save user settings (simulated)
function saveUserSettings() {
    // In a real app, this would send settings to the server
    console.log('Settings saved');
}

// Calculate level progress percentage
function calculateLevelProgress(points) {
    const currentLevel = Math.floor(points / 250) + 1;
    const pointsForCurrentLevel = (currentLevel - 1) * 250;
    const pointsForNextLevel = currentLevel * 250;
    const progressPoints = points - pointsForCurrentLevel;
    const totalLevelPoints = pointsForNextLevel - pointsForCurrentLevel;
    
    return (progressPoints / totalLevelPoints) * 100;
}

// Get points needed for next level
function getNextLevelPoints(level) {
    return level * 250;
}

// Show authentication overlay
function showAuthOverlay() {
    const authOverlay = document.getElementById('auth-overlay');
    authOverlay.style.display = 'flex';
}

// Hide authentication overlay
function hideAuthOverlay() {
    const authOverlay = document.getElementById('auth-overlay');
    authOverlay.style.display = 'none';
}

// Show authentication error
function showAuthError(message) {
    // Create error element if it doesn't exist
    let errorElement = document.querySelector('.auth-error');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'auth-error';
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            const clonedError = errorElement.cloneNode(true);
            form.prepend(clonedError);
        });
        errorElement = document.querySelector('.auth-error');
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

// Get simulated users for demo
function getSimulatedUsers() {
    return [
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '9876543210',
            password: 'password123',
            dateCreated: '2023-01-15T00:00:00Z',
            rewards: {
                points: 650,
                level: 3,
                badges: ['newcomer', 'reporter', 'navigator']
            }
        },
        {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '9876543211',
            password: 'password123',
            dateCreated: '2023-02-20T00:00:00Z',
            rewards: {
                points: 320,
                level: 2,
                badges: ['newcomer', 'reporter']
            }
        }
    ];
}

// Export functions for use in other modules
window.auth = {
    isLoggedIn: () => authState.loggedIn,
    getCurrentUser: () => authState.user,
    logout: logout,
    addRewardPoints: (points, reason) => {
        if (authState.user && authState.loggedIn) {
            authState.user.rewards.points += points;
            
            // Update localStorage
            localStorage.setItem('vahini_user', JSON.stringify(authState.user));
            
            // Show notification
            window.showNotification(`+${points} safety points: ${reason}`, 3000);
            
            return true;
        }
        return false;
    }
};

// Add styles for auth error
const style = document.createElement('style');
style.textContent = `
    .auth-error {
        background-color: var(--danger-light);
        color: white;
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        margin-bottom: var(--spacing-md);
        display: none;
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9998;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
    }
    
    .settings-section {
        margin-bottom: var(--spacing-lg);
    }
    
    .settings-section h3 {
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
    }
    
    .settings-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .settings-label {
        font-weight: 500;
    }
    
    .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
    }
    
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
    }
    
    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
    }
    
    input:checked + .slider {
        background-color: var(--primary-color);
    }
    
    input:checked + .slider:before {
        transform: translateX(26px);
    }
    
    .slider.round {
        border-radius: 24px;
    }
    
    .slider.round:before {
        border-radius: 50%;
    }
    
    .progress-info {
        color: var(--text-secondary);
        font-size: 0.9rem;
        text-align: center;
    }
    
    .action-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: var(--spacing-lg);
    }
    
    .history-list {
        margin-top: var(--spacing-md);
    }
    
    .history-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--border-color);
    }
    
    .history-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--background-light);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: var(--spacing-md);
    }
    
    .history-icon i {
        color: var(--primary-color);
    }
    
    .history-details {
        flex: 1;
    }
    
    .history-meta {
        font-size: 0.85rem;
        color: var(--text-secondary);
    }
    
    .badge-description {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: var(--spacing-xs);
    }
`;

document.head.appendChild(style);
