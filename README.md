# Facade Inspection Robot UI

The following are the instructions for the operation of a facade inspection robot with this UI.

The Pis should all be running their necessary scripts on startup. Check to make sure that the device running the UI is connected to same network as the Pis ("Imaging Router"). Upon starting the scripts on each of the Pi's, the following data should be visible from `index.html`:

- 6 livestreams. Each of these can be viewed full screen, and brightness and contrast can be adjusted if necessary with the buttons each window's top right corner
- Angle of the beam (pitch) and the animation. This value should be zeroed while on the ground for maximum accuracy. The bar turns from yellow to green when the frame is at an angle that triggers automatic leveling.
- Altitude, temperature, and pressure. The sea level pressure at the time and location of operation (see local weather report) should be entered into the settings, accessible throught the icon in the top right corner. The altitude can then be zeroed on the 

**Controlling the hoists**

- The rectanglar button in the middle displays which mode of hoist operation the GUI is set at.
- **Leveling** displays two arrows which are responsive to the up and down key being held down, as well as being held down by the mouse. This mode operates both hoists at once to lift the entire frame, and has a build in leveling algorithm.
- **Individual** displays 4 arrows which are responsive to being held down by the mouse. This allows control of each individual hoist in both directions. The arrows on the left and right sides correspond to the left and right hoists when facing the wall.

**Settings**

- **Time from ground** displays how much longer the robot has to move to reach the ground. A notification pops up when the frame is 5 sec off the ground
- **Total operation time** displays how long the hoist has been in operation
- **Sea level pressure** should be set in inHg using information from local weather forecasts for maximum accurace of pressure, temperature, and altitude data.
- **Maximunm height** is an optional field for setting the max height the robot can reach before giving a warning.
- **Level in place** levels out the frame where it is with minimum vertical movement.
- **Disable leveling** allows toggling of the leveling algorithm.

**Troubleshooting**

If some parts of the UI aren't visible in the UI, check to make sure that the IP addresses in the settings are the correct addresses of the Pis. This might require an IP network scanner such as AngryIP. VNC Viewer also allows you to interface with the Raspberry Pis via a desktop GUI through which specific problems and their sources can be identified.
