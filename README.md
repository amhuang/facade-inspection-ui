# Facade Inspection UI

This includes the instructions for the operation of the facade inspection robots.

Upon starting the scripts on each of the Pi's, the following data should be visible from `index.html`:

- 6 livestreams. Each of these can be viewed full screen, and brightness and contrast can be adjusted if necessary with the buttons each window's top right corner
- Angle of the beam (pitch) and the animation
- Altitude, temperature, and pressure (altitude is taken from sea level and may need to be zeroed with the button in the top right corner)

**Controlling the hoists**

- The rectanglar button in the middle displays which mode of hoist operation the GUI is set at.
- **"Leveling"** displays two arrows which are responsive to the up and down key being held down, as well as being held down by the mouse. This mode operates both hoists at once to lift the entire frame, and has a build in leveling algorithm.
- **"Individual"** displays 4 arrows which are responsive to being held down by the mouse. This allows control of each individual hoist in both directions. The arrows on the left and right sides correspond to the left and right hoists when facing the wall.
