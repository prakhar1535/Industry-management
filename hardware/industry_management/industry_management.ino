#include <Wire.h>
#include <Adafruit_MAX31855.h>

#define MQ3_ANALOG_PIN A0
#define MQ3_DIGITAL_PIN 2

const int lm35_pin = A1;  /* LM35 O/P pin */

void setup() {
  Serial.begin(9600);
  pinMode(MQ3_DIGITAL_PIN, INPUT);
  pinMode(11, OUTPUT);
}

void blinkLED() {
  // Blink LED
  digitalWrite(11, HIGH);
  delay(100); // Wait for 100 milliseconds
  digitalWrite(11, LOW);
  delay(100); // Wait for 100 milliseconds
}

float lastTempVal = 0;  // To store the last temperature value
unsigned long changeStartTime = 0;  // Start time of temperature change
bool changeStarted = false;  // Flag to indicate if a significant change has started
float simulatedTempVal = 0;  // To simulate increasing temperature value

void loop() {
  int temp_adc_val;
  float temp_val;
  temp_adc_val = analogRead(lm35_pin);  /* Read Temperature */
  temp_val = (temp_adc_val * 4.88); /* Convert adc value to equivalent voltage */
  temp_val = (temp_val / 10);

  // Check if the temperature has changed significantly
  if (abs(temp_val - lastTempVal) > 6) {
    if (!changeStarted) {
      // Start the timer and set initial simulated value if a significant change is detected
      changeStarted = true;
      changeStartTime = millis();
      simulatedTempVal = temp_val;
      Serial.println("Significant temperature change detected, starting 10-second increase.");
    } 
  }

  // Simulate increasing temperature over 10 seconds
  if (changeStarted) {
    unsigned long elapsedTime = millis() - changeStartTime;
    if (elapsedTime < 10000) {
      // Increase the simulated value gradually over 10 seconds
      simulatedTempVal += 0.1; // Adjust the increment rate as needed
      Serial.print("Simulated Temperature: ");
      Serial.print(simulatedTempVal);
      Serial.println(" °C");
    } else {
      changeStarted = false;  // Reset after 10 seconds
      Serial.println("10-second simulation complete.");
    }
  } else {
    // Display actual temperature when not simulating
    Serial.print("Current Temperature: ");
    Serial.print(temp_val);
    Serial.println(" °C");
  }

  lastTempVal = temp_val;  // Update the last temperature value

  // Ammonia sensor readings
  int ammoniaLevel = analogRead(MQ3_ANALOG_PIN);
  bool presenceOfAmmonia = digitalRead(MQ3_DIGITAL_PIN);

  if (ammoniaLevel > 50) {
    Serial.print("Critical Ammonia Level Exceeded!!!!");
    Serial.print("Ammonia Level (Analog): ");
    Serial.println(ammoniaLevel);

    Serial.print("Presence of Ammonia (Digital): ");
    Serial.println(presenceOfAmmonia);
    blinkLED();
  } else {
    Serial.print("Ammonia Level (Analog): ");
    Serial.println(ammoniaLevel);

    Serial.print("Presence of Ammonia (Digital): ");
    Serial.println(presenceOfAmmonia);
  }

  delay(1000);
}
