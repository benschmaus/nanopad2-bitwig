# nanopad2-bitwig
Bitwig controller script for [Korg nanoPAD2](http://www.korg.com/us/products/controllers/nanopad2/).

This script lets you use the nanoPAD2 to launch clips and scenes.
It supports 8 tracks and 8 scenes/clips per track.

Two modes are supported: clip mode and scene mode.  Clip mode is the default
mode.  Tap in the upper left or right corners of the X/Y pad to enable scene
mode or the lower left or right corners for clip mode.

In clip mode, the top row of the nanoPAD2 corresponds to track 1 in Bitwig.
Each pad in the row corresponds to a clip in Bitwig's clip launcher.

Use the scene button on the nanoPAD2 to control clips on track 1 and 2
(scene 1 on the nano), tracks 3 and 4 (scene 2), and so on.

In scene mode, the top row of scene 1 on the nanoPAD2 will start/stop all
clips in a scene but otherwise this mode functions the same as clip mode.

To install, copy the "Factotumo" folder to Bitwig's contoller scripts
directory.

On OS X this is *~/Documents/Bitwig Studio/Controller Scripts*.

More on installation at: [https://www.bitwig.com/en/community/control_scripts/installation_guide](https://www.bitwig.com/en/community/control_scripts/installation_guide)

Feedback welcome at benjamin.schmaus@gmail.com.
