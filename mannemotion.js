// Added comments
// mannemotion.js

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Camera } from '@mediapipe/camera_utils';
import { Pose } from '@mediapipe/pose';

let camera, scene, renderer, model, controls;

// Initialize MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

pose.onResults(onResults);

// Initialize camera feed
const videoElement = document.getElementsByClassName('input_video')[0];
const cameraFeed = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});
console.log('camera on');
cameraFeed.start();

// Set up the Three.js scene
function init() {
  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 180);

  scene = new THREE.Scene();
  scene.background = new THREE.Color('rgb(204,233,229)');

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style = 'width:100%; height:100%; position:fixed; top:0; left:0;';
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const light = new THREE.PointLight('white', 0.5);
  light.position.set(0, 100, 50);
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.castShadow = true;
  scene.add(light, new THREE.AmbientLight('white', 0.5));

  // Load the mannequin model
  addModel();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 10;
  controls.maxDistance = 500;

  animate();
}

function addModel() {
  model = new Male();  // Assuming 'Male' is the class for the mannequin
  scene.add(model);
}

function onResults(results) {
  if (!results.poseLandmarks) {
    return;
  }

  // Map MediaPipe Pose landmarks to mannequin joints
  updateMannequinPose(results.poseLandmarks);
}

function updateMannequinPose(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // Example: Update left arm
  model.l_arm.raise = calculateAngle(leftShoulder, leftElbow);
  model.l_elbow.bend = calculateAngle(leftElbow, leftWrist);

  // Example: Update right arm
  model.r_arm.raise = calculateAngle(rightShoulder, rightElbow);
  model.r_elbow.bend = calculateAngle(rightElbow, rightWrist);

  // Example: Update left leg
  model.l_leg.raise = calculateAngle(leftHip, leftKnee);
  model.l_knee.bend = calculateAngle(leftKnee, leftAnkle);

  // Example: Update right leg
  model.r_leg.raise = calculateAngle(rightHip, rightKnee);
  model.r_knee.bend = calculateAngle(rightKnee, rightAnkle);

  renderer.render(scene, camera);
}

function calculateAngle(joint1, joint2) {
  const dx = joint2.x - joint1.x;
  const dy = joint2.y - joint1.y;
  const dz = joint2.z - joint1.z;
  return Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Initialize the scene
init();