#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

#define dhtpin 25
#define dhttype DHT11
DHT dht(dhtpin, dhttype);

#define LDR_PIN 32  // Chân ADC để đọc tín hiệu từ LDR

#define FAN_PIN 4     // LED đại diện cho quạt
#define AC_PIN 5      // LED đại diện cho điều hòa
#define LIGHT_PIN 2   // LED đại diện cho đèn
#define ALERT_PIN 13

bool alertState = false;
unsigned long previousMillis = 0;  // Lưu thời điểm lần nhấp nháy cuối
const long interval = 500; 

// Thông tin mạng WiFi
const char* ssid = "Hqii";
const char* password = "0123456789";

// MQTT Server
const char* mqtt_server = "172.20.10.2";  // Địa chỉ IP của máy nhận MQTT
const int mqtt_port = 1884;
const char* mqtt_user = "quan";           // Tên người dùng
const char* mqtt_password = "b21dccn606";  // Mật khẩu
const char* mqtt_sensor_topic = "home/sensor/data";  // Topic để gửi dữ liệu cảm biến
const char* mqtt_control_topic = "home/device/control";  // Topic để nhận lệnh điều khiển
const char* mqtt_status_topic = "home/device/status";  // Topic để gửi trạng thái thiết bị

WiFiClient espClient;
PubSubClient client(espClient);

// Hàm callback để xử lý lệnh MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  // Chuyển payload thành chuỗi
  char message[length + 1];
  strncpy(message, (char*)payload, length);
  message[length] = '\0';  // Kết thúc chuỗi

  Serial.print("Nhận được lệnh MQTT trên topic: ");
  Serial.println(topic);
  Serial.print("Nội dung lệnh: ");
  Serial.println(message);

  // Giải mã chuỗi JSON
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("Lỗi giải mã JSON: ");
    Serial.println(error.c_str());
    return;
  }

  // Lấy giá trị từ JSON
  const char* device = doc["device"];
  const char* status = doc["status"];

  if (String(device) == "all" && String(status) == "off") {
      digitalWrite(LIGHT_PIN, LOW); // Tắt đèn
      digitalWrite(FAN_PIN, LOW);   // Tắt quạt
      digitalWrite(AC_PIN, LOW);     // Tắt điều hòa

      // Gửi trạng thái thiết bị "all" đã tắt
      client.publish(mqtt_status_topic, "{\"device\": \"fan\", \"status\": \"off\"}");
      client.publish(mqtt_status_topic, "{\"device\": \"light\", \"status\": \"off\"}");
      client.publish(mqtt_status_topic, "{\"device\": \"ac\", \"status\": \"off\"}");
      return; // Thoát khỏi hàm sau khi tắt tất cả
  }

  if (String(device) == "all" && String(status) == "on") {
      digitalWrite(LIGHT_PIN, HIGH); // Tắt đèn
      digitalWrite(FAN_PIN, HIGH);   // Tắt quạt
      digitalWrite(AC_PIN, HIGH);     // Tắt điều hòa

      // Gửi trạng thái thiết bị "all" đã tắt
      client.publish(mqtt_status_topic, "{\"device\": \"fan\", \"status\": \"on\"}");
      client.publish(mqtt_status_topic, "{\"device\": \"light\", \"status\": \"on\"}");
      client.publish(mqtt_status_topic, "{\"device\": \"ac\", \"status\": \"on\"}");
      return; // Thoát khỏi hàm sau khi tắt tất cả
  }


// Kiểm tra thiết bị và trạng thái để điều khiển tương ứng
if (String(device) == "fan") {
    if (String(status) == "on") {
      digitalWrite(FAN_PIN, HIGH); // Bật quạt
      client.publish(mqtt_status_topic, "{\"device\": \"fan\", \"status\": \"on\"}"); // Chỉ gửi lệnh nếu có sự thay đổi
    } else if (String(status) == "off") {
      digitalWrite(FAN_PIN, LOW);  // Tắt quạt
      client.publish(mqtt_status_topic, "{\"device\": \"fan\", \"status\": \"off\"}");
    }
} else if (String(device) == "ac") {
    if (String(status) == "on") {
      digitalWrite(AC_PIN, HIGH);  // Bật máy lạnh
      client.publish(mqtt_status_topic, "{\"device\": \"ac\", \"status\": \"on\"}");
    } else if (String(status) == "off") {
      digitalWrite(AC_PIN, LOW);   // Tắt máy lạnh
      client.publish(mqtt_status_topic, "{\"device\": \"ac\", \"status\": \"off\"}");
    }
} else if (String(device) == "light") {
    if (String(status) == "on") {
      digitalWrite(LIGHT_PIN, HIGH); // Bật đèn
      client.publish(mqtt_status_topic, "{\"device\": \"light\", \"status\": \"on\"}");
    } else if (String(status) == "off") {
      digitalWrite(LIGHT_PIN, LOW);  // Tắt đèn
      client.publish(mqtt_status_topic, "{\"device\": \"light\", \"status\": \"off\"}");
    }
} else if (String(device) == "alert") {
    if (String(status) == "on") {
      alertState = true;  // Bắt đầu nhấp nháy
      client.publish(mqtt_status_topic, "{\"device\": \"alert\", \"status\": \"on\"}");
    } else if (String(status) == "off") {
      alertState = false;  // Dừng nhấp nháy
      digitalWrite(ALERT_PIN, LOW);  // Tắt đèn ngay lập tức
      client.publish(mqtt_status_topic, "{\"device\": \"alert\", \"status\": \"off\"}");
    }
  }
}


void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Cài đặt chân output cho các thiết bị
  pinMode(FAN_PIN, OUTPUT);
  pinMode(AC_PIN, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(ALERT_PIN, OUTPUT);
  
  // Kết nối WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Đang kết nối đến WiFi...");
  } 
  Serial.println("Đã kết nối WiFi");
  
  // Kết nối đến MQTT Broker với xác thực
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);  // Gán hàm callback
  while (!client.connected()) {
    Serial.println("Đang kết nối đến MQTT Broker...");
    if (client.connect("ESP32Client", mqtt_user, mqtt_password)) {
      Serial.println("Đã kết nối đến MQTT");
      client.subscribe(mqtt_control_topic);  // Đăng ký nhận lệnh điều khiển
    } else {
      delay(2000);
    }
  }
}

void loop() {
  client.loop();  // Lắng nghe lệnh từ MQTT

  unsigned long currentMillis = millis();
  

  // Đọc dữ liệu cảm biến DHT11 và LDR
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int sensorValue = analogRead(LDR_PIN);  
  float voltage = sensorValue * (3.3 / 4095.0);  // Chuyển đổi giá trị ADC sang điện áp (0 - 3.3V)
  float lux = (2500 / voltage - 500) / 3.3;  // Công thức chuyển đổi gần đúng từ điện áp sang lux
  if (lux > 200000) {
    lux = 200000;
  }
  float light = lux;

// Tạo giá trị ngẫu nhiên cho dust (0-100)
  int dust = random(0, 101);  // Hàm random() tạo số trong khoảng [0, 100]

  // Chuẩn bị dữ liệu dưới dạng JSON
  String jsonData = "{\"temperature\": " + String(temperature) + 
                    ", \"humidity\": " + String(humidity) + 
                    ", \"light\": " + String(light) + 
                    ", \"dust\": " + String(dust) + "}";

  // Gửi dữ liệu cảm biến qua MQTT
  client.publish(mqtt_sensor_topic, jsonData.c_str());

  Serial.print("Độ ẩm: ");
  Serial.print(humidity);
  Serial.print("%, Nhiệt độ: ");
  Serial.print(temperature);
  Serial.print("°C, Ánh sáng: ");
  Serial.print(light);
  Serial.print(" lux, Bụi: ");
  Serial.print(dust);
  Serial.println(" pm");

  for(int i = 0 ; i < 50 ; i ++){
    delay(100);
    if (alertState && currentMillis - previousMillis >= interval) {
      previousMillis = currentMillis;  // Cập nhật thời gian
      int state = digitalRead(ALERT_PIN);  // Đọc trạng thái hiện tại
      digitalWrite(ALERT_PIN, !state);  // Đổi trạng thái (bật/tắt)
    }
    client.loop();
  }
}
