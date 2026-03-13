Michael Legere
Final Project
COS 452, Computer Graphics
University of Southern Maine
10/14/2016

This project is a simple room scene with a table, controllable robot with arm, 
and some interesting lighting effects. Also, there's a sphere mirror on the table
that animates on command in a circle.

Object collision (not including detection of walls in the scene) 
was not achieved successfully so as to allow the robot to manipulate objects in 
the 3d scene, but a basic framework exists for it to be done.

There is realistic limiting of the robot's arm motion in the forearm's grabbers, but 
otherwise, the arms can rotate unrealistically. It would seem for realistic 
rotation of the robots arm, I'd need more study in inverse kinematics, something 
which could've been done with less time contsraints.

TO BEGIN: 
Note the controls displayed in the GUI; press "e" to engage the robot arm for use. 
Movement keys are w, s, and the arrow keys.

EXTRA:
Also included is a sphere with a procedurally generated texture using 
perlin/simplex noise. See code comments for more details (specifically,
do a CTRL-F on "perlin" and uncomment the related code in the animation function 
and elsewhere).

Spotlights (R,G, and B) will follow the robot when the mirror sphere is 
animating, otherwise they will move to random locations on the floor at
intervals you can specify in the code.
