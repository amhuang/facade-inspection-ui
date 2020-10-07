import time
import board
import busio
import adafruit_bmp280

# create library object using our Bus SPI port
i2c = busio.I2C(board.SCL, board.SDA)
bmp_280 = adafruit_bmp280.Adafruit_BMP280_I2C(i2c)

# change this to match the location's pressure (hPa) at sea level
bmp_280.sea_level_pressure = 1015.0

def altitude():
    return bmp_280.altitude

def pressure():
    return bmp_280.pressure

def temperature():
    celcius = bmp_280.temperature
    fahr = (celcius * (9/5)) + 32
    return fahr

def print_readings():
    celcius = bmp_280.temperature
    fahr = (celcius * (9/5)) + 32
    print("\nTemperature: %0.1f F" % fahr)
    print("Pressure: %0.1f hPa" % bmp_280.pressure)
    print("Altitude = %0.2f meters" % bmp_280.altitude)

print_readings()
