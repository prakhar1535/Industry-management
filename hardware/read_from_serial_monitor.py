import serial.tools.list_ports
import rospy
from std_msgs.msg import Float32, String

# List available serial ports
ports = serial.tools.list_ports.comports()
serialInst = serial.Serial()

# ROS node and publishers
rospy.init_node('sensor_data_publisher', anonymous=True)
temp_pub = rospy.Publisher('/temp', Float32, queue_size=10)
ammonia_pub = rospy.Publisher('/ammonia', Float32, queue_size=10)
ammonia_alert_pub = rospy.Publisher('/ammonia_alert', String, queue_size=10)

# Detect available ports and select the desired one
portsList = [str(port) for port in ports]
print("Available ports: ", portsList)

portVar = "/dev/ttyUSB0"  # Adjust if your port is different
serialInst.baudrate = 9600
serialInst.port = portVar
serialInst.open()

rate = rospy.Rate(1)  # 1 Hz loop

while not rospy.is_shutdown():
    if serialInst.in_waiting:
        try:
            packet = serialInst.readline().decode('utf-8').strip()
            print("Received data: ", packet)

            if "Current Temperature" in packet:
                temp_val = float(packet.split(": ")[1].split(" ")[0])  # Extract temperature value
                print(f"Publishing temperature: {temp_val}")
                temp_pub.publish(temp_val)

            elif "Simulated Temperature" in packet:
                temp_val = float(packet.split(": ")[1].split(" ")[0])  # Extract simulated temperature value
                print(f"Publishing simulated temperature: {temp_val}")
                temp_pub.publish(temp_val)

            elif "Ammonia Level (Analog)" in packet:
                ammonia_val = float(packet.split(": ")[1])  # Extract ammonia level
                print(f"Publishing ammonia level: {ammonia_val}")
                ammonia_pub.publish(ammonia_val)

            elif "Critical Ammonia Level" in packet:
                print("Critical Ammonia Alert!")
                ammonia_alert_pub.publish("Critical Ammonia Level Detected")
                # You can add additional actions here based on the alert

        except Exception as e:
            rospy.logerr(f"Error processing serial data: {e}")

    rate.sleep()

