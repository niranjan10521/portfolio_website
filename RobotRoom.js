////////////////////////////////////////////////
/// Written by Michael Legere                ///
/// 10-10-2016                               ///
/// University of Southern Maine             ///
/// Computer Graphics [COS 452]              ///
////////////////////////////////////////////////
/*
						[GLOBAL VARIABLES]:
*/
// Set up the scene, camera, and renderer as global variables.
var scene, camera, renderer;

var camHeight = 20;//camera's height in the scene
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight;
//Axis constants for rotation and translations of mesh objects, camera
var yAxis = new THREE.Vector3(0,1,0);
var xAxis = new THREE.Vector3(1,0,0);
var zAxis = new THREE.Vector3(0,0,1);

var camDeltaRotate = .07; //Rate at which camera/robot rotates
var camDeltaWalk = 1.5; //Rate at which robot translates forward

var tableMeshGroup; //The mesh group representing the room's table object

var perlinSphere; //The mesh that represents the ball in the room

var ambientLight; //Ambient lighting
var ambientIntensity = 1.5;
var dirLight; //Directional lighting (added to scene for shading and depth perception)
var dirLightIntensity = 1;

//Boolean values that toggle spotlight animation
var animateSpotLightR = false;
var animateSpotLightB = false;
var animateSpotLightG = false;
//Spotlight meshes
var spotLightR;
var spotLightB;
var spotLightG;
//Interval at which spotlight relocates to a random location on the floor
var rLightInterval = 50;
var bLightInterval = 50;
var gLightInterval = 50;
//Timers for random point spotlight animation
var rLightTimer = 0;
var bLightTimer = 0;
var gLightTimer = 0;

var start = Date.now();//for animation

var unfoldCountdown = 100;
var unfoldRequested = false;
var foldRequested = false;
var busyDoingSomething = false;//To be potentially used for more complex behavior
//Is robot folded (disengaged)?
var isFolded = true;
var moveBall = false;
var grabbersClosed = false;
//var ballGrabbed = false;

var mirrorBallCamera;
//Robot and animation variables for robot
var robot = new THREE.Object3D();
var base, 
	baseArm,
	foreArm, 
	middleArm,
	grabber, 
	grabber2;

init();//init the scene
animate();//animate the scene

// Sets up the scene.
function init() {
 
	// Create the scene and set the scene size.
	scene = new THREE.Scene();
	
	//set up renderer
	renderer = new THREE.WebGLRenderer({antialias:true});
	renderer.setSize(WIDTH, HEIGHT);
	renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
	renderer.shadowCameraNear = 3;
	
	//add 3d objects, populate scene
	createRoomFloor();
	createWalls();
	createBall();
	//createPerlinSphere();//Add a sphere with a dynamic texture to the scene
	createTable(50,.5,-100);
	addSpotLights();
	//Assemble robot body
	createRobot();
	//Robot camera
	initCamera();
	camera.translateZ(17);
	camera.translateX(-10);
	
	//Build the robot object
	robot.add(base);
	robot.add(camera);
	//position robot in the world
	robot.rotateY(-45*Math.PI/180);
	robot.position.x = 30;
	robot.position.y = 1.5;
	robot.position.z = -30;
	//add complete robot to the scene
	scene.add(robot);
	
    renderer.shadowCameraFar = camera.far;
    renderer.shadowCameraFov = 50;
    renderer.shadowMapBias = 0.0039;
    renderer.shadowMapDarkness = 0.5;
    renderer.shadowMapWidth = 1024;
    renderer.shadowMapHeight = 1024;

	document.body.appendChild(renderer.domElement);
	
	addSceneLighting();
	
	// Create an event listener that resizes the renderer with the browser window.
    window.addEventListener('resize', function() {
		var WIDTH = window.innerWidth,
			HEIGHT = window.innerHeight;
		renderer.setSize(WIDTH, HEIGHT);
		camera.aspect = WIDTH / HEIGHT;
		//camera.updateProjectionMatrix();
	});
	
    renderer.setClearColor(0x333F47, 1);// Set the background color of the scene.

	handleKeyEvents();//Handle keyboard input
}
//-------------------------------------------------------------------------//
function addSceneLighting(){
	//Add ambient lighting
	ambientLight = new THREE.AmbientLight(0x606060);
	ambientLight.intensity = ambientIntensity;
	scene.add(ambientLight);
	//Add a directional light for depth and shading
	dirLight = new THREE.DirectionalLight(0x606060);
	dirLight.intensity = ambientIntensity;
	dirLight.translateX(300);
	dirLight.translateY(300);
	scene.add(dirLight);
}
//-------------------------------------------------------------------------//
//Handle keyboard input from user
function handleKeyEvents(){
	window.onkeydown = function(event){
		var curDir = camera.getWorldDirection();
		if (isFolded == true){
			switch(event.keyCode){
				case 69://e: Unfold robot arm when beginning
					unfoldRequested = !unfoldRequested;
					busyDoingSomething = !busyDoingSomething;
				break;
				case 38: //up: look up
					if(curDir.y < 0.9){
						camera.rotateOnAxis(xAxis, camDeltaRotate);
					}
				break;
				case 40: //down: look down
					if(curDir.y > -0.9){
						camera.rotateOnAxis(xAxis, -camDeltaRotate);
					}
				break;
				case 39: //right arrow: Turn robot right
					rotateAroundWorldAxis(robot, yAxis, -camDeltaRotate);
				break;
				case 37: //left arrow: Turn robot left
					rotateAroundWorldAxis(robot, yAxis, camDeltaRotate);
				break;
				case 87: //w: Move forward
					robot.translateZ(-camDeltaWalk);
				break;
				case 83: //s: Move backward
					robot.translateZ(camDeltaWalk);
				break;
			}
		}else{
			switch(event.keyCode)
			{
				case 39: //right arrow: Turn robot right
					rotateAroundWorldAxis(robot, yAxis, -camDeltaRotate);
				break;
				case 37: //left arrow: Turn robot left
					rotateAroundWorldAxis(robot, yAxis, camDeltaRotate);
				break;
				case 87: //w: Move forward
					robot.translateZ(-camDeltaWalk);
				break;
				case 83: //s: Move backward
					robot.translateZ(camDeltaWalk);
				break;
				case 38: //up: Look up
					if(curDir.y < 0.9){
						camera.rotateOnAxis(xAxis, camDeltaRotate);
					}
				break;
				case 40: //down: Look down
					if(curDir.y > -0.9){
						camera.rotateOnAxis(xAxis, -camDeltaRotate);
					}
				break;
			    case 49: //1: Turn on red spotlight
					animateSpotLightR = !animateSpotLightR;		
				break;
				case 50: //2: Turn on blue spotlight
					animateSpotLightB = !animateSpotLightB;
				break;
				case 51: //3: Turn on green spotlight
					animateSpotLightG = !animateSpotLightG;
				break;
				case 52:
					moveBall = !moveBall;
				break;
				case 76://l
					if(ambientLight.intensity == .2){
						ambientLight.intensity = ambientIntensity;
						dirLight.intensity = dirLightIntensity;
					}else{
						ambientLight.intensity = .2;
						dirLight.intensity = .2;
					}
				break;
				case 82: //r: Rotate foreArm up
					foreArm.rotateZ(-.01);
				break;
				case 70://f: Rotate foreArm down
					foreArm.rotateZ(.01);
				break;
				case 84: //t: Rotate middleArm up
					middleArm.rotateZ(-.01);
				break;
				case 71://g: Rotate middleArm down
					middleArm.rotateZ(.01);
				break;
				case 89: //y: Rotate baseArm up
					baseArm.rotateZ(-.01);
				break;
				case 72://h: Rotate baseArm down
					baseArm.rotateZ(.01);
				break;
				case 85: //u: Open grabbers
					if(grabber.rotation.x < 1.5){//limit grabber range of motion
						grabber.rotateX(.03);
						grabber2.rotateX(-.03);
					}
				break;
				case 74: //j: Close grabbers
					if(grabber.rotation.x > -.01){//limit grabber range of motion
						grabbersClosed = false;
						grabber.rotateX(-.03);
						grabber2.rotateX(.03);
					}else if(grabber.rotation.x < .1){
						grabbersClosed = true;
						//ballGrabbed = true;
					}
				break;
				
				/*
				//This code is for rotating the base arm itself around the Y-axis
				case 53: //5
					rotateAroundWorldAxis(baseArm, yAxis, .05);
				break;
				case 54: //6
					rotateAroundWorldAxis(baseArm, yAxis, -.05);
				break;
				*/
				
			}
		}
		//Keep robot from going past walls, mostly
		if(robot.position.x >155){
			robot.position.x = 155;
		}
		if(robot.position.x < 5){
			robot.position.x = 5;
		}
		if(robot.position.z < -155){
			robot.position.z = -155;
		}
		if(robot.position.z > -5){
			robot.position.z = -5;
		}
    };
}
//-------------------------------------------------------------------------//[ROBOT BUILDING FUNCTIONS]
function createRobot(){
	//Set up base
	base = new THREE.Object3D();
	var robotBaseMaterial = new THREE.MeshPhongMaterial({color:0xFF9933,specular:0xFF9933,shininess:20});
	base.add(new THREE.Mesh(new THREE.CubeGeometry(12,.5,8),robotBaseMaterial));
	base.translateY(1.5);//raise the base up so that the wheels can 'hold' it
	
	//Add the four wheels for the robot
	var robotWheelMaterial = new THREE.MeshPhongMaterial({color:0x000000,specular:0xffffff,shininess:1});
	var wheel = new THREE.Mesh(new THREE.CylinderGeometry(2,2,.3,32),robotWheelMaterial);
	wheel.rotateX(90*Math.PI/180);
	wheel.translateY(4.15);
	wheel.translateX(4);
	wheel.castShadow = true;
	base.add(wheel);
	wheel = new THREE.Mesh(new THREE.CylinderGeometry(2,2,.3,32),robotWheelMaterial);
	wheel.rotateX(90*Math.PI/180);
	wheel.translateY(-4.15);
	wheel.translateX(4);
	wheel.castShadow = true;
	base.add(wheel);
	wheel = new THREE.Mesh(new THREE.CylinderGeometry(2,2,.3,32),robotWheelMaterial);
	wheel.rotateX(90*Math.PI/180);
	wheel.translateY(-4.15);
	wheel.translateX(-4);
	wheel.castShadow = true;
	base.add(wheel);
	wheel = new THREE.Mesh(new THREE.CylinderGeometry(2,2,.3,32),robotWheelMaterial);
	wheel.rotateX(90*Math.PI/180);
	wheel.translateY(4.15);
	wheel.translateX(-4);
	wheel.castShadow = true;
	base.add(wheel);
	
	base.rotateY(-90 * Math.PI/180);
	
	grabber = new THREE.Object3D();
	grabber.name = "grabber";
	var grabberLength = 9;
	var grabberSpacing = 10;
	var grabberMaterial = new THREE.MeshPhongMaterial({color:0xFF9933,specular:0xFF9933,shininess:100});
	createRobotGrabber(grabber, grabberLength, grabberSpacing, grabberMaterial);
	
	grabber2 = new THREE.Object3D();
	grabber2.name = "grabber2";
	createRobotGrabber(grabber2, grabberLength, -grabberSpacing, grabberMaterial);
	
	foreArm = new THREE.Object3D();
	foreArm.name = "foreArm"
	var foreArmLength = 13;
	var robotForearmMaterial = new THREE.MeshPhongMaterial({color:0xFF9933,specular:0xFF9933,shininess:100});
	createRobotForeArm(foreArm,foreArmLength,robotForearmMaterial);
	
	middleArm = new THREE.Object3D();
	var middleArmLength = 11;
	var robotMiddleArmMaterial = new THREE.MeshPhongMaterial({color:0x006699,specular:0x006699,shininess:100});
	createRobotMiddleArm(middleArm,middleArmLength,robotMiddleArmMaterial);
	
	baseArm = new THREE.Object3D();
	var baseArmLength=15;
	var robotBaseArmMaterial = new THREE.MeshPhongMaterial({color:0x006699,specular:0x006699,shininess:100});
	createRobotBaseArm(baseArm,baseArmLength,robotBaseArmMaterial);
	
	grabber.position.y = foreArmLength;
	grabber2.position.y = foreArmLength;
	foreArm.position.y = middleArmLength;
	middleArm.position.y = baseArmLength;
	
	base.add(baseArm);
	baseArm.add(middleArm);
	middleArm.add(foreArm);
	foreArm.add(grabber);
	foreArm.add(grabber2);
	
	//Position arm to be folded up as so...
	middleArm.rotateZ(160*Math.PI/180);
	foreArm.rotateZ(-160*Math.PI/180);
	
	//Offset basearm backwards a little
	baseArm.translateX(2);
	
	var phi = -180*Math.PI/180;
	grabber2.rotateOnAxis(xAxis,phi);
	grabber2.position.z += grabber2.userData.zDisplacement;
	grabber.rotateOnAxis(xAxis,-phi);
	grabber.position.z += grabber.userData.zDisplacement;	
	
	scene.add(base);
	
}
function createRobotGrabber(part, length, gap, material){
	//grabbers
	var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,length,32),material);
	var displacement = gap/2;
	
	if(gap < 0){
		part.userData = {zDisplacement : displacement + .5};
	}else{
		part.userData = {zDisplacement : displacement - .5};
	}
	cylinder.castShadow = true;
	cylinder.position.y = length/2;
	part.add(cylinder);
	
}
function createRobotForeArm(part, length, material)
{
	//sphere joint adornment
	var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,.5,32),material);
	cylinder.castShadow = true;
	part.add(cylinder);

	var box = new THREE.Mesh(new THREE.CubeGeometry(1,length,1),material);
	box.position.y = length/2;
	box.castShadow = true;
	part.add(box);
	
	cylinder = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,10,32),material);
	cylinder.rotation.x = 90*Math.PI/180;
	cylinder.position.y = length;
	cylinder.castShadow = true;
	part.add(cylinder);
	
}
function createRobotMiddleArm(part, length, material){
	//sphere joint 
	var robotJointMaterial = new THREE.MeshPhongMaterial({color:0xFF9933,specular:0xFF9933,shininess:20});
	var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,.5,32),robotJointMaterial);
	cylinder.castShadow = true;
	part.add(cylinder);
	createRobotBaseArm(part, length,  material);
}
function createRobotBaseArm(part, length,  material){
	
	var box = new THREE.Mesh(new THREE.CubeGeometry(1,length,1),material);
	box.position.y=length/2;
	box.castShadow = true;
	part.add(box);
	
	var sphere = new THREE.Mesh(new THREE.SphereGeometry(1.5,32,16),material);
	sphere.position.y=length;
	sphere.castShadow = true;
	part.add(sphere);
}
//------------------------------------------------------------------------------[BALL]
function createBall(){
	mirrorBallCamera = new THREE.CubeCamera( 0.1, 5000, 512 );
	mirrorBallCamera.position.set(50,16+4,-87);
	// mirrorCubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
	scene.add( mirrorBallCamera );
	var mirrorBallMaterial = new THREE.MeshBasicMaterial( { envMap: mirrorBallCamera.renderTarget, specular:0xFF9933,shininess:50} );
	ball = new THREE.Mesh( new THREE.SphereGeometry(4, 20, 20), mirrorBallMaterial );
	ball.position.set(50,16+4,-87);
	ball.castShadow = true;
	mirrorBallCamera.position = ball.position;
	scene.add(ball);
}
//-------------------------------------------------------------------------//[PERLIN SPHERE]
/*//Is a cool texture example of a sphere with perlin noise that animates
//Create the perlin noise sphere mesh for the scene
function createPerlinSphere(){
	var loader = new THREE.TextureLoader();
	
	var sphereMaterial =new THREE.ShaderMaterial( {
		uniforms: { 
			tSurface: { 
				type: "t", 
				value: loader.load( './sphereTex.png' )
			},
			time: { // float initialized to 0
				type: "f", 
				value: 0.0 
			}
		},
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent
	} );
	//var sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );
	
	perlinSphere = new THREE.Mesh(
	new THREE.SphereGeometry(4, 20, 20), sphereMaterial);
	perlinSphere.castShadow = true;
	perlinSphere.position.x = 140;
	perlinSphere.position.y = 30;
	perlinSphere.position.z = -50;
	perlinSphere.rotateOnAxis(yAxis, 180);
	scene.add(perlinSphere);
}
*/
//-------------------------------------------------------------------------//[SPOTLIGHTS]
//Add the three spotlights to the scene
function addSpotLights(){
	spotLightR = new THREE.SpotLight( 0xff3030 , 0, 200, Math.PI/8, .5, 2);
	spotLightR.position.set( 20, 40, -140 );
	spotLightR.castShadow = true;
	spotLightR.shadow.mapSize.width = 1024;
	spotLightR.shadow.mapSize.height = 1024;
	scene.add(spotLightR.target);
	scene.add( spotLightR );
	
	spotLightB = new THREE.SpotLight( 0x0021ff , 0, 200, Math.PI/8, .5, 2);
	spotLightB.position.set( 100, 40, 0 );
	spotLightB.castShadow = true;
	spotLightB.shadow.mapSize.width = 1024;
	spotLightB.shadow.mapSize.height = 1024;
	scene.add(spotLightB.target);
	scene.add( spotLightB );
	
	spotLightG = new THREE.SpotLight( 0x7cfc01 , 0, 200, Math.PI/8, .5, 2);
	spotLightG.position.set( 100, 40, -140 );
	spotLightG.castShadow = true;
	spotLightG.shadow.mapSize.width = 1024;
	spotLightG.shadow.mapSize.height = 1024;
	scene.add(spotLightG.target);
	scene.add( spotLightG );
}
//Handle various behavior of the spotlights
function spotLightAnimation(randomMove){
	//lights will move to random locations on the floor when sphere isnt moving
	if(randomMove){//This is if the sphere's movement has been turned off
		var rollz;
		var rollx;
		if(animateSpotLightR){
			if(rLightTimer <= 0){
				rollx = Math.round(Math.random()*160) + 1; 
				rollz = -(Math.round(Math.random()*160) + 1); 
				spotLightR.target.position.set(rollx, 0, rollz);
				spotLightR.intensity = 10;
				rLightTimer=rLightInterval;
			}else{
				rLightTimer--;
			}
		}else{
			spotLightR.intensity = 0;
		}
		if(animateSpotLightB){
			if(bLightTimer <= 0){
				rollx = Math.round(Math.random()*160) + 1; 
				rollz = -(Math.round(Math.random()*160) + 1); 
				spotLightB.target.position.set(rollx, 0, rollz);
				spotLightB.intensity = 10;
				bLightTimer=bLightInterval;
			}else{
				bLightTimer--;
			}
		}else{
			spotLightB.intensity = 0;
		}
		if(animateSpotLightG){
			if(gLightTimer <= 0){
				rollx = Math.round(Math.random()*160) + 1; 
				rollz = -(Math.round(Math.random()*160) + 1); 
				spotLightG.target.position.set(rollx, 0, rollz);
				spotLightG.intensity = 10;
				gLightTimer=gLightInterval;
			}else{
				gLightTimer--;
			}
		}else{
			spotLightG.intensity = 0;
		}
	}else{
		if(animateSpotLightR){
			spotLightR.target.position.set(robot.position.x, robot.position.y, robot.position.z);
			spotLightR.intensity = 12;
		}else{
			spotLightR.intensity = 0;
		}
		if(animateSpotLightB){
			spotLightB.target.position.set(robot.position.x, robot.position.y, robot.position.z);
			spotLightB.intensity = 12;
		}else{
			spotLightB.intensity = 0;
		}
		if(animateSpotLightG){
			spotLightG.target.position.set(robot.position.x, robot.position.y, robot.position.z);
			spotLightG.intensity = 12;
		}else{
			spotLightG.intensity = 0;
		}
	}
}
//-------------------------------------------------------------------------//[TABLE MESH]
function createTable(x,y,z){
	var tableMaterial = new THREE.MeshLambertMaterial( { color: 0xf08080 } );
	var cylinder = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,15, 50), tableMaterial);
	tableMeshGroup = new THREE.Group();
	cylinder.position.x = x;
	cylinder.position.y = y + 15/2;
	cylinder.position.z = z;
	cylinder.castShadow = true;
	tableMeshGroup.add(cylinder);
	cylinder = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,15, 50), tableMaterial);
	cylinder.position.x = x;
	cylinder.position.y = y + 15/2;
	cylinder.position.z = z + 30;
	cylinder.castShadow = true;
	tableMeshGroup.add(cylinder);
	cylinder = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,15, 50), tableMaterial);
	cylinder.position.x = x + 30;
	cylinder.position.y = y + 15/2;
	cylinder.position.z = z + 30;
	cylinder.castShadow = true;
	tableMeshGroup.add(cylinder);

	cylinder = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,15, 50), tableMaterial);
	cylinder.position.x = x + 30;
	cylinder.position.y = y + 15/2;
	cylinder.position.z = z;
	cylinder.castShadow = true;
	tableMeshGroup.add(cylinder);
	
	var tableTop = new THREE.Mesh(new THREE.BoxGeometry( 32, 1, 32), tableMaterial);
	tableTop.position.x = x + 15; 
	tableTop.position.y = y + 15;
	tableTop.position.z = z + 15;
	tableTop.castShadow = true;
	tableMeshGroup.add(tableTop);
	scene.add(tableMeshGroup);
}
//-------------------------------------------------------------------------//[CAMERA]
function initCamera(){
		// Create a camera, zoom it out from the model a bit, and add it to the scene.
		camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 20000);
		camera.position.y = camHeight;
}
//-------------------------------------------------------------------------//[ROOM GEOMETRY]
//Create the walls for the room
function createWalls(){
	var wallHeight = 60;
	var wallMaterialBlue = new THREE.MeshPhongMaterial( { color: 0x1e90ff } );
	var wallMaterialYellow = new THREE.MeshPhongMaterial( { color: 0xffd700 } );
	var wall = new THREE.Mesh(new THREE.BoxGeometry( 1, wallHeight, 160 ), wallMaterialBlue );
	wall.position.x = 0;
	wall.position.y = wallHeight/2;
	wall.position.z = -160/2 ;
	wall.receiveShadow = true;
	scene.add(wall);
	var wall2= new THREE.Mesh(new THREE.BoxGeometry( 1, wallHeight, 160 ), wallMaterialYellow );
	wall2.position.x = 160/2 ; 
	wall2.position.y = wallHeight/2;
	wall2.position.z = 0;
	wall2.rotation.y = Math.PI/2;
	wall2.receiveShadow = true;
	scene.add(wall2);
	var wall3= new THREE.Mesh(new THREE.BoxGeometry( 1, wallHeight, 160 ), wallMaterialBlue );
	wall3.position.x = 160 ; 
	wall3.position.y = wallHeight/2;
	wall3.position.z = -160/2;
	wall3.receiveShadow = true;
	scene.add(wall3);
	var wall4= new THREE.Mesh(new THREE.BoxGeometry( 1, wallHeight, 160 ), wallMaterialYellow );
	wall4.position.x = 160/2 ; 
	wall4.position.y = wallHeight/2;
	wall4.position.z = -160;
	wall4.rotation.y = Math.PI/2;
	wall4.receiveShadow = true;
	scene.add(wall4);
}
//creates an 8x8 tile floor with square tiles of length 20, height 1
function createRoomFloor(){
	var lightCubeMaterial = new THREE.MeshPhongMaterial( { color: 0xccd3e1 } );
	lightCubeMaterial.reflectivity = 2;
	var darkCubeMaterial = new THREE.MeshPhongMaterial( { color: 0x838b8b } );
	// base
	var zDist = -10;
	var xDist = 10;
	var cube;
	for(var i = 0; i < 64 ; i++){
		if(i > 0 && i % 8 == 0){
			zDist -= 20;
			xDist = 10;
			//switch tile pattern for checkering
			var temp = lightCubeMaterial;
			lightCubeMaterial = darkCubeMaterial;
			darkCubeMaterial = temp;
		}
		if(i %2 == 0){
			cube = new THREE.Mesh(new THREE.CubeGeometry( 20, 1, 20 ), lightCubeMaterial );
			cube.position.x = xDist;
			cube.position.z = zDist;
			cube.position.y = 0.5;
			cube.receiveShadow = true;
			scene.add( cube );
		}else{
			cube = new THREE.Mesh(new THREE.CubeGeometry( 20, 1, 20 ), darkCubeMaterial );
			cube.position.x = xDist;
			cube.position.z = zDist;
			cube.position.y = 0.5;
			cube.receiveShadow = true;
			scene.add( cube );
		}
		xDist += 20;
	}
}
//-------------------------------------------------------------------------//[MISC METHODS]
var rotWorldMatrix;
// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

    rotWorldMatrix.multiply(object.matrix);      // pre-multiply

    object.matrix = rotWorldMatrix;

    object.rotation.setFromRotationMatrix(object.matrix);
}
function unfold(foldRate){
	grabber.rotateOnAxis(xAxis,-foldRate);
	grabber2.rotateOnAxis(xAxis,foldRate);
	foreArm.rotateZ(foldRate/2);
	middleArm.rotateZ(-foldRate/2.5);
	baseArm.rotateZ(foldRate/4);
}
// Renders the scene and updates the render as needed.
//-------------------------------------------------------------------------//[ANIMATION]
function animate() {

	requestAnimationFrame(animate);
	if(moveBall){
		//true = random motion
		spotLightAnimation(false);
		ball.translateOnAxis(zAxis, 1);
		ball.rotateOnAxis(yAxis, .08);
		mirrorBallCamera.translateOnAxis(zAxis, 1);
		mirrorBallCamera.rotateOnAxis(yAxis, .08);
	}else{
		spotLightAnimation(true);
	}
	
	
	/*//Uncomment to animate the perlin sphere texture
	perlinSphere.material.needsUpdate = true;
	perlinSphere.material.uniforms['time'].value = .00025 * ( Date.now() - start );
	*/
	
	ball.visible = false;
	mirrorBallCamera.updateCubeMap( renderer, scene );
	ball.visible = true;
	
	//Robot animation
	if(unfoldRequested == true && unfoldCountdown > 0 ){
		unfold(.03);
		unfoldCountdown--;
	}else{
		if(unfoldRequested == true){
			isFolded = false;
			unfoldRequested = false;
			busyDoingSomething = false;
			unfoldCountdown = 100;
		}
	}
	
	//For future work with object detection of sphere
	/*
	if(ballGrabbed){
		grabber.matrixAutoUpdate && grabber.updateMatrix();
		var grabberWorldPosition = ( new THREE.Vector4() ).applyMatrix4(grabber.matrixWorld);
		//set ball Position to follow where grabbers are located
	}*/

	// Render the scene.
	renderer.render(scene, camera);
}
