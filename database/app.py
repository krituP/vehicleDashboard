from flask import Flask, jsonify, request
from google.cloud import firestore
from firebase_admin import credentials
import os
from datetime import datetime
import threading
import time
from flask_cors import CORS
import logging

# Add logger configuration
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['CORS_HEADERS'] = 'Content-Type'

# Set up Firestore client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/kritupatel/Projects/VehicleDashboard/database/vehicledashboardproject-firebase-adminsdk-qndnw-43f0048e2f.json"

db = firestore.Client()

# Constants
BATTERY_DRAIN_RATE = 0.1  # % per second when motor is running
CHARGING_RATE = 0.2  # % per second when charging
TEMP_INCREASE_RATE = 0.1  # °C per second when motor is running
TEMP_DECREASE_RATE = 0.05  # °C per second when motor is off

def calculate_power_consumption(rpm):
    """Standardized power consumption calculation"""
    if rpm > 0:
        return (rpm * 1000/800)
    return 0

# def store_historical_data(data):
#     """Store vehicle data with timestamp"""
#     try:
#         timestamp = datetime.now()
#         historical_data = {
#             'timestamp': timestamp,
#             'rpm': data.get('motor', {}).get('rpm', 0),
#             'power_consumption': data.get('motor', {}).get('powerConsumption', 0),
#             'battery_percentage': data.get('battery', {}).get('percentage', 0),
#             'temperature': data.get('battery', {}).get('temperature', 0),
#             'is_charging': data.get('battery', {}).get('isCharging', False)
#         }
        
#         # Store in a new collection called 'vehicleHistory'
#         db.collection('vehicleHistory').add(historical_data)
#     except Exception as e:
#         print(f"Error storing historical data: {e}")

def update_battery_status():
    """Background thread to update battery status"""
    while True:
        try:
            doc_ref = db.collection('vehicleStatus').document('current')
            doc = doc_ref.get().to_dict()
            
            if not doc:
                continue

            updates = {}
            battery = doc.get('battery', {})
            motor = doc.get('motor', {})
            
            current_rpm = motor.get('rpm', 0)
            is_charging = battery.get('isCharging', False)
            
            # Calculate power consumption
            power_consumption = -10 if is_charging else calculate_power_consumption(current_rpm)
            
            # Update battery percentage
            current_percentage = battery.get('percentage', 100)
            if is_charging:
                new_percentage = min(100, current_percentage + CHARGING_RATE)
            elif current_rpm > 0:
                new_percentage = max(0, current_percentage - BATTERY_DRAIN_RATE)
            else:
                new_percentage = current_percentage
                
            # Update battery temperature
            current_temp = battery.get('temperature', 25)
            if current_rpm > 0:
                new_temp = min(90, current_temp + (TEMP_INCREASE_RATE * (current_rpm/1000)))
            else:
                new_temp = max(25, current_temp - TEMP_DECREASE_RATE)
            
            updates['battery.percentage'] = new_percentage
            updates['battery.temperature'] = new_temp
            updates['motor.powerConsumption'] = power_consumption
            updates['indicators.batteryLow'] = new_percentage < battery.get('lowBatteryThreshold', 20)
            updates['indicators.motorActive'] = current_rpm > 0
            
            if updates:
                doc_ref.update(updates)
                # After updating current status, store historical data
                current_data = doc_ref.get().to_dict()
                store_historical_data(current_data)
            
        except Exception as e:
            print(f"Error in background thread: {e}")
        
        time.sleep(1)  # Update every second

# Start background thread
update_thread = threading.Thread(target=update_battery_status, daemon=True)
update_thread.start()

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get all vehicle status data"""
    doc = db.collection('vehicleStatus').document('current').get()
    return jsonify(doc.to_dict() if doc.exists else {})

@app.route('/api/motor/rpm', methods=['PUT'])
def update_rpm():
    """Update motor RPM"""
    data = request.json
    new_rpm = data.get('rpm', 0)
    
    doc_ref = db.collection('vehicleStatus').document('current')
    
    # Check if charging before allowing RPM update
    doc = doc_ref.get().to_dict()
    if doc.get('battery', {}).get('isCharging', False):
        return jsonify({"error": "Cannot change RPM while charging"}), 400
    
    updates = {
        'motor.rpm': new_rpm,
        'motor.isActive': new_rpm > 0,
        'motor.powerConsumption': calculate_power_consumption(new_rpm)  # Use standard calculation
    }
    
    doc_ref.update(updates)
    return jsonify({"success": True, "new_rpm": new_rpm})

@app.route('/api/battery/charging', methods=['PUT'])
def update_charging_state():
    """Update charging state"""
    data = request.json
    is_charging = data.get('isCharging', True)
    
    doc_ref = db.collection('vehicleStatus').document('current')
    
    updates = {
        'battery.isCharging': is_charging,
        'motor.rpm': 0 if is_charging else 0  # Stop motor when charging
    }
    
    doc_ref.update(updates)
    return jsonify({"success": True, "isCharging": is_charging})

def set_charging_status(is_charging):
    """Function to set charging status"""
    doc_ref = db.collection('vehicleStatus').document('current')
    
    updates = {
        'battery.isCharging': is_charging,
        'motor.rpm': 0 if is_charging else 0  # Stop motor when charging
    }
    
    doc_ref.update(updates)
    print(f"Charging status updated to: {is_charging}")

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get historical vehicle data"""
    try:
        # Get the 10 most recent records by default
        limit = int(request.args.get('limit', 10))
        
        # Query the most recent records
        query = (db.collection('vehicleHistory')
                .order_by('timestamp', direction=firestore.Query.DESCENDING)
                .limit(limit))
        
        docs = query.stream()
        history = []
        
        for doc in docs:
            data = doc.to_dict()
            # Convert timestamp to string for JSON serialization
            data['timestamp'] = data['timestamp'].isoformat()
            history.append(data)
        
        return jsonify(history)
    
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialize default values if they don't exist
    doc_ref = db.collection('vehicleStatus').document('current')
    
    # Reset charging status to False regardless of whether document exists or not
    
    
    if not doc_ref.get().exists:
        initial_data = {
            'motor': {
                'rpm': 0,
                'powerConsumption': 0,
                'gearRatio': '3:1',
                'isActive': False
            },
            'battery': {
                'percentage': 100,
                'temperature': 25,
                'isCharging': False,
                'lowBatteryThreshold': 20
            },
            'indicators': {
                'parkingBrake': False,
                'checkEngine': False,
                'motorActive': False,
                'batteryLow': False
            }
        }
        doc_ref.set(initial_data)
    else:
        doc_ref.update({
            'battery.isCharging': False,
            'motor.rpm': 0
        })
    
    app.run(debug=True)
