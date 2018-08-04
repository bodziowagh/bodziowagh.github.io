const SCENE = {
	FRUSTUM: 75,
	WIDTH: window.innerWidth,
	HEIGHT: window.innerHeight,
	NEAR: 0.01,
	FAR: 100
};

const FLOOR = {
	SIZE: 20,       // Remember to make it dividable by 2
	COLOR: 0x00ff22
};

const CONFIG = {
    displayDirectionsIndicator: false,
    camera: {
        autoRotate: false
    },
    rendererProps: {
        antialias: true
    },
    colors: {
        baseColor: {
            r: 70  / 255,
            g: 183 / 255,
            b: 55  / 255
        },
        topColor: {
            r: 199 / 255,
            g: 40   / 255,
            b: 0  / 255
        }
    },
    map: {
        maxHeight: 6
    }
};

CONFIG.colors.ratio = {
    r: (CONFIG.colors.topColor.r - CONFIG.colors.baseColor.r),
    g: (CONFIG.colors.topColor.g - CONFIG.colors.baseColor.g),
    b: (CONFIG.colors.topColor.b - CONFIG.colors.baseColor.b)
};

let renderer, camera, scene, controls;
let floor = [];
let floor2 = [];

function init() {
	function initWebGL() {
		renderer = new THREE.WebGLRenderer({ antialias: CONFIG.rendererProps });
		camera = new THREE.PerspectiveCamera(SCENE.FRUSTUM,
											 SCENE.WIDTH / SCENE.HEIGHT,
											 SCENE.NEAR,
											 SCENE.FAR);
		scene = new THREE.Scene();

		camera.position.set(0, 18, 0);             // TODO: define those as props
		camera.lookAt(new THREE.Vector3(0, 0, 0));

        controls = new THREE.OrbitControls(camera);
        controls.autoRotate = CONFIG.camera.autoRotate;
        controls.addEventListener("change", render);

		scene.add(camera);

		renderer.setSize(SCENE.WIDTH, SCENE.HEIGHT);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFShadowMap;

		document.body.appendChild(renderer.domElement);
	}

	function initIndicator() {
		const geometryY = new THREE.Geometry();
        const materialY = new THREE.LineBasicMaterial( { color: 0xff0000 } );
        const verticesY = [
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(0, 0, 0)
		];
        geometryY.vertices = verticesY;

        const geometryX = new THREE.Geometry();
        const materialX = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
        const verticesX = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ];
        geometryX.vertices = verticesX;

        const geometryZ = new THREE.Geometry();
        const materialZ = new THREE.LineBasicMaterial( { color: 0x0000ff } );
        const verticesZ = [
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0)
        ];
        geometryZ.vertices = verticesZ;

        scene.add(new THREE.Line(geometryY, materialY));
        scene.add(new THREE.Line(geometryX, materialX));
        scene.add(new THREE.Line(geometryZ, materialZ));
	}

	function initFloor() {
        for (let x = 0; x < FLOOR.SIZE; x++) {
            const geometry = new THREE.Geometry();	// TODO change to buffere geometry
            const material = new THREE.LineBasicMaterial({
                size: 3,
                sizeAttenuation: false,
                vertexColors: THREE.VertexColors
            });

            for (let z = 0; z < FLOOR.SIZE; z++) {
                geometry.vertices.push(new THREE.Vector3(x - FLOOR.SIZE / 2, 0, z - FLOOR.SIZE / 2));
                geometry.colors.push(new THREE.Color(0x000000));
            }

            floor.push(new THREE.Line(geometry, material))
		    scene.add(floor[x]);
        }

        for (let x = 0; x < FLOOR.SIZE; x++) {
            const geometry = new THREE.Geometry();	// TODO change to buffere geometry
            const material = new THREE.LineBasicMaterial({
                size: 3,
                sizeAttenuation: false,
                vertexColors: THREE.VertexColors
            });

            for (let z = 0; z < FLOOR.SIZE; z++) {
                geometry.vertices.push(floor[z].geometry.vertices[x]);
                geometry.colors.push(new THREE.Color(0xffffff));
            }

            floor2.push(new THREE.Line(geometry, material))
            scene.add(floor2[x]);
        }
    }


	function initLight() {
		const light = new THREE.PointLight( 0xffffff, 1, 50 );

		light.position.set(0, 0, 0);

		light.castShadow = true;
		light.shadow.camera.near = 1;
		light.shadow.camera.far = 25;

		scene.add(light);
	}

	initWebGL();
    CONFIG.displayDirectionsIndicator && initIndicator();
	initLight();

	initFloor();
}

function render() {
    renderer.render(scene, camera);
}


function getIncrementValue(currentY, targetY) {
    const slowDownStart = targetY * 0.9;
    const speed = targetY / 200;

    if (currentY < slowDownStart) {
        return speed;
    }

    if (currentY < targetY) {
        return speed - ((currentY - slowDownStart) / (targetY - slowDownStart) * speed);
    }

    return 0;
}

function getColor(height) {
    const heightRatio = height / CONFIG.map.maxHeight;

    if (heightRatio >= 1) {
        return CONFIG.colors.topColor;
    }

    if (heightRatio <= 0) {
        return CONFIG.colors.baseColor;
    }

    return {
        r: CONFIG.colors.baseColor.r + (heightRatio * CONFIG.colors.ratio.r),
        g: CONFIG.colors.baseColor.g + (heightRatio * CONFIG.colors.ratio.g),
        b: CONFIG.colors.baseColor.b + (heightRatio * CONFIG.colors.ratio.b)
    };
}

function animate() {
    // Animate floor:
	for (let x = 0; x < FLOOR.SIZE; x++) {
	    const currentLine = floor[x];
	    for (let z = 0; z < FLOOR.SIZE; z++) {
	        const i = z * FLOOR.SIZE + x;
	        const currentPoint = currentLine.geometry.vertices[z];

	        if (currentPoint.y < HEIGHT_MAP[i]) {   // TODO: move to getIncrementValue ?
                currentPoint.y += getIncrementValue(currentPoint.y, HEIGHT_MAP[i]);
            }

            currentLine.geometry.colors[z] = getColor(currentPoint.y);
        }

        currentLine.geometry.verticesNeedUpdate = true;
        currentLine.geometry.colorsNeedUpdate = true;
    }

    for (let x = 0; x < FLOOR.SIZE; x++) {
        const currentLine = floor2[x];

        for (let z = 0; z < FLOOR.SIZE; z++) {
            const currentPoint = currentLine.geometry.vertices[z];

            currentLine.geometry.colors[z] = getColor(currentPoint.y);
        }

        currentLine.geometry.verticesNeedUpdate = true;
        currentLine.geometry.colorsNeedUpdate = true;
    }

    controls.update();
	requestAnimationFrame(animate);
	render();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();

window.addEventListener("resize", onWindowResize);
