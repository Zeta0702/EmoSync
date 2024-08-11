// Initialize the selected body part to null
var selectedBodyPart = null;

// Define a small constant value for precision comparisons
const EPS = 0.00001;

// Unused variables for different interfaces (commented out)
// var mouseInterface = false;
// var touchInterface = false;

// Create a scene with enhanced shadows
createScene();

// Remove the existing light from the scene
scene.remove(light);

// Set the shadow mapping type to PCFSoftShadowMap for softer shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Re-add a light to the scene using a SpotLight for better compatibility with older GPUs
var light = new THREE.SpotLight('white', 0.5);
light.position.set(0, 100, 50); // Set the position of the light
light.penumbra = 1; // Set the penumbra for a softer edge to the light's shadow
light.shadow.mapSize.width = Math.min(4 * 1024, renderer.capabilities.maxTextureSize / 2); // Adjust shadow map size based on GPU capability
light.shadow.mapSize.height = light.shadow.mapSize.width; // Keep the shadow map square
light.shadow.radius = 2; // Increase the shadow's blur radius for smoother shadows
light.castShadow = true; // Enable shadow casting for the light
scene.add(light); // Add the light to the scene

// Set up orbit controls to allow camera manipulation via mouse
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.minDistance = 10; // Set the minimum zoom distance
controls.maxDistance = 500; // Set the maximum zoom distance

// Create a gauge indicator using a mesh with circle geometry
var gauge = new THREE.Mesh(
		new THREE.CircleGeometry(10, 32, 9 / 4 * Math.PI, Math.PI / 2), // Create a circular gauge
		new THREE.MeshPhongMaterial({
			side: THREE.DoubleSide, // Make the material render on both sides
			color: 'blue', // Set the gauge color to blue
			transparent: true, // Enable transparency
			opacity: 0.75, // Set the opacity
			alphaMap: gaugeTexture() // Apply a custom texture for the gauge
		})
	),
	gaugeMaterial = new THREE.MeshBasicMaterial({
		color: 'navy' // Set the gauge material color to navy
	});
	
// Add additional elements to the gauge
gauge.add(new THREE.Mesh(new THREE.TorusGeometry(10, 0.1, 8, 32, Math.PI / 2).rotateZ(Math.PI / 4), gaugeMaterial)); // Add a torus shape
gauge.add(new THREE.Mesh(new THREE.ConeGeometry(0.7, 3, 6).translate(-10, 0, 0).rotateZ(5 * Math.PI / 4), gaugeMaterial)); // Add a cone shape
gauge.add(new THREE.Mesh(new THREE.ConeGeometry(0.7, 3, 6).translate(10, 0, 0).rotateZ(3 * Math.PI / 4), gaugeMaterial)); // Add another cone shape

// Function to generate the texture for the gauge
function gaugeTexture(size = 256) {
	// Create a canvas to draw the gauge texture
	var canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	var r = size / 2; // Calculate the radius

	// Get the 2D context of the canvas for drawing
	var ctx = canvas.getContext('2d');
	ctx.fillStyle = 'black'; // Set the background color to black
	ctx.fillRect(0, 0, size, size); // Fill the entire canvas

	// Create a radial gradient for the gauge
	var grd = ctx.createRadialGradient(r, r, r / 2, r, r, r);
	grd.addColorStop(0, "black"); // Start the gradient with black
	grd.addColorStop(1, "gray");  // End the gradient with gray

	// Fill the canvas with the gradient
	ctx.fillStyle = grd;
	ctx.fillRect(1, 1, size - 2, size - 2); // Fill with a slight padding

	// Define the arc angles for the gauge lines
	var start = Math.PI,
		end = 2 * Math.PI;

	// Draw concentric circles on the gauge
	ctx.strokeStyle = 'white'; // Set the stroke color to white
	ctx.lineWidth = 1; // Set the line width
	ctx.beginPath();
	for (var rr = r; rr > 0; rr -= 25)
		ctx.arc(size / 2, size / 2, rr, start, end); // Draw arcs

	// Draw radial lines at intervals around the gauge
	for (var i = 0; i <= 12; i++) {
		ctx.moveTo(r, r);
		var a = start + i / 12 * (end - start);
		ctx.lineTo(r + r * Math.cos(a), r + r * Math.sin(a)); // Draw lines from center to outer edge
	}
	ctx.stroke(); // Apply the strokes

	// Create a texture from the canvas
	var texture = new THREE.CanvasTexture(canvas, THREE.UVMapping);
	texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Set the anisotropy level for better texture quality
	texture.repeat.set(1, 1); // Set the texture repeat

	return texture; // Return the generated texture
}

// Array to name body parts and their corresponding motions
var names = [
	['body', 'tilt', 'turn', 'bend'],
	['pelvis', 'tilt', 'turn', 'bend'],
	['torso', 'tilt', 'turn', 'bend'],
	['neck', 'tilt', 'turn', 'nod'],
	['head', 'tilt', 'turn', 'nod'],
	['l_leg', 'straddle', 'turn', 'raise'],
	['l_knee', '', '', 'bend'],
	['l_ankle', 'tilt', 'turn', 'bend'],
	['l_arm', 'straddle', 'turn', 'raise'],
	['l_elbow', '', '', 'bend'],
	['l_wrist', 'tilt', 'turn', 'bend'],
	['l_finger_0', 'straddle', 'turn', 'bend'],
	['l_finger_1', 'straddle', '', 'bend'],
	['l_finger_2', 'straddle', '', 'bend'],
	['l_finger_3', 'straddle', '', 'bend'],
	['l_finger_4', 'straddle', '', 'bend'],
	['l_mid_0', '', '', 'bend'],
	['l_mid_1', '', '', 'bend'],
	['l_mid_2', '', '', 'bend'],
	['l_mid_3', '', '', 'bend'],
	['l_mid_4', '', '', 'bend'],
	['l_tip_0', '', '', 'bend'],
	['l_tip_1', '', '', 'bend'],
	['l_tip_2', '', '', 'bend'],
	['l_tip_3', '', '', 'bend'],
	['l_tip_4', '', '', 'bend'],
	['r_leg', 'straddle', 'turn', 'raise'],
	['r_knee', '', '', 'bend'],
	['r_ankle', 'tilt', 'turn', 'bend'],
	['r_arm', 'straddle', 'turn', 'raise'],
	['r_elbow', '', '', 'bend'],
	['r_wrist', 'tilt', 'turn', 'bend'],
	['r_finger_0', 'straddle', 'turn', 'bend'],
	['r_finger_1', 'straddle', '', 'bend'],
	['r_finger_2', 'straddle', '', 'bend'],
	['r_finger_3', 'straddle', '', 'bend'],
	['r_finger_4', 'straddle', '', 'bend'],
	['r_mid_0', '', '', 'bend'],
	['r_mid_1', '', '', 'bend'],
	['r_mid_2', '', '', 'bend'],
	['r_mid_3', '', '', 'bend'],
	['r_mid_4', '', '', 'bend'],
	['r_tip_0', '', '', 'bend'],
	['r_tip_1', '', '', 'bend'],
	['r_tip_2', '', '', 'bend'],
	['r_tip_3', '', '', 'bend'],
	['r_tip_4', '', '', 'bend'],
];



// Array to hold all the models added to the scene
var models = [];

// Variable to hold the currently active model
var model = null;

// Function to add a new model to the scene
function addModel() {
	// Create a new Male model
	model = new Male();
	
	// Add the model to the models array
	models.push(model);
	
	// Link the finger mid joints to more descriptive names for easy access
	model.l_mid_0 = model.l_finger_0.mid;
	model.l_mid_1 = model.l_finger_1.mid;
	model.l_mid_2 = model.l_finger_2.mid;
	model.l_mid_3 = model.l_finger_3.mid;
	model.l_mid_4 = model.l_finger_4.mid;
	
	model.r_mid_0 = model.r_finger_0.mid;
	model.r_mid_1 = model.r_finger_1.mid;
	model.r_mid_2 = model.r_finger_2.mid;
	model.r_mid_3 = model.r_finger_3.mid;
	model.r_mid_4 = model.r_finger_4.mid;
	
	// Link the finger tip joints to more descriptive names for easy access
	model.l_tip_0 = model.l_finger_0.tip;
	model.l_tip_1 = model.l_finger_1.tip;
	model.l_tip_2 = model.l_finger_2.tip;
	model.l_tip_3 = model.l_finger_3.tip;
	model.l_tip_4 = model.l_finger_4.tip;
	
	model.r_tip_0 = model.r_finger_0.tip;
	model.r_tip_1 = model.r_finger_1.tip;
	model.r_tip_2 = model.r_finger_2.tip;
	model.r_tip_3 = model.r_finger_3.tip;
	model.r_tip_4 = model.r_finger_4.tip;
	
	// Loop through the names array and assign the names to the corresponding body parts
	for (var nameData of names) {
		var name = nameData[0];
		// Set the name for each child part of the model's body part
		for (var part of model[name].children[0].children)
			part.name = name;
		for (var part of model[name].children[0].children[0].children)
			part.name = name;
		if (model[name].children[0].children[1])
			for (var part of model[name].children[0].children[1].children)
				part.name = name;
		
		// Assign the UI names (x, y, z) to the model's body part for reference
		model[name].nameUI = {
			x: nameData[1],
			y: nameData[2],
			z: nameData[3]
		};
	}
	
	// Add the model to the scene and render it
	scene.add(model);
	renderer.render(scene, camera);
}

// Call the addModel function to add a model to the scene immediately
addModel();

// Set up an animation loop to continuously render the scene
var animation = requestAnimationFrame(animate);
function animate() {
	animation = requestAnimationFrame(animate);
	renderer.render(scene, camera);
}

// Variables to handle mouse interaction with the scene
var mouse = new THREE.Vector2(), // 2D vector to store mouse position
	mouseButton = undefined, // Variable to store the state of pressed mouse buttons
	raycaster = new THREE.Raycaster(), // Raycaster to detect intersections with objects in the scene
	dragPoint = new THREE.Mesh(), // Mesh to represent the point of interaction (dragging)
	obj = undefined; // Variable to store the currently selected body part

// Variables to reference various UI elements (checkboxes and buttons)
var cbInverseKinematics = document.getElementById('inverse-kinematics'),
	cbBiologicalConstraints = document.getElementById('biological-constraints'),
	cbRotZ = document.getElementById('rot-z'),
	cbRotX = document.getElementById('rot-x'),
	cbRotY = document.getElementById('rot-y'),
	cbMovX = document.getElementById('mov-x'),
	cbMovY = document.getElementById('mov-y'),
	cbMovZ = document.getElementById('mov-z'),
	btnExportPosture = document.getElementById('ep');

// Set up event handlers for user interactions
document.addEventListener('pointerdown', onPointerDown);
document.addEventListener('pointerup', onPointerUp);
document.addEventListener('pointermove', onPointerMove);

// Event listeners for the rotation and movement checkboxes to handle user input
cbRotZ.addEventListener('click', processCheckBoxes);
cbRotX.addEventListener('click', processCheckBoxes);
cbRotY.addEventListener('click', processCheckBoxes);
cbMovX.addEventListener('click', processCheckBoxes);
cbMovY.addEventListener('click', processCheckBoxes);
cbMovZ.addEventListener('click', processCheckBoxes);

// Event listener for exporting the posture of the model
btnExportPosture.addEventListener('click', exportPosture);

// Event listeners to start and stop animation when the user interacts with the scene via controls
controls.addEventListener('start', function () {
	renderer.setAnimationLoop(drawFrame); // Start the animation loop when interaction begins
});

controls.addEventListener('end', function () {
	renderer.setAnimationLoop(null); // Stop the animation loop when interaction ends
	renderer.render(scene, camera); // Render the final frame after interaction
});



// Event listener for window resize to re-render the scene and camera
window.addEventListener('resize', function () {
	renderer.render(scene, camera); // Re-render the scene when the window is resized
});

// Function to process checkbox selections for rotation and movement controls
function processCheckBoxes(event) {
	if (event) {
		if (event.target.checked) {
			// Uncheck all rotation and movement checkboxes except the one that was clicked
			cbRotX.checked = cbRotY.checked = cbRotY.checked = cbRotZ.checked = cbMovX.checked = cbMovY.checked = cbMovZ.checked = false;
			event.target.checked = true; // Keep the clicked checkbox checked
		}
	}

	// If no object is selected, exit the function
	if (!obj) return;

	// Set the rotation order based on which checkbox is checked
	if (cbRotZ.checked) {
		obj.rotation.reorder('XYZ');
	}
	
	if (cbRotX.checked) {
		obj.rotation.reorder('YZX');
	}
	
	if (cbRotY.checked) {
		obj.rotation.reorder('ZXY');
	}
}

// Event handler for mouse/touch release (pointer up)
function onPointerUp(event) {
	controls.enabled = true; // Re-enable controls
	mouseButton = undefined; // Reset the mouse button state
	deselect(); // Deselect the current object
	renderer.setAnimationLoop(null); // Stop the animation loop
	renderer.render(scene, camera); // Render the scene after the pointer is released
}

// Function to select an object in the scene
function select(object) {
	deselect(); // Deselect any previously selected object
	obj = object; // Set the selected object
	obj?.select(true); // Call the select method on the object (if defined)
}

// Function to deselect the currently selected object
function deselect() {
	gauge.parent?.remove(gauge); // Remove the gauge from its parent (if it has one)
	obj?.select(false); // Deselect the object (if defined)
	obj = undefined; // Clear the selected object
}

// Event handler for mouse/touch press (pointer down)
function onPointerDown(event) {
    userInput(event); // Handle user input

    // Remove the gauge and drag point from their parents (if they have one)
    gauge.parent?.remove(gauge);
    dragPoint.parent?.remove(dragPoint);

    raycaster.setFromCamera(mouse, camera); // Set the raycaster based on the mouse position

    var intersects = raycaster.intersectObjects(models, true); // Find objects intersected by the ray

    // If an object is intersected, process the selection
    if (intersects.length && (intersects[0].object.name || intersects[0].object.parent.name)) {
        controls.enabled = false; // Disable controls while interacting with the object

        var scanObj;
        for (scanObj = intersects[0].object; !(scanObj instanceof Mannequin) && !(scanObj instanceof THREE.Scene); scanObj = scanObj?.parent) {
        }

        if (scanObj instanceof Mannequin) model = scanObj; // Set the model if it's a Mannequin

        var name = intersects[0].object.name || intersects[0].object.parent.name; // Get the object's name

        // Map certain names to different body parts
        if (name == 'neck') name = 'head';
        if (name == 'pelvis') name = 'body';

        // If the circle indicator is not visible, select the model's body part
        if (!circleVisible) {
            select(model[name]);
        }

        // Update the UI with the selected part's rotation information
        document.getElementById('rot-x-name').innerHTML = model[name].nameUI.x || 'N/A';
        document.getElementById('rot-y-name').innerHTML = model[name].nameUI.y || 'N/A';
        document.getElementById('rot-z-name').innerHTML = model[name].nameUI.z || 'N/A';

		// Conditionally display or hide rotation controls based on the availability of rotation axes
		if (document.getElementById('rot-x-name').innerHTML == 'N/A') {
			document.getElementById('rot-x-name').style.display = 'none';
			document.getElementById('rot-x').style.display = 'none';
			document.getElementById('x').style.display = 'none';
		} else {
			document.getElementById('rot-x-name').style.display = 'inline-block';
			document.getElementById('rot-x').style.display = 'inline-block';
			document.getElementById('x').style.display = 'inline-block';
		}

		if (document.getElementById('rot-y-name').innerHTML == 'N/A') {
			document.getElementById('rot-y-name').style.display = 'none';
			document.getElementById('rot-y').style.display = 'none';
			document.getElementById('y').style.display = 'none';
		} else {
			document.getElementById('rot-y-name').style.display = 'inline-block';
			document.getElementById('rot-y').style.display = 'inline-block';
			document.getElementById('y').style.display = 'inline-block';
		}
		
        // Update the selected body part
        selectedBodyPart = intersects[0].object; // Store the selected body part

        if (obj) { // Ensure obj is defined before using it
            dragPoint.position.copy(obj.worldToLocal(intersects[0].point)); // Set the drag point position relative to the selected object
            obj.imageWrapper.add(dragPoint); // Add the drag point to the object's image wrapper

            // If no movement checkbox is checked, add the gauge to the object
            if (!cbMovX.checked && !cbMovY.checked && !cbMovZ.checked) obj.imageWrapper.add(gauge);
            gauge.position.y = (obj instanceof Ankle) ? 2 : 0; // Adjust gauge position based on the object type

            processCheckBoxes(); // Process checkboxes to adjust rotation order
        }
    }
    renderer.setAnimationLoop(drawFrame); // Start the animation loop
}



// Function to rotate or translate a joint relative to its current position/rotation
function relativeTurn(joint, rotationalAngle, angle) {
	// Check if the rotationalAngle is actually a translation (starts with 'position.')
	if (rotationalAngle.startsWith('position.')) {
		// Extract the position axis (e.g., 'x', 'y', or 'z') from the string
		rotationalAngle = rotationalAngle.split('.').pop();
		// Apply the translation to the joint's position
		joint.position[rotationalAngle] += angle;
		return;
	}

	// Check if the joint has a function to determine biological impossibility
	if (joint.biologicallyImpossibleLevel) {
		// If biological constraints are enabled, perform a check before applying the rotation
		if (cbBiologicalConstraints.checked) {
			// Store the initial impossibility level
			var oldImpossibility = joint.biologicallyImpossibleLevel();

			// Apply the rotation to the joint
			joint[rotationalAngle] += angle;
			joint.updateMatrix(); // Update the joint's transformation matrix
			joint.updateWorldMatrix(true); // Ensure the world matrix is updated

			// Calculate the new impossibility level after rotation
			var newImpossibility = joint.biologicallyImpossibleLevel();

			// If the new impossibility level is worse or unchanged, undo the rotation
			if (newImpossibility > EPS && newImpossibility >= oldImpossibility - EPS) {
				joint[rotationalAngle] -= angle;
				return;
			}
		} else {
			// If biological constraints are not checked, apply the rotation directly
			joint.biologicallyImpossibleLevel(); // Call the function for any necessary internal updates
			joint[rotationalAngle] += angle;
		}
		// Keep the rotation if it's either possible or improves an impossible situation
	} else {
		// If no biological impossibility function, use predefined min/max rotation ranges

		var val = joint[rotationalAngle] + angle,
			min = joint.minRot[rotationalAngle], // Minimum allowed rotation
			max = joint.maxRot[rotationalAngle]; // Maximum allowed rotation

		// If biological constraints are checked or min == max (fixed joint), perform checks
		if (cbBiologicalConstraints.checked || min == max) {
			if (val < min - EPS && angle < 0) return; // Prevent under-rotation
			if (val > max + EPS && angle > 0) return; // Prevent over-rotation
			if (min == max) return; // Prevent any rotation for a fixed joint
		}

		// Apply the rotation if within valid range
		joint[rotationalAngle] = val;
	}
	joint.updateMatrix(); // Update the joint's transformation matrix
}

// Function to calculate the effectiveness of a 2D kinematic adjustment
function kinematic2D(joint, rotationalAngle, angle, ignoreIfPositive) {
	// Swap Z<->X for wrist joints to align with anatomical axes
	if (joint instanceof Wrist) {
		if (rotationalAngle == 'x') rotationalAngle = 'z';
		else if (rotationalAngle == 'z') rotationalAngle = 'x';
	}

	// Get the screen position of the drag point
	var screenPoint = new THREE.Vector3().copy(dragPoint.position);
	screenPoint = obj.localToWorld(screenPoint).project(camera); // Project into screen space

	var distOriginal = mouse.distanceTo(screenPoint), // Original distance to mouse
		oldAngle = joint[rotationalAngle]; // Store the original rotation angle

	if (joint instanceof Head) { // Special case for head and neck joints
		oldParentAngle = joint.parentJoint[rotationalAngle]; // Store the parent's original rotation
		relativeTurn(joint, rotationalAngle, angle / 2); // Apply half the rotation to the joint
		relativeTurn(joint.parentJoint, rotationalAngle, angle / 2); // Apply half the rotation to the parent joint
		joint.parentJoint.updateMatrixWorld(true); // Update world matrices
	} else {
		relativeTurn(joint, rotationalAngle, angle); // Apply full rotation to the joint
	}
	joint.updateMatrixWorld(true); // Update world matrices

	// Calculate the new screen position after rotation
	screenPoint.copy(dragPoint.position);
	screenPoint = obj.localToWorld(screenPoint).project(camera); // Project into screen space again

	var distProposed = mouse.distanceTo(screenPoint), // Proposed new distance to mouse
		dist = distOriginal - distProposed; // Calculate the change in distance

	// If the new distance is an improvement and we are ignoring positive changes, return the improvement
	if (ignoreIfPositive && dist > 0) return dist;

	// If the change was not an improvement, revert the joint's rotation to the original state
	joint[rotationalAngle] = oldAngle;
	if (joint instanceof Head) { // Revert parent's rotation for head/neck
		joint.parentJoint[rotationalAngle] = oldParentAngle;
	}
	joint.updateMatrixWorld(true); // Update world matrices

	return dist; // Return the change in distance (positive if improved, negative if worse)
}

// Function to perform inverse kinematics on a joint
function inverseKinematics(joint, rotationalAngle, step) {
	// Try small positive and negative adjustments to see which improves the kinematics
	var kPos = kinematic2D(joint, rotationalAngle, 0.001),
		kNeg = kinematic2D(joint, rotationalAngle, -0.001);

	// If either adjustment improves the kinematics, apply the larger improvement
	if (kPos > 0 || kNeg > 0) {
		if (kPos < kNeg) step = -step; // Choose the direction that offers the better improvement
		kinematic2D(joint, rotationalAngle, step, true); // Apply the adjustment
	}
}


// Function to handle the animation loop and apply inverse kinematics to the selected object
function animate(time) {
	// If no object is selected or no mouse button is pressed, exit the function
	if (!obj || !mouseButton) return;

	// Determine if no specific rotation or movement checkbox is selected
	var elemNone = !cbRotZ.checked && !cbRotX.checked && !cbRotY.checked && !cbMovX.checked && !cbMovY.checked && !cbMovZ.checked,
		spinA = (obj instanceof Ankle) ? Math.PI / 2 : 0; // Adjust rotation for Ankle joints

	// Set the gauge rotation based on the selected checkbox or default to Z rotation
	gauge.rotation.set(0, 0, -spinA);
	if (cbRotX.checked || elemNone && mouseButton & 0x2) gauge.rotation.set(0, Math.PI / 2, 2 * spinA); // X rotation
	if (cbRotY.checked || elemNone && mouseButton & 0x4) gauge.rotation.set(Math.PI / 2, 0, -Math.PI / 2); // Y rotation

	// Determine the joint to manipulate: body for movement, selected object for rotation
	var joint = (cbMovX.checked || cbMovY.checked || cbMovZ.checked) ? model.body : obj;

	// Loop through decreasing step sizes to incrementally adjust the joint
	do {
		for (var step = 5; step > 0.1; step *= 0.75) {
			// Apply inverse kinematics for rotation or movement based on the selected checkbox or default to Z rotation
			if (cbRotZ.checked || elemNone && (mouseButton & 0x1))
				inverseKinematics(joint, 'z', step);
			if (cbRotX.checked || elemNone && (mouseButton & 0x2))
				inverseKinematics(joint, 'x', step);
			if (cbRotY.checked || elemNone && (mouseButton & 0x4))
				inverseKinematics(joint, 'y', step);

			if (cbMovX.checked)
				inverseKinematics(joint, 'position.x', step);
			if (cbMovY.checked)
				inverseKinematics(joint, 'position.y', step);
			if (cbMovZ.checked)
				inverseKinematics(joint, 'position.z', step);
		}

		// Move to the parent joint and continue if inverse kinematics is enabled
		joint = joint.parentJoint;
	}
	while (joint && !(joint instanceof Mannequin) && !(joint instanceof Pelvis) && !(joint instanceof Torso) && cbInverseKinematics.checked);
}

// Event handler for pointer (mouse) movement
function onPointerMove(event) {
	if (obj) userInput(event); // Update mouse position if an object is selected
}

// Function to process user input and update the mouse position
function userInput(event) {
	event.preventDefault(); // Prevent the default action of the event

	mouseButton = event.buttons || 0x1; // Get the mouse button state

	// Calculate normalized mouse coordinates for use in raycasting
	mouse.x = event.clientX / window.innerWidth * 2 - 1;
	mouse.y = -event.clientY / window.innerHeight * 2 + 1;
}

// Function to display the current posture of the model in a prompt
function getPosture() {
	if (!model) return; // Exit if no model is selected
	
	// Show the current posture string in a prompt, allowing the user to copy it
	prompt('The current posture is shown below. Copy it to the clipboard.', model.postureString);
}

// Function to set the model's posture from a user-provided string
function setPosture() {
	if (!model) return; // Exit if no model is selected
	
	// Prompt the user to input a posture string to reset the model's posture
	var string = prompt('Reset the posture to:', '{"version":7,"data":["0,[0,0,0],...]}');

	if (string) {
		var oldPosture = model.posture; // Store the current posture in case of error

		try {
			model.postureString = string; // Attempt to set the new posture from the string
		} catch (error) {
			// If an error occurs, revert to the old posture and alert the user
			model.posture = oldPosture;
			if (error instanceof MannequinPostureVersionError)
				alert(error.message);
			else
				alert('The provided posture was either invalid or impossible to understand.');
			console.error(error); // Log the error for debugging
		}
		renderer.render(scene, camera); // Re-render the scene to reflect changes
	}
}

// Function to export the current posture of the model as a PNG image
function exportPosture() {
	if (!model) return; // Exit if no model is selected
	
	console.log(models); // Log the models array for debugging
	model.exportPNG('mannequin.png', models); // Export the model as a PNG image
}

// Function to remove the currently selected model from the scene
function removeModel() {
	if (!model) return; // Exit if no model is selected
	scene.remove(model); // Remove the model from the scene
	models = models.filter(x => x != model); // Remove the model from the models array
	
	// Update the currently selected model to the first model in the array, or null if empty
	if (models.length > 0)
		model = models[0];
	else
		model = null;

	renderer.render(scene, camera); // Re-render the scene to reflect changes
}