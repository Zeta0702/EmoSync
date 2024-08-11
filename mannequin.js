// Added comments
// mannequin.js
//
// a libary for human figure
//
// joint constraints reference:
//		https://www.dshs.wa.gov/sites/default/files/forms/pdf/13-585a.pdf


// Define the version constants for the mannequin and posture data
const MANNEQUIN_VERSION = 4.5;
const MANNEQUIN_POSTURE_VERSION = 7;

// Define the axis vectors using THREE.js Vector3 objects
const AXIS = {
	x: new THREE.Vector3(1, 0, 0), // X-axis vector
	y: new THREE.Vector3(0, 1, 0), // Y-axis vector
	z: new THREE.Vector3(0, 0, 1)  // Z-axis vector
};

// Define a custom error class for handling incompatible posture versions
class MannequinPostureVersionError extends Error {
	constructor(version) {
		super('Posture data version ' + version + ' is incompatible with the currently supported version ' + MANNEQUIN_POSTURE_VERSION + '.');
		this.name = "IncompatibleMannequinError"; // Set the error name
	}
}

// Function to create and initialize the 3D scene
function createScene() {
	// Create a WebGL renderer with anti-aliasing enabled
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the renderer to fill the window
	renderer.domElement.style = 'width:100%; height:100%; position:fixed; top:0; left:0;'; // Style the renderer element to fill the window
	renderer.shadowMap.enabled = true; // Enable shadow mapping
	renderer.setAnimationLoop(drawFrame); // Set the animation loop function
	document.body.appendChild(renderer.domElement); // Append the renderer to the document body

	// Create a new 3D scene
	scene = new THREE.Scene();

	// Set the background color of the scene
	scene.background = new THREE.Color('rgb(204,233,229)');

	// Create a perspective camera
	camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 2000);
	camera.position.set(0, 0, 180); // Position the camera

	// Add lighting to the scene
	light = new THREE.PointLight('white', 0.5); // Create a point light with intensity 0.5
	light.position.set(0, 100, 50); // Position the light
	light.shadow.mapSize.width = 1024; // Set shadow map width
	light.shadow.mapSize.height = 1024; // Set shadow map height
	light.castShadow = true; // Enable casting shadows
	scene.add(light, new THREE.AmbientLight('white', 0.5)); // Add the point light and ambient light to the scene

	/**
	 * Environment map (commented out section)
	 * Code to load an environment map texture, but it's currently commented out
	 */
	// const rgbeLoader = new RGBELoader()
	// rgbeLoader.load('./textures/environmentMap/nature.hdr', (texture) =>
	// {
	// 	texture.mapping = THREE.EquirectangularReflectionMapping;
	// 	scene.environment = texture;
	// 	scene.background = texture;
	// })

	// Function to handle window resize events
	function onWindowResize(event) {
		camera.aspect = window.innerWidth / window.innerHeight; // Update camera aspect ratio
		camera.updateProjectionMatrix(); // Update camera projection matrix

		renderer.setSize(window.innerWidth, window.innerHeight, true); // Update renderer size
	}
	// Add an event listener for window resize events
	window.addEventListener('resize', onWindowResize, false);
	onWindowResize(); // Call the resize function initially

	// Create geometries and materials for the ground elements
	const geometry = new THREE.CircleGeometry(64, 100); // Create a circle geometry with radius 64 and 100 segments
	const material = new THREE.MeshLambertMaterial({ color: 'rgb(173,222,218)' }); // Create a material with a specific color
	material.side = THREE.DoubleSide; // Set the material to render both sides of the geometry
	const ground1 = new THREE.Mesh(geometry, material); // Create the first ground mesh
	const ground3 = new THREE.Mesh(geometry, material); // Create the third ground mesh
	
	// Create a torus geometry for the second ground element
	var ground2 = new THREE.Mesh(
		new THREE.TorusGeometry(64, 2, 16, 100), // Torus geometry with specific parameters
		new THREE.MeshLambertMaterial({ color: 'rgb(173,222,218)' }) // Material with the same color
	);

	// Enable shadow reception for the ground meshes
	ground1.receiveShadow = true;
	ground3.receiveShadow = true;

	// Position and rotate the ground elements
	ground1.position.y = -25;
	ground2.position.y = -27;
	ground3.position.y = -29;
	ground1.rotation.x = -Math.PI / 2;
	ground2.rotation.x = -Math.PI / 2;
	ground3.rotation.x = -Math.PI / 2;

	// Add the ground elements to the scene
	scene.add(ground1);
	scene.add(ground2);
	scene.add(ground3);

	// Create a clock to track time in the scene
	clock = new THREE.Clock();
} // End of createScene function



// Function to draw each frame in the animation loop
function drawFrame() {
	animate(100 * clock.getElapsedTime()); // Call the animate function with elapsed time as a parameter
	renderer.render(scene, camera); // Render the scene from the perspective of the camera
}

// Placeholder function for animations, intended to be overwritten by the user
function animate() {}

// Helper functions for working with angles in degrees

// Convert degrees to radians
function rad(x) {
	return x * Math.PI / 180;
}

// Convert radians to degrees
function grad(x) {
	return Number((x * 180 / Math.PI).toFixed(1));
}

// Calculate the sine of an angle in degrees
function sin(x) {
	return Math.sin(rad(x));
}

// Calculate the cosine of an angle in degrees
function cos(x) {
	return Math.cos(rad(x));
}

//================================================
// Verbatim copy of examples\js\geometries\ParametricGeometry.js

// Immediately-invoked function expression (IIFE) to create a local scope
(function () {

	/**
	 * Parametric Surfaces Geometry
	 * This class creates a geometry based on parametric equations, inspired by an article by @prideout.
	 * The geometry is generated by defining a function that returns a 3D point (u, v) -> (x, y, z),
	 * and then calculating vertices, normals, and UV coordinates for a mesh.
	 */
	class ParametricGeometry extends THREE.BufferGeometry {

		// Constructor with default parametric function, number of slices, and stacks
		constructor(func = (u, v, target) => target.set(u, v, Math.cos(u) * Math.sin(v)), slices = 8, stacks = 8) {
			super();
			this.type = 'ParametricGeometry'; // Set the type of geometry
			this.parameters = {
				func: func, // Parametric function to generate vertices
				slices: slices, // Number of slices (horizontal divisions)
				stacks: stacks  // Number of stacks (vertical divisions)
			};

			// Initialize buffers for indices, vertices, normals, and UVs
			const indices = [];
			const vertices = [];
			const normals = [];
			const uvs = [];
			const EPS = 0.00001; // Small epsilon value for finite difference calculations
			const normal = new THREE.Vector3();
			const p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
			const pu = new THREE.Vector3(), pv = new THREE.Vector3();

			// Generate vertices, normals, and UVs
			const sliceCount = slices + 1;
			for (let i = 0; i <= stacks; i++) {
				const v = i / stacks; // Calculate the v parameter
				for (let j = 0; j <= slices; j++) {
					const u = j / slices; // Calculate the u parameter

					// Calculate vertex position using the parametric function
					func(u, v, p0);
					vertices.push(p0.x, p0.y, p0.z);

					// Calculate normal vector using finite differences to approximate tangent vectors
					if (u - EPS >= 0) {
						func(u - EPS, v, p1);
						pu.subVectors(p0, p1);
					} else {
						func(u + EPS, v, p1);
						pu.subVectors(p1, p0);
					}

					if (v - EPS >= 0) {
						func(u, v - EPS, p1);
						pv.subVectors(p0, p1);
					} else {
						func(u, v + EPS, p1);
						pv.subVectors(p1, p0);
					}

					// Cross product of tangent vectors to get the surface normal
					normal.crossVectors(pu, pv).normalize();
					normals.push(normal.x, normal.y, normal.z);

					// Store UV coordinates
					uvs.push(u, v);
				}
			}

			// Generate indices for the geometry faces
			for (let i = 0; i < stacks; i++) {
				for (let j = 0; j < slices; j++) {
					const a = i * sliceCount + j;
					const b = i * sliceCount + j + 1;
					const c = (i + 1) * sliceCount + j + 1;
					const d = (i + 1) * sliceCount + j;

					// Create two triangular faces
					indices.push(a, b, d);
					indices.push(b, c, d);
				}
			}

			// Build the geometry by setting indices and attributes
			this.setIndex(indices);
			this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
			this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
			this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
		}
	}

	// Attach the ParametricGeometry class to the THREE namespace
	THREE.ParametricGeometry = ParametricGeometry;

})();

//==============================================

// create parametric surface
// ParametricShape class extends THREE.Group, allowing creation of custom shapes using parametric surfaces
class ParametricShape extends THREE.Group {
	constructor(tex, col, func, nU = 3, nV = 3) {	
		super();
		// Create a mesh using ParametricGeometry and a material
		var obj = new THREE.Mesh(
			new THREE.ParametricGeometry(func, nU, nV), // Geometry generated by a parametric function
			new THREE.MeshStandardMaterial({
				color: col, // Set the color of the material
				// shininess: 1, // Shininess property (commented out)
				map: tex // Apply a texture map to the material
			})
		);
		// Enable shadows for the object
		obj.receiveShadow = true;
		obj.castShadow = true;
		this.add(obj); // Add the object to the group
	} // ParametricShape.constructor

	// Method to add a sphere to the ParametricShape group
	addSphere(r, y, x = 0, z = 0) {
		var s = new THREE.Mesh(
			Mannequin.sphereGeometry, // Use a predefined sphere geometry
			new THREE.MeshLambertMaterial({
				color: Mannequin.colors[15], // Set the color of the material
			})
		);
		// Enable shadows for the sphere
		s.castShadow = true;
		s.receiveShadow = true;
		// Scale and position the sphere
		s.scale.set(r, r, r);
		s.position.set(x, y, z);
		this.add(s); // Add the sphere to the group
		return s; // Return the created sphere
	} // ParametricShape.addSphere
} // ParametricShape

// HeadShape class extends ParametricShape, creating a custom head shape using parametric surfaces
class HeadShape extends ParametricShape {
	constructor(feminine, params) {
		super(Mannequin.texHead, Mannequin.colors[0], function (u, v, target) {
			// Parametric function to define the head shape
			var r = Mannequin.cossers(u, v, [
				[0.4, 0.9, 0, 1, -3],
				[0, 1, 0, 0.1, 3],
				[0, 1, 0.9, 1, 3],
				[1.00, 1.05, 0.55, 0.85, -3],
				[1.00, 1.05, 0.15, 0.45, -3],
				[0.93, 1.08, 0.40, 0.60, 8],
				[0.0, 0.7, 0.05, 0.95, 3],
				[-0.2, 0.2, -0.15, 1.15, -6],
				[-0.07, 0.07, 0.45, 0.55, 20], // Nose
				[-0.07, 0.01, 0.35, 0.55, 10], // Nostril
				[-0.07, 0.01, 0.45, 0.65, 10], // Nostril
			]);
			u = 360 * u; // Convert u to degrees
			v = 180 * v - 90; // Convert v to degrees
			var k = (1 + (feminine ? 1 : 2) * sin(u) * cos(v)) / 4; // Calculate a modifier based on gender
			target.set(
				r * params.sx * cos(u) * cos(v),
				r * params.sy * sin(u) * cos(v),
				(r + k) * params.sz * sin(v)
			);
		}, 32, 32); // Number of subdivisions in the u and v directions
	} // HeadShape.constructor
} // HeadShape

// ShoeShape class extends THREE.Group, creating a custom shoe shape using parametric surfaces
class ShoeShape extends THREE.Group {
	constructor(feminine, params) {
		super();

		// Add the first part of the shoe
		this.add(new ParametricShape(Mannequin.texLimb, Mannequin.colors[1], function (u, v, target) {
			// Parametric function to define the shoe shape
			var r = Mannequin.cossers(u, v, [
				[0.6, 1.1, 0.05, 0.95, 1],
				[0.6, 0.68, 0.35, 0.65, feminine ? 1.2 : 1000]
			]);
			u = 360 * u; // Convert u to degrees
			v = 180 * v - 90; // Convert v to degrees
			target.set(
				(3 * r - 2) * params.sx * (cos(u) * cos(v) + (feminine ? (Math.pow(sin(u + 180), 2) * cos(v) - 1) : 0)) - (feminine ? 0 : 2),
				params.sy * sin(u) * cos(v) + 2,
				params.sz * sin(v)
			);
		}, 24, 12)); // Number of subdivisions in the u and v directions

		// If the shoe is feminine, add an additional part
		if (feminine) {
			this.add(new ParametricShape(Mannequin.texLimb, Mannequin.colors[4], function (u, v, target) {
				// Parametric function to define the additional shoe shape
				var r = Mannequin.cossers(u, v, [
					[0.6, 1.1, 0.05, 0.95, 1 / 2]
				]);
				u = 360 * u; // Convert u to degrees
				v = 180 * v - 90; // Convert v to degrees
				target.set(
					0.3 * (3 * r - 2) * params.sx * (cos(u) * cos(v)),
					0.8 * params.sy * sin(u) * cos(v) + 2,
					0.6 * params.sz * sin(v)
				);
			}, 12, 12)); // Number of subdivisions in the u and v directions

			// Rotate the shoe parts slightly
			this.children[0].rotation.set(0, 0, 0.4);
			this.children[1].rotation.set(0, 0, 0.4);
		} // if (feminine)

		// Rotate the entire shoe shape
		this.rotation.z = -Math.PI / 2;
	} // ShoeShape.constructor
} // ShoeShape

// PelvisShape class extends ParametricShape, creating a custom pelvis shape using parametric surfaces
class PelvisShape extends ParametricShape {
	constructor(feminine, params) {
		super(Mannequin.texLimb, Mannequin.colors[2], function (u, v, target) {
			// Parametric function to define the pelvis shape
			var r = Mannequin.cossers(u, v, [
				[0.6, 0.95, 0, 1, 4],
				[0.7, 1.0, 0.475, 0.525, -13],
				[-0.2, 0.3, 0, 0.3, -4],
				[-0.2, 0.3, -0.3, 0, -4]
			]);
			u = 360 * u - 90; // Convert u to degrees
			v = 180 * v - 90; // Convert v to degrees
			target.set(
				-1.5 + r * params[0] * cos(u) * Math.pow(cos(v), 0.6),
				r * params[1] * sin(u) * Math.pow(cos(v), 0.6),
				r * params[2] * sin(v)
			);
		}, 20, 10); // Number of subdivisions in the u and v directions
	} // PelvisShape.constructor
} // PelvisShape

// LimbShape class extends ParametricShape to create a limb using a parametric surface
class LimbShape extends ParametricShape {
	constructor(feminine, params, nU = 24, nV = 12) {
		// Extract parameters from the params array
		var x = params[0],     // X scaling factor
			y = params[1],     // Y scaling factor (height)
			z = params[2],     // Z scaling factor
			alpha = params[3], // Base angle for parametric equation
			dAlpha = params[4], // Incremental angle for parametric equation
			offset = params[5], // Offset for the radius calculation
			scale = params[6],  // Scaling factor for the radius
			rad = params[7];    // Radius for the optional sphere

		// Call the parent class (ParametricShape) constructor
		super(Mannequin.texLimb, Mannequin.colors[4], function (u, v, target) {
			// Convert v to degrees
			v = 360 * v;
			
			// Calculate radius based on the parametric function
			var r = offset + scale * cos(alpha + dAlpha * u);
			
			// Set the position of the vertex using the parametric function
			target.set(x * r * cos(v) / 2, y * u, z * r * sin(v) / 2);
			
			// Calculate a secondary vector to blend between different shapes
			var w = new THREE.Vector3(
				x * cos(v) * cos(170 * u - 85) / 2,
				y * (1 / 2 + sin(180 * u - 90) / 2),
				z * sin(v) * cos(180 * u - 90) / 2
			);
			
			// Interpolate between the main vector and the secondary vector for a smoother shape
			target = target.lerp(w, Math.pow(Math.abs(2 * u - 1), 16));
		}, nU, nV); // nU and nV define the number of segments along u and v

		// Set the position of the limb shape
		this.children[0].position.set(0, -y / 2, 0);

		// Optionally add a sphere at the base of the limb
		if (rad) this.addSphere(rad ? rad : z / 2, -y / 2);
	} // LimbShape.constructor
} // LimbShape

// TorsoShape class extends ParametricShape to create a torso using a parametric surface
class TorsoShape extends ParametricShape {
	constructor(feminine, params) {
		// Extract parameters from the params array
		var x = params[0],     // X scaling factor
			y = params[1],     // Y scaling factor (height)
			z = params[2],     // Z scaling factor
			alpha = params[3], // Base angle for parametric equation
			dAlpha = params[4], // Incremental angle for parametric equation
			offset = params[5], // Offset for the radius calculation
			scale = params[6];  // Scaling factor for the radius

		// Call the parent class (ParametricShape) constructor
		super(Mannequin.texLimb, Mannequin.colors[5], function (u, v, target) {
			// Calculate radius based on the parametric function
			var r = offset + scale * cos(alpha + dAlpha * u);

			// Modify the radius for feminine models with additional detail
			if (feminine) {
				r += Mannequin.cossers(u, v, [
					[0.35, 0.85, 0.7, 0.95, 2],
					[0.35, 0.85, 0.55, 0.8, 2]
				]) - 1;
			}

			// Convert v to degrees and offset by 90 degrees
			v = 360 * v + 90;

			// Calculate the main position vectors for the torso shape
			var x1 = x * (0.3 + r) * cos(v) / 2,
				y1 = y * u,
				z1 = z * r * sin(v) / 2;

			// Calculate secondary vectors for smoother transitions
			var x2 = x * cos(v) * cos(180 * u - 90) / 2,
				y2 = y * (1 / 2 + sin(180 * u - 90) / 2),
				z2 = z * sin(v) * cos(180 * u - 90) / 2;

			// Interpolation factors for smooth transitions
			var k = Math.pow(Math.abs(2 * u - 1), 16),
				kx = Math.pow(Math.abs(2 * u - 1), 2);

			// Adjust kx if x2 is negative for correct blending
			if (x2 < 0) kx = k;

			// Set the final position of the vertex by interpolating between the two vectors
			target.set(
				x1 * (1 - kx) + kx * x2,
				y1 * (1 - k) + k * y2,
				z1 * (1 - k) + k * z2
			);
		}, 30, 20); // nU and nV define the number of segments along u and v

		// Set the position of the torso shape
		this.children[0].position.set(0, -y / 2, 0);

		// Add a sphere at the base of the torso
		this.addSphere(2, -y / 2);
	} // TorsoShape.constructor
} // TorsoShape


// Joint class extends THREE.Group to represent a flexible joint that can be attached to other joints
class Joint extends THREE.Group {
	constructor(parentJoint, pos, params, shape) {
		super();

		// Determine the y-value for positioning, defaulting to params[1] if params.sy is not provided
		var yVal = params.sy || params[1];

		// If a shape is provided, create an instance of it; otherwise, create an empty group
		if (shape) {
			this.image = new shape(parentJoint ? parentJoint.feminine : false, params);
		} else {
			this.image = new THREE.Group();
		}

		this.image.castShadow = true; // Enable shadows for the joint's image

		// Position the image if it's not a PelvisShape or ShoeShape
		if (shape != PelvisShape && shape != ShoeShape) {
			this.image.position.set(0, yVal / 2, 0);
		}

		// Create a wrapper group for the image to allow for additional transformations
		this.imageWrapper = new THREE.Group();
		this.imageWrapper.add(this.image); // Add the image to the wrapper
		this.imageWrapper.castShadow = true; // Enable shadows for the wrapper

		this.add(this.imageWrapper); // Add the wrapper to the joint

		this.castShadow = true; // Enable shadows for the joint
		this.yVal = yVal; // Store the y-value
		this.parentJoint = parentJoint; // Reference to the parent joint

		// If a parent joint is provided, attach this joint to it
		if (parentJoint) {
			this.position.set(0, shape ? parentJoint.yVal : parentJoint.yVal / 4, 0); // Position the joint
			parentJoint.imageWrapper.add(this); // Add this joint to the parent joint's wrapper
			this.feminine = parentJoint.feminine; // Inherit the feminine property from the parent joint
		}

		// If an initial position is provided, set the joint's position
		if (pos) {
			this.position.set(pos[0], pos[1], pos[2]);
		}

		// Initialize rotation limits for the joint
		this.minRot = new THREE.Vector3();
		this.maxRot = new THREE.Vector3();
	} // Joint.constructor

	// Getter and setter for the z-rotation in degrees
	get z() {
		this.rotation.reorder('YXZ'); // Reorder the rotation axes to YXZ
		return this.rotation.z * 180 / Math.PI; // Convert radians to degrees
	}
	
	set z(angle) {
		this.rotation.reorder('YXZ'); // Reorder the rotation axes to YXZ
		this.rotation.z = angle * Math.PI / 180; // Convert degrees to radians
	} // Joint.z

	// Getter and setter for the x-rotation in degrees
	get x() {
		this.rotation.reorder('YZX'); // Reorder the rotation axes to YZX
		return this.rotation.x * 180 / Math.PI; // Convert radians to degrees
	}

	set x(angle) {
		this.rotation.reorder('YZX'); // Reorder the rotation axes to YZX
		this.rotation.x = angle * Math.PI / 180; // Convert degrees to radians
	} // Joint.x

	// Getter and setter for the y-rotation in degrees
	get y() {
		this.rotation.reorder('ZXY'); // Reorder the rotation axes to ZXY
		return this.rotation.y * 180 / Math.PI; // Convert radians to degrees
	}
	
	set y(angle) {
		this.rotation.reorder('ZXY'); // Reorder the rotation axes to ZXY
		this.rotation.y = angle * Math.PI / 180; // Convert degrees to radians
	} // Joint.y

	// Reset the joint's rotation to zero
	reset() {
		this.rotation.set(0, 0, 0); // Set the rotation to zero on all axes
	}

	// Getter and setter for the joint's posture as an array of rotations in degrees
	get posture() {
		this.rotation.reorder('XYZ'); // Reorder the rotation axes to XYZ
		return [grad(this.rotation.x), grad(this.rotation.y), grad(this.rotation.z)]; // Convert radians to degrees
	}
	
	set posture(pos) {
		this.rotation.set(rad(pos[0]), rad(pos[1]), rad(pos[2]), 'XYZ'); // Convert degrees to radians and set the rotation
	} // Joint.posture

	// Calculate the global coordinates of a point relative to the joint
	getBumper(x, y, z) {
		var bumper = new THREE.Vector3(x, y, z); // Create a vector for the point
		this.image.localToWorld(bumper); // Convert local coordinates to world coordinates
		this.parentJoint.image.worldToLocal(bumper); // Convert world coordinates back to local relative to the parent joint
		return bumper; // Return the calculated bumper position
	}

	// Hide the joint's image
	hide() {
		this.image.visible = false; // Set the visibility of the image to false
	} // Joint.hide

	// Show the joint's image
	show() {
		this.image.visible = true; // Set the visibility of the image to true
	} // Joint.show
	
	// Attach a THREE.Object3D instance to the joint
	attach(image) {
		this.imageWrapper.add(image); // Add the object to the image wrapper
	} // Joint.attach

	// Detach a THREE.Object3D instance from the joint
	detach(image) {
		// Check if the image is a child of the image wrapper and remove it if so
		if (this.imageWrapper.children.includes(this.imageWrapper.getObjectById(image.id))) {
			this.imageWrapper.remove(this.imageWrapper.getObjectById(image.id));
		}
	} // Joint.detach
	
	// Calculate global coordinates of a point with coordinates relative to the joint
	point(x, y, z) {
		// Convert the local coordinates of the point to world coordinates and then to the scene's local coordinates
		return scene.worldToLocal(this.localToWorld(new THREE.Vector3(x, y, z)));
	} // Joint.point

	// Select or deselect the joint by adjusting its material's emissive color
	select(state) {
		this.traverse(function (o) {
			// If the object has a material with an emissive property, adjust the color based on the state
			if (o.material && o.material.emissive) {
				o.material.emissive.setRGB(state ? 0.1 : 0, state ? 0.1 : 0, state ? 0.1 : 0); // This line was edited to make the select colour white instead of green
			}
		});
	} // Joint.select
} // Joint



// Pelvis class extends Joint to represent the pelvis part of a body
class Pelvis extends Joint {
	constructor(parentJoint) {
		// Call the parent Joint constructor with specific parameters for the pelvis
		super(parentJoint, null, [3, 4, parentJoint.feminine ? 5.7 : 5.2], PelvisShape);

		// Set the rotation limits to allow unlimited rotation in all directions
		this.minRot = new THREE.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
		this.maxRot = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
	} // Pelvis.constructor
} // Pelvis

// Body class extends Joint to represent the entire body, which can have a feminine or masculine form
class Body extends Joint {
	constructor(feminine) {
		// Call the parent Joint constructor with default parameters for the body
		super(null, null, [1, 1, 1], THREE.Group);

		this.feminine = feminine; // Store whether the body is feminine or masculine

		// Set the rotation limits to allow unlimited rotation in all directions
		this.minRot = new THREE.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
		this.maxRot = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
	} // Body.constructor

	// Getter and setter for the bend (z-rotation) of the body
	get bend() {
		return -this.z;
	}
	
	set bend(angle) {
		this.z = -angle; // Negative angle for backward compatibility
	}

	// Getter and setter for the tilt (x-rotation) of the body
	get tilt() {
		return -this.x;
	}
	
	set tilt(angle) {
		this.x = -angle; // Negative angle for backward compatibility
	}

	// Getter and setter for the turn (y-rotation) of the body
	get turn() {
		return this.y;
	}
	
	set turn(angle) {
		this.y = angle;
	}
} // Body

// Torso class extends Joint to represent the torso part of a body
class Torso extends Joint {
	constructor(parentJoint) {
		// Call the parent Joint constructor with specific parameters for the torso
		super(parentJoint, [-2, 4, 0], [6, 16, 12, parentJoint.feminine ? 10 : 80, parentJoint.feminine ? 520 : 380, parentJoint.feminine ? 0.8 : 0.9, parentJoint.feminine ? 0.25 : 0.2], TorsoShape);

		// Set the rotation limits for the torso
		this.minRot = new THREE.Vector3(-25, -50, -60);
		this.maxRot = new THREE.Vector3(25, 50, 25);
	} // Torso.constructor

	// Getter and setter for the bend (z-rotation) of the torso
	get bend() {
		return -this.z;
	}
	
	set bend(angle) {
		this.z = -angle; // Negative angle for backward compatibility
	}

	// Getter and setter for the tilt (x-rotation) of the torso
	get tilt() {
		return -this.x;
	}
	
	set tilt(angle) {
		this.x = -angle; // Negative angle for backward compatibility
	}

	// Getter and setter for the turn (y-rotation) of the torso
	get turn() {
		return this.y;
	}
	
	set turn(angle) {
		this.y = angle;
	}
} // Torso

// Neck class extends Joint to represent the neck part of a body
class Neck extends Joint {
	constructor(parentJoint) {
		// Call the parent Joint constructor with specific parameters for the neck
		super(parentJoint, [-1, 15, 0], [2.3, parentJoint.feminine ? 5 : 4, 2.3, 45, 60, 1, 0.2, 0], LimbShape);

		// Set the rotation limits for the neck
		this.minRot = new THREE.Vector3(-45 / 2, -90 / 2, -60);
		this.maxRot = new THREE.Vector3(45 / 2, 90 / 2, 50 / 2);
	} // Neck.constructor
} // Neck


// Head class extends Joint to represent the head part of a body
class Head extends Joint {
	// Static property to define the size of the head
	static SIZE = {sx: 3, sy: 4, sz: 2.5};

	constructor(parentJoint) {
		// Call the parent Joint constructor with specific parameters for the head
		super(parentJoint, [1, 3, 0], Head.SIZE, HeadShape);

		// Set the rotation limits for the head
		this.minRot = new THREE.Vector3(-45 / 2, -90 / 2, -60 / 2);
		this.maxRot = new THREE.Vector3(45 / 2, 90 / 2, 50 / 2);
	} // Head.constructor

	// Getter and setter for the nodding motion (z-rotation) of the head
	get nod() {
		return -2 * this.z; // Return the double of the negative z-rotation
	}
	
	set nod(angle) {
		this.z = -angle / 2; // Set half of the negative angle to z-rotation
		this.parentJoint.z = -angle / 2; // Also set the parent joint's z-rotation
	}

	// Getter and setter for the tilting motion (x-rotation) of the head
	get tilt() {
		return -2 * this.x; // Return the double of the negative x-rotation
	}
	
	set tilt(angle) {
		this.x = -angle / 2; // Set half of the negative angle to x-rotation
		this.parentJoint.x = -angle / 2; // Also set the parent joint's x-rotation
	}

	// Getter and setter for the turning motion (y-rotation) of the head
	get turn() {
		return 2 * this.y; // Return the double of the y-rotation
	}
	
	set turn(angle) {
		this.y = angle / 2; // Set half of the angle to y-rotation
		this.parentJoint.y = angle / 2; // Also set the parent joint's y-rotation
	}

	// Getter and setter for the posture of the head, which is the orientation in degrees
	get posture() {
		this.rotation.reorder('XYZ'); // Reorder the rotation axes to XYZ
		return [grad(this.rotation.x), grad(this.rotation.y), grad(this.rotation.z)]; // Return the rotation in degrees
	}
	
	set posture(pos) {
		this.rotation.set(rad(pos[0]), rad(pos[1]), rad(pos[2]), 'XYZ'); // Set the rotation using the given degrees
		this.parentJoint.rotation.set(rad(pos[0]), rad(pos[1]), rad(pos[2]), 'XYZ'); // Also set the parent joint's rotation
	} // Head.posture
} // Head

// Leg class extends Joint to represent a leg part of a body, either left or right
class Leg extends Joint {
	constructor(parentJoint, leftOrRight) {
		// Call the parent Joint constructor with specific parameters for the leg
		super(parentJoint, [-1, -3, 4 * leftOrRight], [4.5, 16.4, 4.5, -70, 220, 1, 0.4, 2], LimbShape);
		this.leftOrRight = leftOrRight; // Store whether this is the left or right leg

		// Rotate the image wrapper 180 degrees around the x-axis (flips the leg upside down)
		this.imageWrapper.rotation.set(Math.PI, 0, 0);
	} // Leg.constructor

	// Method to check if the leg's current rotation is biologically impossible
	biologicallyImpossibleLevel() {
		var result = 0; // Initialize the result

		this.image.updateWorldMatrix(true); // Update the world matrix for accurate calculations

		// Check if the leg's x-position is out of bounds
		var p = this.getBumper(5, 0, 0);
		if (p.x < 0) result += -p.x; // Add the excess to the result if out of bounds

		this.rotation.reorder('ZXY'); // Reorder the rotation axes to ZXY
		var y = this.y; // Get the y-rotation

		// Check if the y-rotation is out of allowable bounds
		if (y > +60) result += y - 60;
		if (y < -60) result += -60 - y;

		return result; // Return the accumulated impossibility value
	} // Leg.biologicallyImpossibleLevel

	// Getter and setter for the raising motion (z-rotation) of the leg
	get raise() {
		return this.z; // Return the z-rotation
	}
	
	set raise(angle) {
		this.z = angle; // Set the z-rotation to the given angle
	}

	// Getter and setter for the straddling motion (x-rotation) of the leg
	get straddle() {
		return -this.leftOrRight * this.x; // Return the x-rotation multiplied by the leg's side (left or right)
	}
	
	set straddle(angle) {
		this.x = -this.leftOrRight * angle; // Set the x-rotation based on the leg's side
	}

	// Getter and setter for the turning motion (y-rotation) of the leg
	get turn() {
		return -this.leftOrRight * this.y; // Return the y-rotation multiplied by the leg's side (left or right)
	}
	
	set turn(angle) {
		this.y = -this.leftOrRight * angle; // Set the y-rotation based on the leg's side
	}
} // Leg



// Knee class extends Joint to represent the knee joint in a leg
class Knee extends Joint {
	constructor(parentJoint) {
		// Call the parent Joint constructor with specific parameters for the knee
		super(parentJoint, null, [4.2, 14.3, 4.2, -40, 290, 0.65, 0.25, 1.5], LimbShape);

		// Set the rotation limits for the knee, allowing movement only within 0 to 150 degrees on the z-axis
		this.minRot = new THREE.Vector3(0, 0, 0);
		this.maxRot = new THREE.Vector3(0, 0, 150);
	} // Knee.constructor

	// Getter and setter for the bending motion (z-rotation) of the knee
	get bend() {
		return this.z;
	}
	
	set bend(angle) {
		this.z = angle; // Set the z-rotation to the given angle
	}

	// Getter and setter for the posture of the knee, returning or setting the rotation in degrees
	get posture() {
		this.rotation.reorder('XYZ'); // Reorder the rotation axes to XYZ
		return [grad(this.rotation.z)]; // Return the z-rotation in degrees
	}

	set posture(pos) {
		this.rotation.set(0, 0, rad(pos[0]), 'XYZ'); // Set the z-rotation using the given degree and reorder to XYZ
	}
} // Knee

// Ankle class extends Joint to represent the ankle joint in a leg
class Ankle extends Joint {
	// Static property to define the size of the ankle
	static SIZE = {sx: 1, sy: 4, sz: 2};
	
	constructor(parentJoint) {
		// Call the parent Joint constructor with specific parameters for the ankle
		super(parentJoint, null, Ankle.SIZE, ShoeShape);
		this.leftOrRight = parentJoint.parentJoint.leftOrRight; // Determine whether the ankle is left or right

		// Set the rotation limits for the ankle, allowing specific movement ranges on all axes
		this.minRot = new THREE.Vector3(-25, -30, -70);
		this.maxRot = new THREE.Vector3(25, 30, 80);
	} // Ankle.constructor

	// Getter and setter for the bending motion (z-rotation) of the ankle
	get bend() {
		return -this.z;
	}
	
	set bend(angle) {
		this.z = -angle; // Set the z-rotation to the negative of the given angle
	}

	// Getter and setter for the tilting motion (x-rotation) of the ankle
	get tilt() {
		return this.leftOrRight * this.x; // Return the x-rotation multiplied by the left or right factor
	}
	
	set tilt(angle) {
		this.x = this.leftOrRight * angle; // Set the x-rotation based on the left or right factor
	}

	// Getter and setter for the turning motion (y-rotation) of the ankle
	get turn() {
		return this.leftOrRight * this.y; // Return the y-rotation multiplied by the left or right factor
	}
	
	set turn(angle) {
		this.y = this.leftOrRight * angle; // Set the y-rotation based on the left or right factor
	}
} // Ankle

// Arm class extends Joint to represent an arm in a body, either left or right
class Arm extends Joint {
	constructor(parentJoint, leftOrRight) {
		// Call the parent Joint constructor with specific parameters for the arm
		super(parentJoint, [0, 13, leftOrRight * (parentJoint.feminine ? 6 : 7)], [4, 11, 3, -90, 360, 0.9, 0.2, 1.5], LimbShape);
		this.leftOrRight = leftOrRight; // Store whether this is the left or right arm

		// Rotate the image wrapper 180 degrees around the x and y axes (flips the arm)
		this.imageWrapper.rotation.set(Math.PI, Math.PI, 0);
	} // Arm.constructor

	// Method to check if the arm's current rotation is biologically impossible
	biologicallyImpossibleLevel() {
		var result = 0; // Initialize the result

		this.image.updateWorldMatrix(true); // Update the world matrix for accurate calculations

		// Check if the arm's z-position is out of bounds
		var p = this.getBumper(0, 15, -0 * 5 * this.leftOrRight);

		if (p.z * this.leftOrRight < -3) result += -3 - p.z * this.leftOrRight; // Add to the result if the z-position is out of bounds

		// Check if the arm's x-position is out of bounds when y is positive
		if (p.x < -7 && p.y > 0) result = p.y;

		this.rotation.reorder('ZXY'); // Reorder the rotation axes to ZXY
		var r = this.rotation.y * 180 / Math.PI; // Convert the y-rotation to degrees
		var min = -90; // Set the minimum allowable rotation
		var max = 90;  // Set the maximum allowable rotation

		// Check if the y-rotation is out of allowable bounds
		if (r > max) result += r - max;
		if (r < min) result += min - r;

		return result; // Return the accumulated impossibility value
	}

	// Getter and setter for the raising motion (z-rotation) of the arm
	get raise() {
		return this.z;
	}
	
	set raise(angle) {
		this.z = angle; // Set the z-rotation to the given angle
	}

	// Getter and setter for the straddling motion (x-rotation) of the arm
	get straddle() {
		return -this.leftOrRight * this.x; // Return the x-rotation multiplied by the left or right factor
	}
	
	set straddle(angle) {
		this.x = -this.leftOrRight * angle; // Set the x-rotation based on the left or right factor
	}

	// Getter and setter for the turning motion (y-rotation) of the arm
	get turn() {
		return -this.leftOrRight * this.y; // Return the y-rotation multiplied by the left or right factor
	}
	
	set turn(angle) {
		this.y = -this.leftOrRight * angle; // Set the y-rotation based on the left or right factor
	}
} // Arm



// Elbow class extends Joint to represent the elbow joint in an arm
class Elbow extends Joint {
	constructor(parentJoint) {
		// Call the parent Joint constructor with specific parameters for the elbow
		super(parentJoint, null, [3, 11, 2.5, -40, 150, 0.5, 0.45, 1.1], LimbShape);

		// Set the rotation limits for the elbow, allowing movement within 0 to 150 degrees on the z-axis
		this.minRot = new THREE.Vector3(0, 0, 0);
		this.maxRot = new THREE.Vector3(0, 0, 150);
	} // Elbow.constructor

	// Getter and setter for the bending motion (z-rotation) of the elbow
	get bend() {
		return this.z;
	}
	
	set bend(angle) {
		this.z = angle; // Set the z-rotation to the given angle
	}

	// Getter and setter for the posture of the elbow, returning or setting the rotation in degrees
	get posture() {
		this.rotation.reorder('XYZ'); // Reorder the rotation axes to XYZ
		return [grad(this.rotation.z)]; // Return the z-rotation in degrees
	}
	
	set posture(pos) {
		this.rotation.set(0, 0, rad(pos[0]), 'XYZ'); // Set the z-rotation using the given degree and reorder to XYZ
	}
} // Elbow

// Wrist class extends Joint to represent the wrist joint in an arm
class Wrist extends Joint {
	constructor(parentJoint) {
		// Call the parent Joint constructor with specific parameters for the wrist
		super(parentJoint, null, [1.5, 2.5, 2.5, -90, 120, 0.5, 0.3, 0.5], LimbShape);
		this.leftOrRight = parentJoint.parentJoint.leftOrRight; // Determine whether the wrist is on the left or right arm

		// Rotate the image wrapper to align with the wrist's orientation
		this.imageWrapper.rotation.set(0, -this.leftOrRight * Math.PI / 2, 0);

		// Set the rotation limits based on whether the wrist is left or right
		if (this.leftOrRight == -1) { // Left wrist
			this.minRot = new THREE.Vector3(-20, -90, -90);
			this.maxRot = new THREE.Vector3(35, 90, 90);
		} else { // Right wrist
			this.minRot = new THREE.Vector3(-35, -90, -90);
			this.maxRot = new THREE.Vector3(20, 90, 90);
		}
	} // Wrist.constructor

	// Method to check if the wrist's current rotation is biologically impossible
	biologicallyImpossibleLevel() {
		var result = 0; // Initialize the result

		// Extract the wrist's basis vectors
		var wristX = new THREE.Vector3(), wristY = new THREE.Vector3(), wristZ = new THREE.Vector3();
		this.matrixWorld.extractBasis(wristX, wristY, wristZ);

		// Extract the elbow's basis vectors
		var elbowX = new THREE.Vector3(), elbowY = new THREE.Vector3(), elbowZ = new THREE.Vector3();
		this.parentJoint.matrixWorld.extractBasis(elbowX, elbowY, elbowZ);

		// Check if the y-basis vectors of the wrist and elbow are misaligned
		var dot1 = wristY.dot(elbowY);
		if (dot1 < 0) result += -dot1;

		// Check if the z-basis vectors of the wrist and elbow are misaligned
		var dot2 = wristZ.dot(elbowZ);
		if (dot2 < 0) result += -dot2;

		return result; // Return the accumulated impossibility value
	} // Wrist.biologicallyImpossibleLevel

	// Getter and setter for the bending motion (x-rotation) of the wrist
	get bend() {
		return -this.leftOrRight * this.x;
	}
	
	set bend(angle) {
		this.x = -this.leftOrRight * angle; // Set the x-rotation based on the wrist's side
	}

	// Getter and setter for the tilting motion (z-rotation) of the wrist
	get tilt() {
		return this.leftOrRight * this.z;
	}
	
	set tilt(angle) {
		this.z = this.leftOrRight * angle; // Set the z-rotation based on the wrist's side
	}

	// Getter and setter for the turning motion (y-rotation) of the wrist
	get turn() {
		return this.leftOrRight * this.y;
	}
	
	set turn(angle) {
		this.y = this.leftOrRight * angle; // Set the y-rotation based on the wrist's side
	}
} // Wrist

// Phalange class extends Joint to represent a finger joint (phalange) in a hand
class Phalange extends Joint {
	constructor(parentJoint, params, nailSize) {
		// Call the parent Joint constructor with specific parameters for the phalange
		super(parentJoint, null, params, LimbShape);

		// Set the rotation limits for the phalange, allowing movement within -10 to 100 degrees on the z-axis
		this.minRot = new THREE.Vector3(0, 0, -10);
		this.maxRot = new THREE.Vector3(0, 0, 100);

		// If a nail size is provided, create and attach a nail to the phalange
		if (nailSize > 0) {
			this.nail = new THREE.Mesh(
				Mannequin.sphereGeometry, // Use a sphere geometry for the nail
				new THREE.MeshLambertMaterial({
					color: Mannequin.colors[6], // Set the color of the nail
				})
			);
			this.nail.castShadow = true; // Enable shadow casting for the nail
			this.nail.receiveShadow = true; // Enable shadow reception for the nail
			this.nail.scale.set(0.05, 0.2 * nailSize, 0.1 * nailSize); // Scale the nail based on the provided size
			this.nail.position.set(params[0] / 4, params[1] * 0.7, 0); // Position the nail on the phalange
			this.nail.rotation.set(0, 0, 0.2); // Rotate the nail slightly

			// Add a recolor function to the nail for changing its color
			this.nail.recolor = function(color) {
				if (typeof color === 'string') color = new THREE.Color(color);
				this.parent.nail.material.color = color;
			};

			// Attach the nail to the phalange
			this.add(this.nail);
		}
	} // Phalange.constructor

	// Getter and setter for the bending motion (z-rotation) of the phalange
	get bend() {
		return this.z;
	}
	
	set bend(angle) {
		this.z = angle; // Set the z-rotation to the given angle
	}
} // Phalange



// Finger class extends Phalange to represent a finger with multiple joints (phalanges)
class Finger extends Phalange {
	constructor(parentJoint, leftOrRight, number) {
		// Determine if the finger is a thumb (based on its number)
		var thumb = (number == 0);

		// Scale factors for the size of the finger and its components
		var sca = [1.2, 0.95, 1, 0.95, 0.8][number];
		var fat = [1.0, 0.95, 1, 0.95, 0.8][number];
		var fat2 = [1.5, 1, 1, 1, 1][number];

		// Rotation limits for the finger's x-axis based on its position (thumb, index, middle, etc.)
		var minX = [0, -20, -15, -25, -35][number] * leftOrRight;
		var maxX = [50, 35, 15, 15, 20][number] * leftOrRight;

		// Call the parent Phalange constructor with specific parameters for the finger
		super(parentJoint, [0.8 * fat, 0.8 * sca * (thumb ? 1.4 : 1), 0.8 * fat2, 0, 45, 0.3, 0.4, 0.25], 0);

		// Set the initial position of the finger based on its number (thumb, index, etc.)
		this.position.x = [-0.3, 0.0, 0.15, 0.15, 0.03][number];
		this.position.y = [0.5, 2.2, 2.3, 2.2, 2.1][number];
		this.position.z = [0.8, 0.7, 0.225, -0.25, -0.7][number] * leftOrRight;

		// Create the middle and tip phalanges of the finger
		this.mid = new Phalange(this, [0.6 * fat, 0.7 * sca * (thumb ? 1.1 : 1), 0.6 * fat2, 0, 60, 0.3, 0.4, 0.15], 0);
		this.tip = new Phalange(this.mid, [0.5 * fat, 0.6 * sca * (thumb ? 1.1 : 1), 0.5 * fat2, 0, 60, 0.3, 0.4, 0.1], fat2);

		this.leftOrRight = leftOrRight; // Store whether the finger is on the left or right hand

		// Set the y-rotation for the thumb; other fingers have zero initial y-rotation
		this.y = thumb ? -this.leftOrRight * 90 : 0;

		// Set rotation limits for the finger based on its position and type
		this.minRot = new THREE.Vector3(Math.min(minX, maxX), Math.min(this.y, 2 * this.y), thumb ? -90 : -10);
		this.maxRot = new THREE.Vector3(Math.max(minX, maxX), Math.max(this.y, 2 * this.y), thumb ? 45 : 120);

		// Set rotation limits for the middle and tip phalanges
		this.mid.minRot = new THREE.Vector3(0, 0, 0);
		this.mid.maxRot = new THREE.Vector3(0, 0, thumb ? 90 : 120);

		this.tip.minRot = new THREE.Vector3(0, 0, 0);
		this.tip.maxRot = new THREE.Vector3(0, 0, thumb ? 90 : 120);
	} // Finger.constructor

	// Getter and setter for the bending motion (z-rotation) of the finger
	get bend() {
		return this.z;
	}
	
	set bend(angle) {
		this.z = angle; // Set the z-rotation to the given angle
	}

	// Getter and setter for the straddling motion (x-rotation) of the finger
	get straddle() {
		return -this.leftOrRight * this.x;
	}
	
	set straddle(angle) {
		this.x = -this.leftOrRight * angle; // Set the x-rotation based on the finger's side
	}

	// Getter and setter for the turning motion (y-rotation) of the finger
	get turn() {
		return -this.leftOrRight * this.y;
	}
	
	set turn(angle) {
		this.y = -this.leftOrRight * angle; // Set the y-rotation based on the finger's side
	}

	// Getter and setter for the posture of the finger, returning or setting the rotation in degrees
	get posture() {
		this.rotation.reorder('XYZ'); // Reorder the rotation axes to XYZ
		this.mid.rotation.reorder('XYZ');
		this.tip.rotation.reorder('XYZ');
		return [
			grad(this.rotation.x),
			grad(this.rotation.y),
			grad(this.rotation.z),
			grad(this.mid.rotation.x),
			grad(this.mid.rotation.z),
			grad(this.tip.rotation.x),
			grad(this.tip.rotation.z),
		];
	}
	
	set posture(pos) {
		this.rotation.reorder('XYZ'); // Reorder the rotation axes to XYZ
		this.rotation.x = rad(pos[0]);
		this.rotation.y = rad(pos[1]);
		this.rotation.z = rad(pos[2]);
		this.mid.rotation.set(rad(pos[3]), 0, rad(pos[4]), 'XYZ');
		this.tip.rotation.set(rad(pos[5]), 0, rad(pos[6]), 'XYZ');
	}
} // Finger

// Fingers class extends Joint to represent a group of fingers, allowing mass control over them
class Fingers extends Joint {
	// Constructor to initialize the fingers, accepting individual fingers as parameters
	constructor(finger_0, finger_1, finger_2, finger_3, finger_4) {
		super(null, null, {}, null); // Call the parent Joint constructor with default parameters

		// Store references to each finger
		this.finger_0 = finger_0;
		this.finger_1 = finger_1;
		this.finger_2 = finger_2;
		this.finger_3 = finger_3;
		this.finger_4 = finger_4;

		// Set the image wrapper to the one used by the middle finger
		this.imageWrapper = this.finger_2.imageWrapper;
	}
	
	// Getter and setter for the bending motion (z-rotation) of all fingers
	get bend() {
		return this.finger_1.bend; // Return the bend of the index finger (as a representative)
	}
	
	set bend(angle) {
		// Set the bend angle for each finger and their joints (mid and tip)
		this.finger_0.bend = angle / 2;
		this.finger_1.bend = angle;
		this.finger_2.bend = angle;
		this.finger_3.bend = angle;
		this.finger_4.bend = angle;

		this.finger_0.mid.bend = angle / 2;
		this.finger_1.mid.bend = angle;
		this.finger_2.mid.bend = angle;
		this.finger_3.mid.bend = angle;
		this.finger_4.mid.bend = angle;
		
		this.finger_0.tip.bend = angle / 2;
		this.finger_1.tip.bend = angle;
		this.finger_2.tip.bend = angle;
		this.finger_3.tip.bend = angle;
		this.finger_4.tip.bend = angle;
	}
	
	// Method to change the color of all fingers and their joints
	recolor(color, secondaryColor = color) {
		// Recolor the base of each finger
		this.finger_0.recolor(color, secondaryColor);
		this.finger_1.recolor(color, secondaryColor);
		this.finger_2.recolor(color, secondaryColor);
		this.finger_3.recolor(color, secondaryColor);
		this.finger_4.recolor(color, secondaryColor);

		// Recolor the middle joints of each finger
		this.finger_0.mid.recolor(color, secondaryColor);
		this.finger_1.mid.recolor(color, secondaryColor);
		this.finger_2.mid.recolor(color, secondaryColor);
		this.finger_3.mid.recolor(color, secondaryColor);
		this.finger_4.mid.recolor(color, secondaryColor);

		// Recolor the tips of each finger
		this.finger_0.tip.recolor(color, secondaryColor);
		this.finger_1.tip.recolor(color, secondaryColor);
		this.finger_2.tip.recolor(color, secondaryColor);
		this.finger_3.tip.recolor(color, secondaryColor);
		this.finger_4.tip.recolor(color, secondaryColor);
	}
} // Fingers




// Nails class extends Joint to represent a collection of nails on fingers, allowing mass recoloring
class Nails extends Joint {
	// Constructor to initialize the Nails object with references to the nails on each finger
	constructor(finger_0, finger_1, finger_2, finger_3, finger_4) {
		// Call the parent Joint constructor with default parameters
		super(null, null, {}, null);

		// Store references to the nails on each finger's tip
		this.nail_0 = finger_0.tip.nail;
		this.nail_1 = finger_1.tip.nail;
		this.nail_2 = finger_2.tip.nail;
		this.nail_3 = finger_3.tip.nail;
		this.nail_4 = finger_4.tip.nail;
	}
	
	// Method to change the color of all nails
	recolor(color) {
		// Recolor each nail using the provided color
		this.nail_0.recolor(color);
		this.nail_1.recolor(color);
		this.nail_2.recolor(color);
		this.nail_3.recolor(color);
		this.nail_4.recolor(color);
	}
} // Nails


// Mannequin class extends THREE.Group to represent a 3D model of a mannequin with movable parts
class Mannequin extends THREE.Group {
	constructor(feminine, height = 1) {
		super();

		// Constants for left and right sides of the mannequin
		const LEFT = -1;
		const RIGHT = 1;

		// Set the overall scale of the mannequin based on the provided height
		this.scale.set(height, height, height);

		// Store whether the mannequin is feminine or masculine
		this.feminine = feminine;

		// Initialize body parts of the mannequin
		this.body = new Body(feminine);

		this.pelvis = new Pelvis(this.body);
		this.torso = new Torso(this.pelvis);
		this.neck = new Neck(this.torso);
		this.head = new Head(this.neck);

		// Initialize left leg components
		this.l_leg = new Leg(this.pelvis, LEFT);
		this.l_knee = new Knee(this.l_leg);
		this.l_ankle = new Ankle(this.l_knee);

		// Initialize right leg components
		this.r_leg = new Leg(this.pelvis, RIGHT);
		this.r_knee = new Knee(this.r_leg);
		this.r_ankle = new Ankle(this.r_knee);

		// Initialize left arm components and fingers
		this.l_arm = new Arm(this.torso, LEFT);
		this.l_elbow = new Elbow(this.l_arm);
		this.l_wrist = new Wrist(this.l_elbow);
		this.l_finger_0 = new Finger(this.l_wrist, LEFT, 0);
		this.l_finger_1 = new Finger(this.l_wrist, LEFT, 1);
		this.l_finger_2 = new Finger(this.l_wrist, LEFT, 2);
		this.l_finger_3 = new Finger(this.l_wrist, LEFT, 3);
		this.l_finger_4 = new Finger(this.l_wrist, LEFT, 4);

		// Group all left fingers and nails for easier control
		this.l_fingers = new Fingers(this.l_finger_0, this.l_finger_1, this.l_finger_2, this.l_finger_3, this.l_finger_4);
		this.l_nails = new Nails(this.l_finger_0, this.l_finger_1, this.l_finger_2, this.l_finger_3, this.l_finger_4);

		// Initialize right arm components and fingers
		this.r_arm = new Arm(this.torso, RIGHT);
		this.r_elbow = new Elbow(this.r_arm);
		this.r_wrist = new Wrist(this.r_elbow);
		this.r_finger_0 = new Finger(this.r_wrist, RIGHT, 0);
		this.r_finger_1 = new Finger(this.r_wrist, RIGHT, 1);
		this.r_finger_2 = new Finger(this.r_wrist, RIGHT, 2);
		this.r_finger_3 = new Finger(this.r_wrist, RIGHT, 3);
		this.r_finger_4 = new Finger(this.r_wrist, RIGHT, 4);

		// Group all right fingers and nails for easier control
		this.r_fingers = new Fingers(this.r_finger_0, this.r_finger_1, this.r_finger_2, this.r_finger_3, this.r_finger_4);
		this.r_nails = new Nails(this.r_finger_0, this.r_finger_1, this.r_finger_2, this.r_finger_3, this.r_finger_4);

		// Add the body to the mannequin
		this.add(this.body);

		// Adjust the scale of the head based on the overall height of the mannequin
		var s = 1.5 / (0.5 + height);
		this.head.scale.set(s, s, s);

		// Enable shadow casting and receiving for the entire mannequin
		this.castShadow = true;
		this.receiveShadow = true;

		// Add the mannequin to the scene
		scene.add(this);

		// Update matrices for the mannequin
		this.updateMatrix();
		this.updateWorldMatrix();

		// Set a default posture for the mannequin
		this.position.y += 6;

		this.body.turn = -90;
		this.torso.bend = 2;
		this.head.nod = -10;

		this.l_arm.raise = -5;
		this.r_arm.raise = -5;

		this.l_arm.straddle = 7;
		this.r_arm.straddle = 7;

		this.l_elbow.bend = 15;
		this.r_elbow.bend = 15;

		this.l_wrist.bend = 5;
		this.r_wrist.bend = 5;

		this.l_finger_0.straddle = -20;
		this.r_finger_0.straddle = -20;

		this.l_finger_0.bend = -15;
		this.l_finger_1.bend = 10;
		this.l_finger_2.bend = 10;
		this.l_finger_3.bend = 10;
		this.l_finger_4.bend = 10;

		this.l_finger_0.mid.bend = 10;
		this.l_finger_1.mid.bend = 10;
		this.l_finger_2.mid.bend = 10;
		this.l_finger_3.mid.bend = 10;
		this.l_finger_4.mid.bend = 10;

		this.l_finger_0.tip.bend = 10;
		this.l_finger_1.tip.bend = 10;
		this.l_finger_2.tip.bend = 10;
		this.l_finger_3.tip.bend = 10;
		this.l_finger_4.tip.bend = 10;

		this.r_finger_0.bend = -15;
		this.r_finger_1.bend = 10;
		this.r_finger_2.bend = 10;
		this.r_finger_3.bend = 10;
		this.r_finger_4.bend = 10;

		this.r_finger_0.mid.bend = 10;
		this.r_finger_1.mid.bend = 10;
		this.r_finger_2.mid.bend = 10;
		this.r_finger_3.mid.bend = 10;
		this.r_finger_4.mid.bend = 10;

		this.r_finger_0.tip.bend = 10;
		this.r_finger_1.tip.bend = 10;
		this.r_finger_2.tip.bend = 10;
		this.r_finger_3.tip.bend = 10;
		this.r_finger_4.tip.bend = 10;

	} // Mannequin.constructor

	// Getter and setter for the bending motion (z-rotation) of the mannequin's body
	get bend() {
		return -this.body.z;
	}
	
	set bend(angle) {
		this.body.z = -angle;
	}

	// Getter and setter for the tilting motion (x-rotation) of the mannequin's body
	get tilt() {
		return this.body.x;
	}
	
	set tilt(angle) {
		this.body.x = angle;
	}

	// Getter and setter for the turning motion (y-rotation) of the mannequin's body
	get turn() {
		return this.body.y;
	}
	
	set turn(angle) {
		this.body.y = angle;
	}

	// Getter and setter for the entire posture of the mannequin, returning or setting the rotation in degrees
	get posture() {
		var posture = [
			[
				Number((this.body.position.x).toFixed(1)),
				Number((this.body.position.y).toFixed(1)),
				Number((this.body.position.z).toFixed(1)),
			],
			this.body.posture,
			this.torso.posture,
			this.head.posture,
			this.l_leg.posture,
			this.l_knee.posture,
			this.l_ankle.posture,
			this.r_leg.posture,
			this.r_knee.posture,
			this.r_ankle.posture,
			this.l_arm.posture,
			this.l_elbow.posture,
			this.l_wrist.posture,
			this.l_finger_0.posture,
			this.l_finger_1.posture,
			this.l_finger_2.posture,
			this.l_finger_3.posture,
			this.l_finger_4.posture,
			this.r_arm.posture,
			this.r_elbow.posture,
			this.r_wrist.posture,
			this.r_finger_0.posture,
			this.r_finger_1.posture,
			this.r_finger_2.posture,
			this.r_finger_3.posture,
			this.r_finger_4.posture,
		];
		return {
			version: MANNEQUIN_POSTURE_VERSION,
			data: posture,
		};
	} // Mannequin.posture

	set posture(posture) {
		if (posture.version != MANNEQUIN_POSTURE_VERSION)
			throw new MannequinPostureVersionError(posture.version);

		var i = 0;

		this.body.position.set(...posture.data[i++]);
		
		this.body.posture = posture.data[i++];
		this.torso.posture = posture.data[i++];
		this.head.posture = posture.data[i++];
		
		this.l_leg.posture = posture.data[i++];
		this.l_knee.posture = posture.data[i++];
		this.l_ankle.posture = posture.data[i++];
		
		this.r_leg.posture = posture.data[i++];
		this.r_knee.posture = posture.data[i++];
		this.r_ankle.posture = posture.data[i++];
		
		this.l_arm.posture = posture.data[i++];
		this.l_elbow.posture = posture.data[i++];
		this.l_wrist.posture = posture.data[i++];
		this.l_finger_0.posture = posture.data[i++];
		this.l_finger_1.posture = posture.data[i++];
		this.l_finger_2.posture = posture.data[i++];
		this.l_finger_3.posture = posture.data[i++];
		this.l_finger_4.posture = posture.data[i++];
		
		this.r_arm.posture = posture.data[i++];
		this.r_elbow.posture = posture.data[i++];
		this.r_wrist.posture = posture.data[i++];
		this.r_finger_0.posture = posture.data[i++];
		this.r_finger_1.posture = posture.data[i++];
		this.r_finger_2.posture = posture.data[i++];
		this.r_finger_3.posture = posture.data[i++];
		this.r_finger_4.posture = posture.data[i++];
	} // Mannequin.posture

	// Getter and setter for the posture as a JSON string
	get postureString() {
		return JSON.stringify(this.posture);
	}
	
	set postureString(string) {
		this.posture = JSON.parse(string);
	}

	// Method to export the mannequin as a PNG image
	exportPNG() {
		// Download the current canvas as a PNG image
		var a = document.createElement('a');
		a.href = renderer.domElement.toDataURL().replace("image/png", "image/octet-stream");
		a.download = 'Body-Posture.png';
		a.click();
	} // Mannequin.exportPNG
}



// Female class extends Mannequin to create a female mannequin with specific adjustments
class Female extends Mannequin {
	constructor(height = 0.95) {
		// Call the parent Mannequin constructor with feminine=true and a default height
		super(true, height);

		// Adjust the body position to suit a female figure
		this.body.position.y = 2.2;

		// Adjust the leg and ankle positions for a more feminine posture
		this.l_leg.straddle -= 4;
		this.r_leg.straddle -= 4;

		this.l_ankle.tilt -= 4;
		this.r_ankle.tilt -= 4;
	} // Female.constructor
} // Female

// Male class extends Mannequin to create a male mannequin with specific adjustments
class Male extends Mannequin {
	constructor(height = 1) {
		// Call the parent Mannequin constructor with feminine=false and a default height
		super(false, height);

		// Adjust the body position to suit a male figure
		this.body.position.y = 3.8;

		// Adjust the leg and ankle positions for a more masculine posture
		this.l_leg.straddle += 6;
		this.r_leg.straddle += 6;

		this.l_ankle.turn += 6;
		this.r_ankle.turn += 6;

		// Increase ankle tilt for a more masculine stance
		this.l_ankle.tilt += 6;
		this.r_ankle.tilt += 6;
	} // Male.constructor
} // Male

// Child class extends Mannequin to create a child mannequin with specific adjustments
class Child extends Mannequin {
	constructor(height = 0.65) {
		// Call the parent Mannequin constructor with feminine=false and a default height
		super(false, height);

		// Adjust the body position to suit a child's figure
		this.body.position.y = -12;

		// Adjust the arm positions for a smaller frame
		this.l_arm.straddle -= 2;
		this.r_arm.straddle -= 2;
	} // Child.constructor
} // Child

// Default colors for various body parts of the mannequin (most of these are redundant)
Mannequin.colors = [
	'rgb(235,235,235)', // head = 0
	'rgb(235,235,235)', // torso = 1
	'rgb(235,235,235)', // left upper arm = 2
	'rgb(235,235,235)', // right upper arm = 3
	'rgb(235,235,235)', // left lower arm = 4
	'rgb(235,235,235)', // right lower arm = 5
	'rgb(235,235,235)', // left hand = 6
	'rgb(235,235,235)', // right hand = 7
	'rgb(235,235,235)', // pelvis = 8
	'rgb(235,235,235)', // left upper leg = 9 
	'rgb(235,235,235)', // right upper leg = 10 
	'rgb(235,235,235)', // left lower leg = 11
	'rgb(235,235,235)', // right lower leg = 12
	'rgb(235,235,235)', // left foot = 13
	'rgb(235,235,235)', // right foot = 14
	'rgb(180,180,180)', // joints = 15
];

// Load textures for head and limbs
Mannequin.texHead = new THREE.TextureLoader().load("textures/head.png"); // A new head texture was created
//Mannequin.texLimb = new THREE.TextureLoader().load("textures/limb.png");

// Define the geometry for joints (spherical objects)
Mannequin.sphereGeometry = new THREE.IcosahedronGeometry(1, 3);

// Function to calculate a cosine-based lump for defining curved surfaces
// Params is an array of [ [u-min, u-max, v-min, v-max, 1/height], ...]
Mannequin.cossers = function (u, v, params) {
	function cosser(t, min, max) {
		if (t < min) t++;
		if (t > max) t--;
		if (min <= t && t <= max)
			return 0.5 + 0.5 * Math.cos((t - min) / (max - min) * 2 * Math.PI - Math.PI);
		return 0;
	}
	for (var i = 0, r = 1; i < params.length; i++)
		r += cosser(u, params[i][0], params[i][1]) * cosser(v, params[i][2], params[i][3]) / params[i][4];
	return r;
} // Mannequin.cossers

// Function to blend between two postures, useful for animations
Mannequin.blend = function (posture0, posture1, k) {
	if (posture0.version != posture1.version)
		throw 'Incompatible posture blending.';

	function lerp(data0, data1, k) {
		if (data0 instanceof Array) {
			var result = [];
			for (var i in data0)
				result.push(lerp(data0[i], data1[i], k));
			return result;
		} else {
			return data0 * (1 - k) + k * data1;
		}
	}

	return {
		version: posture1.version,
		data: lerp(posture0.data, posture1.data, k)
	};
} // Mannequin.blend



// Function to convert posture data from version 6 to version 7
Mannequin.convert6to7 = function(posture) {
	// Structure of the posture data for versions 6 and 7:
	// 0:y 1:body 2:torso 3:head
	// 4:l_leg 5:l_knee 6:l_ankle 
	// 7:r_leg 8:r_knee 9:r_ankle
	// 10:l_arm 11:l_elbow 12:l_wrist 13:l_fingers
	// 14:r_arm 15:r_elbow 16:r_wrist 17:r_fingers
	
	// Example of posture data structure for version 6 and version 7:
	// Version 6:
	// {"version": 6, "data": [
	//		0, [1,1,1], [2,2,2], [3,3,3],
	//		[4,4,4], [5], [6,6,6],
	//		[7,7,7], [8], [9,9,9],
	//		[10,10,10], [11], [12,12,12], [13,13],
	//		[14,14,14], [15], [16,16,16], [17,17]
	// ]}
	
	// Version 7:
	// {"version":7, "data": [
	//		0, [1,1,1], [2,2,2], [3,3,3],
	//		[4,4,4], [5], [6,6,6],
	//		[7,7,7], [8], [9,9,9],
	//		[10,10,10],[11],[12,12,12],[-90,75,0,10,0,10],[0,10,0,10,0,10],[0,10,0,10,0,10],[0,10,0,10,0,10],[0,10,0,10,0,10],
	//		[-7,0.6,-5],[15],[-5,0,0],[90,75,0,10,0,10],[0,10,0,10,0,10],[0,10,0,10,0,10],[0,10,0,10,0,10],[0,10,0,10,0,10]
	// ]}
	
	var data = [];

	// Copy the first 13 elements (body parts) from the old posture data
	for (var i = 0; i <= 12; i++)
		data.push(posture.data[i]);
	
	// Convert finger data from version 6 to version 7 format
	var a = posture.data[13][0], // Get the first value from the 14th element (l_fingers)
		b = posture.data[13][1];  // Get the second value from the 14th element (l_fingers)
		
	for (var i = 0; i < 5; i++) // Add the new finger data format for each finger
		data.push([0, a, 0, b / 2, 0, b / 2]);
	
	// Copy the next 3 elements (arm and wrist) directly from the old posture data
	for (var i = 14; i <= 16; i++)
		data.push(posture.data[i]);
	
	// Convert the right fingers data in the same way as left fingers
	a = posture.data[17][0], // Get the first value from the 18th element (r_fingers)
	b = posture.data[17][1];  // Get the second value from the 18th element (r_fingers)
		
	for (var i = 0; i < 5; i++) // Add the new finger data format for each finger
		data.push([0, a, 0, b / 2, 0, b / 2]);
	
	return { version: 7, data: data }; // Return the updated posture data in version 7 format
}

// Global variable to track the button that was clicked
var clickedButton;







// ----------------------------------
// Newly Added Code
// ----------------------------------

// Function to add a circle to the DOM and move it with the mouse
function addCircle(event) {
	event.stopPropagation(); // Prevent the event from bubbling up
	var circle = document.getElementById("circle");
	document.body.addEventListener("mousemove", function(e) {
		circle.style.left = e.clientX + "px"; // Move the circle to follow the mouse's X position
		circle.style.top = e.clientY + "px";  // Move the circle to follow the mouse's Y position
	});
	circle.style.display = 'block'; // Display the circle
	setTimeout(setCircleVisibleToTrue, 1); // Set the circle visibility flag to true
}

// Function to remove the circle from the DOM
function removeCircle() {
	if (circleVisible) { // Check if the circle is visible
		var circle = document.getElementById("circle");
		circle.style.display = 'none'; // Hide the circle
		setTimeout(setCircleVisibleToFalse, 0); // Set the circle visibility flag to false
	}
}

// Helper function to set the circleVisible flag to true
function setCircleVisibleToTrue() {
	circleVisible = true;
}

// Helper function to set the circleVisible flag to false
function setCircleVisibleToFalse() {
	circleVisible = false;
}

// Function to refresh the page
function refresh() {
	location.reload();
}

// Event listener to detect clicks on the document
document.addEventListener('click', function(event) {
	if (circleVisible) { // If the circle is visible, proceed with object selection
        event.preventDefault(); // Prevent the default click action
        var mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1; // Calculate the normalized mouse X coordinate
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // Calculate the normalized mouse Y coordinate
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera); // Create a ray from the camera to the mouse position

        var intersects = raycaster.intersectObjects(scene.children, true); // Get the objects intersected by the ray
        if (intersects.length > 0) { // If there are intersected objects, proceed
            var intersectedObject = intersects[0].object; // Get the first intersected object
			var color = intersectedObject.material.color; // Get the object's current color
			// Check if the object is of type 'ParametricGeometry' and its color channels are not equal
			if (intersectedObject.geometry.type == 'ParametricGeometry' && color.r != color.g && color.r != color.b) {
				intersectedObject.material.color.setStyle('rgb(235,235,235)'); // Change the color to a neutral color
				renderer.render(scene, camera); // Re-render the scene to apply the color change
				addCircle(event); // Add the circle to the screen
			}
        }
    }
});

// Function to change the color of the selected body part if it's not a ball joint or a fingernail
function changeColour(button) {
	// Check if a body part is selected and it's of type 'ParametricGeometry'
	if (selectedBodyPart && selectedBodyPart.geometry.type == 'ParametricGeometry') {
		var color = window.getComputedStyle(button).backgroundColor; // Get the color from the button's style
		selectedBodyPart.material.color.setStyle(color); // Apply the new color to the selected body part
		renderer.render(scene, camera); // Re-render the scene to apply the color change
	}
}
