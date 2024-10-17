import random
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import pytz
import json
import paho.mqtt.client as mqtt

app = Flask(__name__)
CORS(app)  # Kích hoạt CORS


def get_sensor_data():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    # Truy vấn để lấy giá trị mới nhất của các cảm biến (không cần cột time)
    cursor.execute("""
        SELECT temperature, humidity, light, dust
        FROM sensors
        ORDER BY id DESC
        LIMIT 1
    """)

    row = cursor.fetchone()
    conn.close()

    # Kiểm tra nếu không có dữ liệu
    if not row:
        return None

    # Tạo từ điển để lưu trữ kết quả
    data = {
        "temperature": row[0],
        "humidity": row[1],
        "light": row[2],
        "dust": row[3],
    }

    return data


@app.route('/api/sensor_data', methods=['GET'])
def sensor_data():
    data = get_sensor_data()
    if data:
        return jsonify(data)
    return jsonify({"error": "No data found"}), 404


def get_chart_data():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    # Truy vấn để lấy 20 mẫu dữ liệu mới nhất cho cả 3 loại cảm biến
    cursor.execute("""
        SELECT temperature, humidity, light, dust
        FROM sensors
        ORDER BY id DESC 
        LIMIT 20
    """)

    rows = cursor.fetchall()
    conn.close()

    # Chuyển đổi dữ liệu thành dạng list của list cho đúng với logic JS
    data = [[row[0], row[1], row[2], row[3]] for row in rows]

    return data


@app.route('/api/chart_data', methods=['GET'])
def chart_data():
    data = get_chart_data()
    return jsonify(data)

# -----------------------------------------------------------------------------------


@app.route('/api/device-status', methods=['GET'])
def get_device_status():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT device_name, status FROM devices ORDER BY time DESC")
    rows = cursor.fetchall()

    # Lấy trạng thái mới nhất cho mỗi thiết bị
    status_map = {}
    for row in rows:
        if row[0] not in status_map:
            status_map[row[0]] = row[1]

    conn.close()
    return jsonify(status_map)


#-------------------------get on off -------------------------------------------------
# API lấy số lần bật/tắt của mỗi thiết bị trong 24 giờ qua
@app.route('/api/device-toggle-count', methods=['GET'])
def get_device_toggle_count():
    # Thời gian hiện tại và 24 giờ trước
    current_time = datetime.now()
    past_24_hours = current_time - timedelta(hours=24)

    # Câu SQL lấy số lần bật/tắt của từng thiết bị trong 24 giờ qua
    query = '''
        SELECT device, 
               SUM(CASE WHEN status = 'on' THEN 1 ELSE 0 END) AS on_count,
               SUM(CASE WHEN status = 'off' THEN 1 ELSE 0 END) AS off_count
        FROM devices
        WHERE timestamp >= ?
        GROUP BY device;
    '''

    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()
    cursor = conn.execute(query, (past_24_hours,))
    results = cursor.fetchall()
    conn.close()

    # Chuyển đổi kết quả thành dạng dictionary để trả về JSON
    device_toggle_counts = []
    for row in results:
        device_toggle_counts.append({
            'device': row['device'],
            'on_count': row['on_count'],
            'off_count': row['off_count']
        })

    return jsonify(device_toggle_counts)


# --------------------------notification---------------------------------------------

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT message, timestamp FROM notification ORDER BY id DESC LIMIT 10")
    rows = cursor.fetchall()

    notifications = [{'message': row[0], 'timestamp': row[1]} for row in rows]
    conn.close()

    return jsonify(notifications)


def add_notification(message):
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO notification (message) VALUES (?)", (message,))
    conn.commit()
    conn.close()


@app.route('/api/add-notification', methods=['POST'])
def add_notification_route():
    data = request.get_json()
    message = data.get('message')

    if message:
        add_notification(message)
        return jsonify({'success': True}), 200
    else:
        return jsonify({'success': False, 'error': 'No message provided'}), 400

# ------------------------------------Thong Ke-------------------------------------------


@app.route('/api/sensors/all', methods=['GET'])
def get_all_sensors_data():
    conn = sqlite3.connect(r'G:/Coding/database/iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, temperature, humidity, light, time FROM sensors ORDER BY id ASC")
    rows = cursor.fetchall()

    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'nhiet_do': row[1],
            'do_am': row[2],
            'do_sang': row[3],
            'time': row[4]  # Đảm bảo rằng thời gian được trả về đúng định dạng
        })

    conn.close()
    return jsonify(data)


# ----------------------------------------Lich Su-----------------------------------------
@app.route('/api/devices', methods=['GET'])
def get_devices_data():
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, device_name, status, time FROM devices ORDER BY id DESC")
    rows = cursor.fetchall()

    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'device_name': row[1],
            'status': row[2],
            'time': row[3]
        })

    conn.close()
    return jsonify(data)




def get_alert_on_count():
    # Connect to the SQLite database
    conn = sqlite3.connect("G:/Coding/database/iot.db")
    cursor = conn.cursor()

    # Query to count the number of times an alert device was turned on
    query = "SELECT COUNT(*) FROM devices WHERE device_name = 'alert' AND status = 'on'"
    cursor.execute(query)

    # Fetch the count
    result = cursor.fetchone()[0]

    # Close the database connection
    cursor.close()
    conn.close()

    return result

@app.route('/api/alert/on_count', methods=['GET'])
def alert_on_count():
    try:
        # Get the number of times the alert device was turned on
        count = get_alert_on_count()
        # Return the result as a JSON response
        return jsonify({"alert_on_count": count}), 200
    except Exception as e:
        # Handle any errors that occur during the process
        return jsonify({"error": str(e)}), 500


# ------------------------------------device filter by day---------------------------------
@app.route('/api/devices-filter', methods=['GET'])
def get_devices_data_filter():
    # Nhận tham số "filter" từ query string
    filter_param = request.args.get(
        'filter', 'all')  # Giá trị mặc định là "all"

    # Kết nối tới cơ sở dữ liệu
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    # Lấy thời gian hiện tại
    now = datetime.now()

    # Xây dựng câu truy vấn SQL và giá trị bộ lọc
    query = "SELECT id, device_name, status, time FROM devices WHERE 1=1"
    params = []

    if filter_param == 'today':
        # Lọc cho dữ liệu của ngày hôm nay
        start_date = now.strftime('%Y-%m-%d 00:00:00')
        end_date = now.strftime('%Y-%m-%d 23:59:59')
        query += " AND time BETWEEN ? AND ?"
        params.extend([start_date, end_date])

    elif filter_param == '7days':
        # Lọc cho dữ liệu trong 7 ngày qua
        start_date = (now - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    elif filter_param == '1month':
        # Lọc cho dữ liệu trong 1 tháng qua
        start_date = (now - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    elif filter_param == '3months':
        # Lọc cho dữ liệu trong 3 tháng qua
        start_date = (now - timedelta(days=90)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    # Sắp xếp theo thời gian mới nhất trước
    query += " ORDER BY time DESC"

    # Thực hiện truy vấn
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Định dạng dữ liệu kết quả thành danh sách các dictionary
    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'device_name': row[1],
            'status': row[2],
            'time': row[3]
        })

    # Đóng kết nối cơ sở dữ liệu
    conn.close()

    # Trả về dữ liệu dưới dạng JSON
    return jsonify(data)

# -----------------------------filter sensor data------------------------------
# Đảm bảo mã API trả về dữ liệu đúng định dạng


@app.route('/api/sensors-filter', methods=['GET'])
def get_sensors_data_filter():
    # Nhận các tham số từ query string
    filter_param = request.args.get('filter', 'all')
    search_query = request.args.get('search', '')

    # Kết nối tới cơ sở dữ liệu
    conn = sqlite3.connect('G:/Coding/database/iot.db')
    cursor = conn.cursor()

    # Lấy thời gian hiện tại
    now = datetime.now()

    # Xây dựng câu truy vấn SQL và giá trị bộ lọc
    query = "SELECT id, temperature, humidity, light, dust, time FROM sensors WHERE 1=1"
    params = []

    if filter_param == 'today':
        # Lọc dữ liệu của ngày hôm nay
        start_date = now.strftime('%Y-%m-%d 00:00:00')
        end_date = now.strftime('%Y-%m-%d 23:59:59')
        query += " AND time BETWEEN ? AND ?"
        params.extend([start_date, end_date])

    elif filter_param == '7days':
        # Lọc dữ liệu trong 7 ngày qua
        start_date = (now - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    elif filter_param == '1month':
        # Lọc dữ liệu trong 1 tháng qua
        start_date = (now - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    elif filter_param == '3months':
        # Lọc dữ liệu trong 3 tháng qua
        start_date = (now - timedelta(days=90)).strftime('%Y-%m-%d %H:%M:%S')
        query += " AND time >= ?"
        params.append(start_date)

    if search_query:
        # Tìm kiếm theo chuỗi thời gian
        query += " AND time LIKE ?"
        params.append(f'%{search_query}%')

    # Sắp xếp theo thời gian mới nhất trước
    query += " ORDER BY time DESC"

    # Thực hiện truy vấn
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Định dạng dữ liệu kết quả thành danh sách các dictionary
    data = []
    for row in rows:
        data.append({
            'id': row[0],
            'temperature': row[1],
            'humidity': row[2],
            'light': row[3],
            'dust': row[4],
            'time': row[5]
        })

    # Đóng kết nối cơ sở dữ liệu
    conn.close()

    # Trả về dữ liệu dưới dạng JSON
    return jsonify(data)


# -------------------------MQTT---------------------------------------------
# Cấu hình MQTT
mqtt_broker = "192.168.0.100"  # Địa chỉ IP của máy nhận MQTT
mqtt_port = 1884
mqtt_topic = "home/sensor/data"
mqtt_topic_control = "home/device/control"  # Chủ đề điều khiển thiết bị
mqtt_topic_status = "home/device/status"  # Chủ đề cập nhật trạng thái thiết bị

mqtt_user = "quan"  # Username cho MQTT
mqtt_password = "b21dccn606"  # Password cho MQTT

# Hàm callback khi có tin nhắn từ MQTT


def on_message(client, userdata, message):
    print(f"on_message được gọi cho topic: {message.topic}")
    try:
        print(f"Received message: {message.payload.decode()}")

        if message.topic == mqtt_topic:
            payload = json.loads(message.payload.decode())
            temperature = payload.get('temperature')
            humidity = payload.get('humidity')
            light = payload.get('light')
            dust = payload.get('dust')

            # Chỉ thực hiện nếu có ít nhất một giá trị không phải là None
            if temperature is not None or humidity is not None or light is not None:
                conn = sqlite3.connect('G:/Coding/database/iot.db')
                cursor = conn.cursor()

                # Chèn dữ liệu vào một hàng với cả ba giá trị
                cursor.execute("""
                    INSERT INTO sensors (temperature, humidity, light, dust) 
                    VALUES (?, ?, ?, ?)
                """, (temperature, humidity, light, dust))

                conn.commit()
                print("Dữ liệu cảm biến đã được lưu vào cơ sở dữ liệu.")

                # # Xóa dòng mới nhất
                # cursor.execute("""
                #     DELETE FROM sensors 
                #     WHERE rowid = (SELECT MAX(rowid) FROM sensors)
                # """)
                conn.commit()

                conn.close()


        elif message.topic == mqtt_topic_status:
            payload = json.loads(message.payload.decode())
            device = payload.get('device')
            status = payload.get('status')

            conn = sqlite3.connect('G:/Coding/database/iot.db')
            cursor = conn.cursor()

            if device is not None and status is not None:
                cursor.execute(
                    "INSERT INTO devices (device_name, status) VALUES (?, ?)", (device, status))

            conn.commit()
            conn.close()

            print(f"Trạng thái thiết bị {
                  device} đã được cập nhật thành {status}")

    except Exception as e:
        print(f"Error while processing message: {e}")


# Khởi tạo MQTT client và cấu hình callback
mqtt_client = mqtt.Client(clean_session=True)
mqtt_client.on_message = on_message

# Thêm thông tin đăng nhập MQTT
mqtt_client.username_pw_set(mqtt_user, mqtt_password)


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Kết nối thành công đến MQTT broker")
        client.subscribe(mqtt_topic)
        client.subscribe(mqtt_topic_status)
    else:
        print(f"Kết nối thất bại với mã lỗi: {rc}")


mqtt_client.on_connect = on_connect

# ---------------------- Flask API cho điều khiển thiết bị ----------------------

@app.route('/api/control-device', methods=['POST'])
def control_device():
    try:
        data = request.get_json()
        device = data.get('device')
        status = data.get('status')

        if not device or not status:
            return jsonify({'success': False, 'message': 'Thiếu thông tin thiết bị hoặc trạng thái'})

        mqtt_payload = json.dumps({
            'device': device,
            'status': status
        })
        mqtt_client.publish(mqtt_topic_control, mqtt_payload)

        return jsonify({'success': True, 'message': f'{device} is now {status}'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Lỗi: {str(e)}'})


# Chạy Flask server
if __name__ == '__main__':
    mqtt_client.connect(mqtt_broker, mqtt_port)
    # mqtt_client.subscribe(mqtt_topic)
    # mqtt_client.subscribe(mqtt_topic_status)

    mqtt_client.loop_start()
    app.run(debug=True)
