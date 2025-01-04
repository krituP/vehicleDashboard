let temperatureChart;
let batteryChart;

// Initialize charts
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute'
                },
                grid: {
                    color: '#333'
                }
            },
            y: {
                grid: {
                    color: '#333'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#fff'
                }
            }
        }
    };

    // Temperature Chart
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Temperature (°C)',
                borderColor: '#ff6b6b',
                tension: 0.1
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: '#fff'
                    }
                }
            }
        }
    });

    // Battery Chart
    const batteryCtx = document.getElementById('batteryChart').getContext('2d');
    batteryChart = new Chart(batteryCtx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Battery Level (%)',
                borderColor: '#4ecdc4',
                tension: 0.1
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Battery Level (%)',
                        color: '#fff'
                    }
                }
            }
        }
    });
}

// Update table with historical data
function updateTable(data) {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';

    // Sort data by timestamp in descending order (most recent first)
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    data.forEach(record => {
        const row = document.createElement('tr');
        const timestamp = new Date(record.timestamp).toLocaleString();
        row.innerHTML = `
            <td>${timestamp}</td>
            <td>${record.rpm?.toFixed(1) || '0.0'}</td>
            <td>${record.power_consumption?.toFixed(2) || '0.00'}</td>
            <td>${record.battery_percentage?.toFixed(1) || '0.0'}</td>
            <td>${record.temperature?.toFixed(1) || '0.0'}</td>
            <td><i class="fas fa-plug ${record.is_charging ? 'charging-status' : 'not-charging-status'}"></i></td>
        `;
        tbody.appendChild(row);
    });
}

// Update charts with historical data
function updateCharts(data) {
    // Sort data by timestamp in ascending order for charts
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const timestamps = data.map(record => new Date(record.timestamp));
    const temperatures = data.map(record => record.temperature || 0);
    const batteryLevels = data.map(record => record.battery_percentage || 0);

    temperatureChart.data.labels = timestamps;
    temperatureChart.data.datasets[0].data = temperatures;
    temperatureChart.update();

    batteryChart.data.labels = timestamps;
    batteryChart.data.datasets[0].data = batteryLevels;
    batteryChart.update();
}

// Fetch and display historical data
async function fetchHistoricalData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/history`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.length === 0) {
            console.log('No historical data available');
            document.querySelector('#historyTable tbody').innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center;">No historical data available</td>
                </tr>`;
            return;
        }
        
        updateTable(data);
        updateCharts(data);
    } catch (error) {
        console.error('Error fetching historical data:', error);
        document.querySelector('#historyTable tbody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">Error loading data: ${error.message}</td>
            </tr>`;
    }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    fetchHistoricalData();
    
    // Refresh data every 10 seconds
    setInterval(fetchHistoricalData, 10000);
}); 