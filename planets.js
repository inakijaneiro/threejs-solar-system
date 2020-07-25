var container;

var camera, scene, renderer, composer, clock;
let orbitControls = null;

var uniforms, mesh;

let materials = {};
let meshes = {};
let maps = {};
let contourMaps = {};

const duration = 10000; // ms
const sunSize = 2;
const numberOfAsteroids = 150;
let listOfAsteroids = [];

let textureLoader = new THREE.TextureLoader();



const planetList = [
	{
		planetName: "mercury",
		typeOfContour: "bump",
		// distanceFromSun: 1.5 * sunSize,
		distanceFromSun: 1.5 * sunSize,
		parentGroup: null,
		revolution: 0.1171843025, // / 2,
		rotation: 0.175916435, // / 2,
		size: 0.3,
		moons: 0,
		moonsParentGroups : [],
	}, 
	{
		planetName: "venus",
		typeOfContour: "normal",
		// distanceFromSun: 2.85 * sunSize,
		distanceFromSun: 3 * sunSize,
		parentGroup: null,
		revolution: 0.08560944067, // / 2,
		rotation: -0.07916230995, // / 2,
		size: 0.6,
		moons: 0,
		moonsParentGroups : [],
	},
	{
		planetName: "earth",
		typeOfContour: "normal",
		// distanceFromSun: 3.93 * sunSize,
		distanceFromSun: 4.5 * sunSize,
		parentGroup: null,
		revolution: 0.072921159, // / 2,
		rotation: 26.9042247842 / 50, // / 2,
		size: 0.65,
		moons: 1,
		moonsParentGroups : [],
	},
	{
		planetName: "mars",
		typeOfContour: "normal",
		distanceFromSun: 6 * sunSize,
		parentGroup: null,
		revolution: 0.05848276952, // / 2,
		rotation: 38.9897697305 / 50, // / 2,
		size: 0.4,
		moons: 2,
		moonsParentGroups : [],
	},
	{
		planetName: "jupiter",
		typeOfContour: "none",
		// distanceFromSun: 20.52 * sunSize,
		distanceFromSun: 7.5 * sunSize,
		parentGroup: null,
		revolution: 0.03164778301, // / 2,
		rotation: 38.9897697305 / 50, // / 2,
		// size: 10.2,
		size: 1,
		moons: 10,
		moonsParentGroups : [],
	},
	{
		planetName: "saturn",
		typeOfContour: "none",
		// distanceFromSun: 37.81 * sunSize,
		distanceFromSun: 9 * sunSize,
		parentGroup: null,
		revolution: 0.02355353436, // / 2,
		rotation: 38.9897697305 / 50, // / 2,
		// size: 8.3,
		size: 1,
		moons: 10,
		moonsParentGroups : [],

	},
	{
		planetName: "uranus",
		typeOfContour: "none",
		// distanceFromSun: 75.55 * sunSize,
		distanceFromSun: 10.5 * sunSize,
		parentGroup: null,
		revolution: 0.01662602425, // / 2,
		rotation: -38.9897697305 / 50, // / 2,
		// size: 3.3,
		size: 0.8,
		moons: 10,
		moonsParentGroups : [],

	},
	{
		planetName: "neptune",
		typeOfContour: "none",
		// distanceFromSun: 119.21 * sunSize,
		distanceFromSun: 12 * sunSize,
		parentGroup: null,
		revolution: 0.01327165094, // / 2,
		rotation: 38.9897697305 / 50, // / 2,
		// size: 3.2,
		size: 0.8,
		moons: 10,
		moonsParentGroups : [],
	},
	{
		planetName: "pluto",
		typeOfContour: "bump",
		// distanceFromSun: 155.23 * sunSize,
		distanceFromSun: 13.5 * sunSize,
		parentGroup: null,
		revolution: 0.01159446428, // / 2,
		rotation: -38.9897697305 / 50, // / 2,
		size: 0.1,
		moons: 5,
		moonsParentGroups : [],
	},
];

function addSaturnRings() {
	let saturnRings = textureLoader.load("images/planets/saturnring.png");
	let geometry = new THREE.RingBufferGeometry(1, 5, 64);
	let pos = geometry.attributes.position;
	let v3 = new THREE.Vector3();
	for (let i = 0; i < pos.count; i++){
		v3.fromBufferAttribute(pos, i);
		geometry.attributes.uv.setXY(i, v3.length() < 4 ? 0 : 1, 1);
	}

	const material = new THREE.MeshBasicMaterial({
		map: saturnRings,
		color: 0xffffff,
		side: THREE.DoubleSide,
		transparent: true
	});
	const mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.x = Math.PI / 2;
	mesh.scale.x = 0.4;
	mesh.scale.y = 0.4;
	mesh.scale.z = 0.4;

	let ringsGroup = new THREE.Object3D;

	ringsGroup.add(mesh);

	meshes["saturn"].add( ringsGroup );


}

function addMoons(moonCount, planetSize, parentGroup, listOfMoonGroups) {
	let moonColor = textureLoader.load("images/moonmap.jpg");
	let moonBump = textureLoader.load("images/moonbump.jpg");

	let moon = new THREE.MeshPhongMaterial({ map: moonColor, bumpMap: moonBump, bumpScale: 0.001 });


	for (let i = 0; i < moonCount; i++) {


			let moonGroup = new THREE.Object3D;
			
			let moonMesh = new THREE.Mesh(new THREE.SphereGeometry((planetSize / 4) / (moonCount > 3 ? moonCount * Math.random() + 1 : moonCount) , 20, 20), moon);
			moonMesh.position.x = planetSize + planetSize / 2;
			moonMesh.position.y = Math.random() * (planetSize / 2 - planetSize / 4) + planetSize / 4;
			moonMesh.position.y *= Math.floor(Math.random()*2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases


			// moonMesh.position.z = 0;
			moonGroup.add(moonMesh);
			parentGroup.add(moonGroup);
			listOfMoonGroups.push({parentGroup: moonGroup, rotationX: Math.random() * (0.1 - 0.05) + 0.05, rotationY: Math.random() * (0.1 - 0.05) + 0.05});
			// parentGroup.position.x += 1

	}


}

function addOrbit(radius, rootGroup) {
	var geometry = new THREE.TorusGeometry( radius, 0.005, 2, 100 );
	var material = new THREE.MeshBasicMaterial( { color: 0xefefef } );
	var torus = new THREE.Mesh( geometry, material );
	torus.rotation.x = Math.PI / 2;
	rootGroup.add( torus );

}

function positionAsteroids(rootGroup) {
	// instantiate a loader
var loader = new THREE.OBJLoader();
let asteroidModels = [];

loader.load('images/models/asteroids/asteroid1.obj', ( object ) => {
	asteroidModels.push(object);
	loader.load('images/models/asteroids/asteroid2.obj', ( object2 ) => {
		asteroidModels.push(object2);
		for (let i = 0; i < numberOfAsteroids; i++) {
			let asteroidGroup = new THREE.Object3D;
			let asteroidIndex = Math.round(Math.random());
			let position = Math.random() * (4.80 - 4.65) + 4.65;
			let shouldBeNegative1 = Math.round(Math.random());
			let shouldBeNegative2 = Math.round(Math.random());
			let scaleRand = Math.random() * (0.01 - 0.005) + 0.005;
			// load a resource
			let asteroid = asteroidModels[asteroidIndex].clone();
			let multiplier1 = shouldBeNegative1 ? -1 : 1;
			let multiplier2 = shouldBeNegative2 ? -1 : 1;
			asteroid.scale.x = scaleRand;
			asteroid.scale.y = scaleRand;
			asteroid.scale.z = scaleRand;
			asteroid.position.x = position * sunSize * multiplier1;
			asteroid.position.y = 0;
			asteroid.position.z = position * sunSize * multiplier2;
			asteroidGroup.add( asteroid );
			listOfAsteroids.push({
				asteroid: asteroid,
				rotation: Math.random() * (0.005 - 0.001) + 0.001,
				parentGroup: asteroidGroup,
			});
			rootGroup.add(asteroidGroup);
		}
	});
});

}

function positionPlanet(offset, planet, rootGroup, size) {
	let planetGroup = new THREE.Object3D;
	
	meshes[planet] = new THREE.Mesh(new THREE.SphereGeometry(size, 20, 20), materials[planet]);
	meshes[planet].position.x = offset;
	meshes[planet].position.y = 0;
	meshes[planet].position.z = 0;


	planetGroup.add(meshes[planet]);

	rootGroup.add( planetGroup );
	addOrbit(offset, rootGroup);

	return planetGroup;
}

function generatePlanet(planet, typeOfContour) {
	maps[planet] = textureLoader.load(`images/planets/${planet}map.jpg`);
	maps[planet].wrapS = maps[planet].wrapT = THREE.RepeatWrapping;
	if (typeOfContour !== "none") {
		contourMaps[planet] = textureLoader.load(`images/planets/${planet}${typeOfContour}.${typeOfContour === "bump" ? "jpg" : "png" }`);
		if (typeOfContour === "bump"){
			materials[planet] = new THREE.MeshPhongMaterial({ map: maps[planet], bumpMap: contourMaps[planet], bumpScale: 0.001 });
		}
		else if (typeOfContour === "normal") {
			materials[planet] = new THREE.MeshPhongMaterial({  map: maps[planet], normalMap: contourMaps[planet], normalScale: new THREE.Vector2( 1, 1 )});
		}
	}
	else {
		materials[planet] = new THREE.MeshPhongMaterial({ map: maps[planet]	});
	}

}

function createLight(rootGroup) {
	let pointLight = new THREE.PointLight (0xffffff, 1);
	rootGroup.add(pointLight);

	ambientLight = new THREE.AmbientLight ( 0xffffff, 0.1 );
	// ambientLight = new THREE.AmbientLight ( 0xffffff, 1 );
    rootGroup.add(ambientLight);
}

function createMeshes() {

	// This will hold the entire solar system
	let solarSystemGroup = new THREE.Object3D;

	createLight(solarSystemGroup);

	// SUN

	meshes.sun = new THREE.Mesh( new THREE.SphereGeometry( sunSize, 30, 30 ), materials.sun );
	meshes.sun.rotation.x = 0.3;

	solarSystemGroup.add(meshes.sun);

	planetList.forEach((map, index	) => {
		map.parentGroup = positionPlanet(map.distanceFromSun, map.planetName, solarSystemGroup, map.size);
		addMoons(map.moons, map.size, meshes[map.planetName], map.moonsParentGroups);
	})

	positionAsteroids(solarSystemGroup);
	addOrbit(13.5, solarSystemGroup);

	addSaturnRings();


	// // MERCURY    
	// let mercuryGroup = new THREE.Object3D;
	
	// meshes.mercury = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), materials.mercury);
	// meshes.mercury.position.x = 1.5;
	// meshes.mercury.position.y = 0;
	// meshes.mercury.position.z = 0;


	// mercuryGroup.add(meshes.mercury);

	// solarSystemGroup.add( meshes.mercury );

	// // VENUS    
	// let venusGroup = new THREE.Object3D;

	// console.log(materials.venus)
	
	// meshes.venus = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), materials.venus);
	// meshes.venus.position.x = 3;
	// meshes.venus.position.y = 0;
	// meshes.venus.position.z = 0;


	// venusGroup.add(meshes.venus);

	// solarSystemGroup.add( venusGroup );

	// // EARTH    
	// let earthGroup = new THREE.Object3D;
	
	// meshes.earth = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), materials.earth);
	// meshes.earth.position.x = 4.5;
	// meshes.earth.position.y = 0;
	// meshes.earth.position.z = 0;


	// earthGroup.add(meshes.earth);

	// solarSystemGroup.add( earthGroup );
	scene.background = textureLoader.load( 'images/background.jpg' );
	scene.add( solarSystemGroup );
}

function createMaterials() {

	// SUN
	uniforms = {

		"fogDensity": { value: 0.45 },
		"fogColor": { value: new THREE.Vector3( 0, 0, 0 ) },
		"time": { value: 1.0 },
		"uvScale": { value: new THREE.Vector2( 2.0, 1 ) },
		"texture1": { value: textureLoader.load( 'images/cloud.png' ) },
		"texture2": { value: textureLoader.load( 'images/lavatile.jpg' ) }

	};

	uniforms[ "texture1" ].value.wrapS = uniforms[ "texture1" ].value.wrapT = THREE.RepeatWrapping;
	uniforms[ "texture2" ].value.wrapS = uniforms[ "texture2" ].value.wrapT = THREE.RepeatWrapping;

	materials.sun = new THREE.ShaderMaterial( {
		uniforms: uniforms,
		vertexShader: document.getElementById( 'vertexShader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentShader' ).textContent
	} );

	planetList.forEach(map => {
		generatePlanet(map.planetName, map.typeOfContour);
	})

	// materials.asteroid =


	// // MERCURY
	// maps.mercury = textureLoader.load("images/planets/mercurymap.jpg");
	// maps.mercury.wrapS = maps.mercury.wrapT = THREE.RepeatWrapping;
	// contourMaps.mercury = textureLoader.load("images/planets/mercurybump.jpg");
	// materials.mercury = new THREE.MeshPhongMaterial({ map: maps.mercury, bumpMap: contourMaps.mercury, bumpScale: 0.001 });

	createMeshes();

}

function init(canvas) 
{

	camera = new THREE.PerspectiveCamera( 35, window.innerWidth / window.innerHeight, 1, 3000 );
	camera.position.z = 40;
	camera.position.y = 8;

	scene = new THREE.Scene();

	clock = new THREE.Clock();

	createMaterials();

	
	renderer = new THREE.WebGLRenderer( { canvas:canvas, antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	orbitControls = new THREE.OrbitControls(camera, renderer.domElement);

//

	onWindowResize();

	window.addEventListener( 'resize', onWindowResize, false );

	animate();

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

	requestAnimationFrame( animate );

	render();

}

function updateObjects(delta) {
	// let now = Date.now();
    let fract = delta / duration;
    let angle = Math.PI * 2 * fract;

	for (planet of planetList) {
		
		
		meshes[planet.planetName].rotation.y += delta * planet.rotation;
		planet.parentGroup.rotation.y += delta * planet.revolution;
		
		listOfAsteroids.forEach(object => {
			object.parentGroup.rotation.y += delta * object.rotation;
		})

		planet.moonsParentGroups.forEach(moon => {
			moon.parentGroup.rotation.z += delta * moon.rotationY;
			moon.parentGroup.rotation.x += delta * moon.rotationX;
		})

	}
}

function render() {

	var delta = 5 * clock.getDelta();

	uniforms[ "time" ].value += 0.2 * delta;

	renderer.render(scene, camera);
	orbitControls.update();

	updateObjects(delta);

}