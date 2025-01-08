// Update the API_BASE_URL logic
const API_BASE_URL = window.location.protocol === 'file:' || window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:5001' 
    : 'https://vehicledashboard.onrender.com';

console.log('Current location:', window.location.protocol, window.location.hostname);
console.log('Selected API_BASE_URL:', API_BASE_URL);

let dataTable;

async function testConnection() {
    try {
        // Test basic server connection
        console.log('Testing server connection...');
        const testResponse = await fetch(`${API_BASE_URL}/test`);
        const testData = await testResponse.json();
        console.log('Server test response:', testData);

        // Test database connection
        console.log('Testing database connection...');
        const dbTestResponse = await fetch(`${API_BASE_URL}/api/test`);
        const dbTestData = await dbTestResponse.json();
        console.log('Database test response:', dbTestData);

        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}

async function fetchHistoricalData() {
    try {
        // First test the connection
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to connect to server');
        }

        console.log('Fetching historical data from:', `${API_BASE_URL}/api/history`);
        const response = await fetch(`${API_BASE_URL}/api/history`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw data received:', data); // Debug the raw data
        
        if (!Array.isArray(data)) {
            console.error('Received data is not an array:', data);
            return [];
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        // Add visual feedback
        const container = document.querySelector('.history-container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.padding = '10px';
            errorDiv.textContent = `Error: ${error.message}`;
            container.insertBefore(errorDiv, container.firstChild);
        }
        return [];
    }
}

function formatTimestamp(timestamp) {
    if (!timestamp || !timestamp._seconds) {
        console.log('Invalid timestamp:', timestamp);
        return 'Invalid Date';
    }
    return new Date(timestamp._seconds * 1000).toLocaleString();
}

function initializeDataTable(data) {
    console.log('Initializing table with data:', data); // Debug the data being used

    if (dataTable) {
        dataTable.destroy(); // Destroy existing table if it exists
    }

    dataTable = $('#historyTable').DataTable({
        data: data,
        columns: [
            { 
                data: 'timestamp',
                render: function(data, type, row) {
                    console.log('Timestamp data:', data); // Debug timestamp
                    return formatTimestamp(data);
                }
            },
            { 
                data: 'rpm',
                render: function(data) {
                    return data || 0;
                }
            },
            { 
                data: 'power_consumption',
                render: function(data) {
                    return data ? data.toFixed(2) : '0.00';
                }
            },
            { 
                data: 'battery_percentage',
                render: function(data) {
                    return data || 0;
                }
            },
            { 
                data: 'temperature',
                render: function(data) {
                    return data || 0;
                }
            },
            { 
                data: 'is_charging',
                render: function(data) {
                    return data ? 'Charging' : 'Not Charging';
                }
            }
        ],
        order: [[0, 'desc']], // Sort by timestamp descending
        pageLength: 25,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel'
        ]
    });
}

async function loadHistoricalData() {
    console.log('Starting to load historical data...');
    console.log('Using API URL:', API_BASE_URL);
    
    const data = await fetchHistoricalData();
    
    if (data.length === 0) {
        console.log('No historical data found');
        // Add visual feedback
        const container = document.querySelector('.history-container');
        if (container) {
            const noDataDiv = document.createElement('div');
            noDataDiv.style.padding = '10px';
            noDataDiv.textContent = 'No historical data available';
            container.insertBefore(noDataDiv, container.firstChild);
        }
    } else {
        console.log(`Found ${data.length} records`);
        initializeDataTable(data);
    }
}

// Wait for DOM and then load data
document.addEventListener('DOMContentLoaded', loadHistoricalData); 