// Add this at the start of your file
console.log('API URL:', API_BASE_URL);

// Add this function to test the connection
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/test`);
        const data = await response.json();
        console.log('Server test:', data);

        const dbResponse = await fetch(`${API_BASE_URL}/api/test`);
        const dbData = await dbResponse.json();
        console.log('Database test:', dbData);

        const statusResponse = await fetch(`${API_BASE_URL}/api/status`);
        const statusData = await statusResponse.json();
        console.log('Status data:', statusData);
    } catch (error) {
        console.error('Connection test failed:', error);
    }
}

// Call the test function when the page loads
document.addEventListener('DOMContentLoaded', testConnection);

// Status indicator controls
const statusIndicators = {
    parkingBrake: false,
    checkEngine: false,
    motorStatus: false,
    batteryLow: false
};

// Function to update visual state of status indicators
function updateStatusIndicator(id, isActive) {
    const indicator = document.getElementById(id);
    if (indicator) {
        statusIndicators[id] = isActive;
        // Add or remove 'active' class based on state
        if (isActive) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    }
}

// Example usage to turn parking brake on
updateStatusIndicator('checkEngine', true);

// To turn it off later
// updateStatusIndicator('parkingBrake', false);

// Add click handler for parking brake
document.getElementById('parkingBrake').addEventListener('click', () => {
    const newState = !statusIndicators.parkingBrake;
    updateStatusIndicator('parkingBrake', newState);
});

// Mapping of speed settings to RPM values
const speedToRPM = {
    0: 0,     // OFF position
    1: 200,   // Speed setting 1
    2: 400,   // Speed setting 2
    3: 600,   // Speed setting 3
    4: 800    // Speed setting 4
};

// Get the speed slider element
const speedSlider = document.getElementById('speedControl');

// Add event listener for slider changes
speedSlider.addEventListener('change', async function() {
    const speedSetting = parseInt(this.value);
    const targetRPM = speedToRPM[speedSetting];
    
    try {
        // Send RPM update request to backend
        const response = await fetch(`${API_BASE_URL}/api/motor/rpm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rpm: targetRPM })
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log('RPM updated successfully:', targetRPM);
            rpmGauge(targetRPM);  // Update gauge display
            document.getElementById('currentRpm').textContent = `${targetRPM} RPM`;
        } else {
            console.error('Failed to update RPM:', data.error);
            // Revert slider if update failed
            const currentRPM = document.getElementById('currentRpm').textContent.split(' ')[0];
            speedSlider.value = Object.entries(speedToRPM).find(([k, v]) => v === parseInt(currentRPM))?.[0] || 0;
        }
    } catch (error) {
        console.error('Error updating RPM:', error);
    }
});

// Initialize gauges with correct zero positions
function initializeGauges() {
    // Set both needles to their correct zero positions
    powerGauge(0); // This should correspond to the angle for 0 kW
     rpmGauge(0);   // This should correspond to the angle for 0 RPM

    // First sweep to max values
   setTimeout(() => {
        powerGauge(1000); // Sweep to max kW
        rpmGauge(800);    // Sweep to max RPM
    }, 500);

    // Then return to zero
    setTimeout(() => {
        powerGauge(-1000); // Return to min kW
        rpmGauge(0);   // Return to 0 RPM
    }, 1500);

    // Initialize slider and display
    speedSlider.value = 0;
    document.getElementById('currentRpm').textContent = '0 RPM';
}

// Run initialization when page loads
window.addEventListener('DOMContentLoaded', initializeGauges);

// Function to fetch vehicle status
async function fetchVehicleStatus() {
    try {
        console.log('Fetching from:', `${API_BASE_URL}/api/status`); // Debug log
        const response = await fetch(`${API_BASE_URL}/api/status`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching vehicle status:', error);
        // Add visual feedback for users
        document.getElementById('connectionStatus')?.classList.add('error');
    }
}

// Function to update dashboard with received data
function updateDashboard(data) {
    // Update indicators
    updateStatusIndicator('parkingBrake', data.indicators?.parkingBrake);
    updateStatusIndicator('checkEngine', data.indicators?.checkEngine);
    updateStatusIndicator('motorStatus', data.indicators?.motorActive);
    updateStatusIndicator('batteryLow', data.indicators?.batteryLow);

    // Update power gauge
    if (data.motor?.powerConsumption !== undefined) {
        powerGauge(data.motor.powerConsumption);
        document.getElementById('powerValue').textContent = data.motor.powerConsumption;
    }

    // Update RPM
    if (data.motor?.rpm !== undefined) {
        rpmGauge(data.motor.rpm);
        document.getElementById('rpmValue').textContent = data.motor.rpm.toFixed(1);
    }

    // Update info bar values with null checks
    if (data.motor?.gearRatio) {
        document.getElementById('gearRatio').textContent = data.motor.gearRatio;
    }
    if (data.battery?.percentage !== undefined) {
        document.getElementById('batteryPercentage').textContent = data.battery.percentage.toFixed(2);
    }
    if (data.battery?.temperature !== undefined) {
        document.getElementById('temperature').textContent = data.battery.temperature.toFixed(2);
    }
}

// Add this near your other initialization code
let isCharging = false; // Track charging state

// Add click handler for charging button
document.getElementById('chargingButton').addEventListener('click', async function() {
    try {
        // Toggle the charging state
        isCharging = !isCharging;
        
        // Update the charging state in the backend
        const response = await fetch(`${API_BASE_URL}/api/battery/charging`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isCharging: isCharging })
        });

        if (response.ok) {
            // Get the speed slider
            const speedSlider = document.getElementById('speedControl');
            
            if (isCharging) {
                // If charging is turned on:
                // 1. Set speed to 0
                speedSlider.value = 0;
                // 2. Trigger the change event to update RPM
                speedSlider.dispatchEvent(new Event('change'));
                // 3. Disable the slider
                speedSlider.disabled = true;
                speedSlider.style.opacity = '0.5';
            } else {
                // If charging is turned off, enable the slider
                speedSlider.disabled = false;
                speedSlider.style.opacity = '1';
            }

            // Visually update the button to show current state
            const chargingButton = document.getElementById('chargingButton');
            if (isCharging) {
                chargingButton.classList.add('active');
            } else {
                chargingButton.classList.remove('active');
            }
        } else {
            console.error('Failed to update charging state');
        }
    } catch (error) {
        console.error('Error updating charging state:', error);
    }
});

// Poll for updates every second
setInterval(fetchVehicleStatus, 1000);

// Initial fetch when page loads
document.addEventListener('DOMContentLoaded', fetchVehicleStatus);

// Add this code to your existing dashboard.js file

document.getElementById('updateParkingBrakeButton').addEventListener('click', async function() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/indicators/parkingBrake`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ active: true }) // Set to true to activate the parking brake
        });
        const data = await response.json();
        console.log('Parking brake indicator updated:', data);
        updateStatusIndicator('parkingBrake', data.parkingBrake); // Update the UI
    } catch (error) {
        console.error('Error updating parking brake indicator:', error);
    }
});

// Function to fetch and update vehicle status
async function updateVehicleStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Update all dashboard elements with the received data
        updateDashboard(data);
        
        // Update charging button state and slider
        const isCharging = data.battery?.isCharging || false;
        const chargingButton = document.getElementById('chargingButton');
        const speedSlider = document.getElementById('speedControl');
        
        if (isCharging) {
            chargingButton.classList.add('active');
            speedSlider.disabled = true;
            speedSlider.style.opacity = '0.5';
        } else {
            chargingButton.classList.remove('active');
            speedSlider.disabled = false;
            speedSlider.style.opacity = '1';
        }
        
    } catch (error) {
        console.error('Error fetching vehicle status:', error);
    }
}

// Start periodic updates
setInterval(updateVehicleStatus, 1000); // Update every second

// Initial update
updateVehicleStatus();

function updateRPMGauge(rpm) {
    // Call the gauge update function that was returned by createGauge
    rpmGauge(rpm);
}

// Add this with your other initialization code
document.addEventListener('DOMContentLoaded', () => {
    // ... other initialization code ...

   
    
});

