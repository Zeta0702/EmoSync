// Declare variables to hold the pose landmarker instance, detected pose landmarks, video capture element, and other necessary state data
let myPoseLandmarker;  // This will hold the PoseLandmarker object for detecting pose landmarks
let poseLandmarks;  // This will store the detected landmarks from the video feed
let myCapture;  // This will be the p5.js video capture element
let lastVideoTime = -1;  // Used to track the time of the last processed video frame
let colors = [];  // Array to store color values used in the visualization
let currentText = '';  // Variable to hold the current emotion text displayed on the screen

// Configuration object for pose tracking
const trackingConfig = {
  doAcquirePoseLandmarks: true,  // Flag to determine if pose landmarks should be acquired
  poseModelLiteOrFull: "lite",  // Choose between the "lite" (3MB) or "full" (6MB) model for pose detection
  cpuOrGpuString: "GPU",  // Choose whether to use GPU or CPU for processing
  maxNumPoses: 1,  // Maximum number of poses to detect at once
};

// Preload function to load the necessary models and libraries before setup
async function preload() {
  // Import the necessary modules from the MediaPipe vision library
  const mediapipe_module = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"
  );

  // Assign the imported modules to variables for later use
  PoseLandmarker = mediapipe_module.PoseLandmarker;
  FilesetResolver = mediapipe_module.FilesetResolver;

  // Initialize the vision task resolver for loading models
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm"
  );

  // Check if pose landmarks should be acquired based on the trackingConfig
  if (trackingConfig.doAcquirePoseLandmarks) {
    // Define URLs for the lite and full pose models
    const poseModelLite =
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
    const poseModelFull =
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker_full/float16/1/pose_landmarker_full.task";
    
    // Choose the appropriate model based on the configuration
    let poseModel = poseModelLite;
    poseModel = trackingConfig.poseModelLiteOrFull == "full" ? poseModelFull : poseModelLite;
    
    // Create the PoseLandmarker instance with the selected model and settings
    myPoseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      numPoses: trackingConfig.maxNumPoses,
      runningMode: "VIDEO",  // Set the mode to "VIDEO" for real-time pose detection
      baseOptions: {
        modelAssetPath: poseModel,  // Path to the selected pose model
        delegate: trackingConfig.cpuOrGpuString,  // Use GPU or CPU for processing based on configuration
      },
    });
  }
}

// Function to predict pose landmarks from the webcam feed
async function predictWebcam() {
  let startTimeMs = performance.now();  // Get the current time in milliseconds
  
  // Only process a new frame if the video time has advanced
  if (lastVideoTime !== myCapture.elt.currentTime) {
    // If pose landmarks should be acquired and the pose landmarker is initialized
    if (trackingConfig.doAcquirePoseLandmarks && myPoseLandmarker) {
      // Detect pose landmarks for the current video frame
      poseLandmarks = myPoseLandmarker.detectForVideo(
        myCapture.elt,
        startTimeMs
      );
    }
    // Update the last video frame time to the current time
    lastVideoTime = myCapture.elt.currentTime;
  }
}

// Setup function to initialize the canvas, video capture, and colors
function setup() {
  // Create a canvas that spans the entire window
  createCanvas(windowWidth, windowHeight);
  
  // Capture video from the webcam
  myCapture = createCapture(VIDEO);
  myCapture.size(1920, 1080);  // Set the video resolution to 1920x1080
  myCapture.hide();  // Hide the default video element so it doesn't display directly

  // Define an array of colors to use in the visualization
  colors = [
    color(227, 118, 113),
    color(67, 79, 130),
    color(229, 127, 77),
    color(237, 169, 80),
    color(66, 114, 155),
    color(79, 174, 146),
    color(245, 219, 85),
    color(120, 194, 192),
    color(76, 164, 210),
    color(144, 90, 134),
    color(237, 171, 163),
  ];
}

// Draw function to render the video feed, predict landmarks, and display the detected emotions
function draw() {
  background("white");  // Set the background color to white
  drawVideoBackground();  // Draw the video feed as the background
  predictWebcam();  // Predict pose landmarks from the webcam feed
  drawPosePoints();  // Draw the detected pose points on the canvas

  // Update the emotion text on the page based on the detected emotion
  if (currentText) {
    document.getElementById('emotion-text').innerHTML = currentText;
  } else {
    document.getElementById('emotion-text').innerHTML = '';
  }
}

// Function to draw the video feed as the background with a mirrored effect
function drawVideoBackground() {
  push();  // Save the current drawing state
  translate(width, 0);  // Move the origin to the right edge of the canvas
  scale(-1, 1);  // Flip the video feed horizontally
  image(myCapture, 0, 0, width, height);  // Draw the video feed on the canvas
  pop();  // Restore the previous drawing state
}


//------------------------------------------
// Function to draw pose points and detect emotions based on the landmarks
function drawPosePoints() {
  // Check if pose landmark acquisition is enabled
  if (trackingConfig.doAcquirePoseLandmarks) {
    // Check if pose landmarks have been detected
    if (poseLandmarks && poseLandmarks.landmarks) {
      const nPoses = poseLandmarks.landmarks.length; // Get the number of detected poses
      if (nPoses > 0) {
        // Set up drawing properties
        fill("darkblue"); // Set the fill color for the joints
        noStroke(); // Disable outline for the joints

        // Iterate through each detected pose
        for (let h = 0; h < nPoses; h++) {
          let joints = poseLandmarks.landmarks[h]; // Get the landmarks for the current pose
          
          // List of joints to analyze and draw
          let list = [0, 11, 12, 13, 15, 14, 16, 23, 24, 25, 26, 27, 28];
          let activeList = []; // Placeholder for active joints (if needed)
          let realList = {}; // Object to store the (x, y) positions of each joint

          // Map the positions of the shoulders (joints 11 and 12)
          let x11 = map(joints[11].x, 0, 1, width, 0);
          let y11 = map(joints[11].y, 0, 1, 0, height);
          let x12 = map(joints[12].x, 0, 1, width, 0);
          let y12 = map(joints[12].y, 0, 1, 0, height);
          let rateDist = dist(x11, y11, x12, y12); // Calculate the distance between the shoulders

          // Iterate through the selected joints and map their positions
          for (let i = 0; i < list.length; i++) {
            let index = list[i];
            let x = map(joints[index].x, 0, 1, width, 0); // Map x-coordinate
            let y = map(joints[index].y, 0, 1, 0, height); // Map y-coordinate
            realList[index] = { x, y }; // Store the position in realList
            fill(236, 246, 246); // Set the fill color for the joint
            ellipse(x, y, 15, 15); // Draw the joint as a circle
            // fill(255, 25, 2)
            // text(index, x, y) // Uncomment to display the index of each joint
          }

          // Calculate the position of the neck (average of shoulder positions)
          realList[33] = {
            x: (x12 - x11) / 2 + x11,
            y: (y12 - y11) / 2 + y11 - rateDist / 5,
          };
          fill(236, 246, 246); // Set the fill color for the neck
          ellipse(realList[33].x, realList[33].y, 15, 15); // Draw the neck joint

          // Define variables for emotion detection
          let d = rateDist / 4; // Threshold distance for detecting emotions
          let joinPos = []; // Array to store joints to connect for drawing
          let c; // Color variable for the detected emotion

          // Emotion detection: "Angry" (Version 1)
          if (realList[13].x < realList[15].x - d
            && realList[14].x > realList[16].x + d
            && realList[23].y > realList[15].y + d
            && realList[24].y > realList[16].y + d
            && realList[23].x > realList[15].x
            && realList[24].x < realList[16].x
            && dist(realList[15].x, realList[15].y, realList[23].x, realList[23].y) < rateDist
            && dist(realList[16].x, realList[16].y, realList[24].x, realList[24].y) < rateDist
            && dist(realList[11].x, realList[11].y, realList[25].x, realList[25].y) > rateDist * 2
            && dist(realList[12].x, realList[12].y, realList[26].x, realList[26].y) > rateDist * 2
          ) {
            joinPos = [11, 12, 14, 16, 24, 23, 15, 13]; // Joints to connect for "Angry"
            c = color(208, 12, 15); // Set the color for "Angry"
            currentText = 'Angry'; // Set the emotion text to "Angry"
            document.getElementById('emotion-text').style.color = 'rgb(208,12,15)'; // Update the color of the displayed text
          }
          // Emotion detection: "Angry" (Version 2)
          else if (realList[13].x < realList[15].x - d
            && realList[14].x > realList[16].x + d
            && dist(realList[15].x, realList[15].y, realList[11].x, realList[11].y) < rateDist / 2
            && dist(realList[16].x, realList[16].y, realList[12].x, realList[12].y) < rateDist / 2
            && dist(realList[11].x, realList[11].y, realList[25].x, realList[25].y) > rateDist * 2
            && dist(realList[12].x, realList[12].y, realList[26].x, realList[26].y) > rateDist * 2
          ) {
            joinPos = [11, 12, 14, 13]; // Joints to connect for "Angry"
            c = color(208, 12, 15); // Set the color for "Angry"
            currentText = 'Angry'; // Set the emotion text to "Angry"
            document.getElementById('emotion-text').style.color = 'rgb(208,12,15)'; // Update the color of the displayed text
          }
          // Emotion detection: "Bored"
          else if (
            dist(realList[15].x, realList[15].y, realList[33].x, realList[33].y) < rateDist / 2
            && dist(realList[16].x, realList[16].y, realList[33].x, realList[33].y) < rateDist / 2
            && dist(realList[13].x, realList[13].y, realList[25].x, realList[25].y) < rateDist / 2
            && dist(realList[14].x, realList[14].y, realList[26].x, realList[26].y) < rateDist / 2
            && dist(realList[11].x, realList[11].y, realList[25].x, realList[25].y) < rateDist * 1.5
            && dist(realList[12].x, realList[12].y, realList[26].x, realList[26].y) < rateDist * 1.5
          ) {
            joinPos = [11, 12, 14, 13]; // Joints to connect for "Bored"
            c = color(241, 169, 161); // Set the color for "Bored"
            currentText = 'Bored'; // Set the emotion text to "Bored"
            document.getElementById('emotion-text').style.color = 'rgb(241, 169, 161)'; // Update the color of the displayed text
          }
          // Emotion detection: "Hopeless"
          else if (realList[13].x < realList[15].x - d
            && realList[14].x > realList[16].x + d
            && realList[23].y > realList[15].y + d
            && realList[24].y > realList[16].y + d
            && realList[23].x < realList[15].x
            && realList[24].x > realList[16].x
            && dist(realList[15].x, realList[15].y, realList[23].x, realList[23].y) < rateDist
            && dist(realList[16].x, realList[16].y, realList[24].x, realList[24].y) < rateDist
            && dist(realList[11].x, realList[11].y, realList[25].x, realList[25].y) > rateDist * 2
            && dist(realList[12].x, realList[12].y, realList[26].x, realList[26].y) > rateDist * 2
          ) {
            joinPos = [11, 12, 14, 16, 15, 13]; // Joints to connect for "Hopeless"
            c = color(30, 138, 194); // Set the color for "Hopeless"
            currentText = 'Hopeless'; // Set the emotion text to "Hopeless"
            document.getElementById('emotion-text').style.color = 'rgb(30, 138, 194)'; // Update the color of the displayed text
          }
          // Emotion detection: "Shame"
          else if (dist(realList[16].x, realList[16].y, realList[0].x, realList[0].y) < rateDist
            && realList[15].x > realList[23].x
            && realList[15].y < realList[23].y) {
            joinPos = [0, 16, 15, 13, 11]; // Joints to connect for "Shame"
            c = color(95, 52, 135); // Set the color for "Shame"
            currentText = 'Shame'; // Set the emotion text to "Shame"
            document.getElementById('emotion-text').style.color = 'rgb(95, 52, 135)'; // Update the color of the displayed text
          }
          // Emotion detection: "Fear"
          else if (realList[15].y < realList[11].y
            && realList[16].y < realList[12].y
            && dist(realList[15].x, realList[15].y, realList[11].x, realList[11].y) < rateDist
            && dist(realList[16].x, realList[16].y, realList[12].x, realList[12].y) < rateDist
          ) {
            joinPos = [0, 16, 14, 12, 11, 13, 15]; // Joints to connect for "Fear"
            c = color(30, 58, 146); // Set the color for "Fear"
            currentText = 'Fear'; // Set the emotion text to "Fear"
            document.getElementById('emotion-text').style.color = 'rgb(30, 58, 146)'; // Update the color of the displayed text
          }
          // Emotion detection: "Shock"
          else if (realList[15].x < realList[13].x
            && realList[16].x > realList[14].x
            && realList[15].y < realList[13].x
            && realList[16].y < realList[14].y
          ) {
            joinPos = [15, 16, 14, 24, 23, 13]; // Joints to connect for "Shock"
            c = color(88, 171, 227); // Set the color for "Shock"
            currentText = 'Shock'; // Set the emotion text to "Shock"
            document.getElementById('emotion-text').style.color = 'rgb(88, 171, 227)'; // Update the color of the displayed text
          }
          // Emotion detection: "Disgust" (Version 1)
          else if (realList[16].x < realList[15].x) {
            joinPos = [33, 12, 14, 13, 11]; // Joints to connect for "Disgust"
            c = color(226, 106, 106); // Set the color for "Disgust"
            currentText = 'Disgust'; // Set the emotion text to "Disgust"
            document.getElementById('emotion-text').style.color = 'rgb(226,106,106)'; // Update the color of the displayed text
          }
          // Emotion detection: "Disgust" (Version 2)
          else if (realList[28].y < realList[25].y
            && realList[16].x < realList[23].x) {
            joinPos = [16, 28, 24]; // Joints to connect for "Disgust"
            c = color(226, 106, 106); // Set the color for "Disgust"
            currentText = 'Disgust'; // Set the emotion text to "Disgust"
            document.getElementById('emotion-text').style.color = 'rgb(226,106,106)'; // Update the color of the displayed text
          }


          // Emotion detection: "Joy" (Version 1)
          else if (realList[28].y < realList[25].y - d) {
            // If the y-coordinate of joint 28 is higher than joint 25 by a threshold, detect "Joy"
            joinPos = [16, 12, 24, 26, 28]; // Joints to connect for "Joy"
            c = color(255, 169, 0); // Set the color for "Joy"
            currentText = 'Joy'; // Set the emotion text to "Joy"
            document.getElementById('emotion-text').style.color = 'rgb(255, 169, 0)'; // Update the color of the displayed text
          }

          // Emotion detection: "Joy" (Version 2)
          else if (realList[15].y < realList[13].y
            && realList[13].y < realList[11].y
            && realList[16].y < realList[14].y
            && realList[14].y < realList[12].y
            && realList[28].y < realList[27].y - d) {
            // If multiple conditions are met where certain joints' y-coordinates are lower than others, detect "Joy"
            joinPos = [15, 13, 11, 24, 26, 28, 16]; // Joints to connect for "Joy"
            c = color(255, 223, 13); // Set the color for "Joy"
            currentText = 'Joy'; // Set the emotion text to "Joy"
            document.getElementById('emotion-text').style.color = 'rgb(255, 223, 13)'; // Update the color of the displayed text
          }

          // Emotion detection: "Joy" (Version 3)
          else if (realList[15].y < realList[13].y
            && realList[13].y < realList[11].y
            && realList[16].y < realList[14].y
            && realList[14].y < realList[12].y) {
            // If another set of conditions is met with certain joints' y-coordinates lower than others, detect "Joy"
            joinPos = [15, 16, 14, 12, 11, 13]; // Joints to connect for "Joy"
            c = color(255, 169, 0); // Set the color for "Joy"
            currentText = 'Joy'; // Set the emotion text to "Joy"
            document.getElementById('emotion-text').style.color = 'rgb(255, 169, 0)'; // Update the color of the displayed text
          }

          // Emotion detection: "Anticipation" (Version 1)
          else if (realList[15].y < realList[13].y
            && realList[13].y < realList[11].y) {
            // If the y-coordinates of certain joints indicate anticipation, detect "Anticipation"
            joinPos = [15, 14, 28, 27, 25, 23]; // Joints to connect for "Anticipation"
            c = color(255, 113, 13); // Set the color for "Anticipation"
            currentText = 'Anticipation'; // Set the emotion text to "Anticipation"
            document.getElementById('emotion-text').style.color = 'rgb(255, 113, 13)'; // Update the color of the displayed text
          }

          // Emotion detection: "Anticipation" (Version 2)
          else if (realList[16].y < realList[14].y
            && realList[14].y < realList[12].y) {
            // If another set of conditions is met, detect "Anticipation"
            joinPos = [15, 14, 28, 27, 25, 23]; // Joints to connect for "Anticipation"
            c = color(255, 169, 0); // Set the color for "Anticipation"
            currentText = 'Anticipation'; // Set the emotion text to "Anticipation"
            document.getElementById('emotion-text').style.color = 'rgb(255, 169, 0)'; // Update the color of the displayed text
          }

          // Emotion detection: "Grateful" (Version 1)
          else if (realList[15].x < realList[13].x
            && realList[15].y > realList[13].y
            && realList[13].y > realList[11].y
            && realList[13].x < realList[11].x
            && realList[16].x < realList[14].x
            && realList[16].y > realList[14].y
            && realList[14].y > realList[12].y
            && realList[14].x < realList[12].x) {
            // If multiple conditions are met based on the x and y coordinates of certain joints, detect "Grateful"
            joinPos = [11, 12, 14, 16, 15, 13]; // Joints to connect for "Grateful"
            c = color(42, 187, 154); // Set the color for "Grateful"
            currentText = 'Grateful'; // Set the emotion text to "Grateful"
            document.getElementById('emotion-text').style.color = 'rgb(42, 187, 154)'; // Update the color of the displayed text
          }

          // Emotion detection: "Grateful" (Version 2)
          else if (abs(realList[11].y - realList[13].y) < d
            && abs(realList[11].y - realList[15].y) < d
            && abs(realList[12].y - realList[14].y) < d
            && abs(realList[12].y - realList[16].y) < d) {
            // If another set of conditions is met with small differences in y-coordinates, detect "Grateful"
            joinPos = [15, 16, 24, 23]; // Joints to connect for "Grateful"
            c = color(33, 152, 117); // Set the color for "Grateful"
            currentText = 'Grateful'; // Set the emotion text to "Grateful"
            document.getElementById('emotion-text').style.color = 'rgb(33, 152, 117)'; // Update the color of the displayed text
          }

          // Emotion detection: "Trust"
          else if (abs(realList[11].y - realList[13].y) < d
            && realList[15].y < realList[13].y
            && abs(realList[12].y - realList[14].y) < d
            && realList[16].y < realList[14].y) {
            // If the y-coordinates of certain joints indicate trust, detect "Trust"
            joinPos = [15, 13, 11, 12, 14, 16]; // Joints to connect for "Trust"
            c = color(54, 215, 183); // Set the color for "Trust"
            currentText = 'Trust'; // Set the emotion text to "Trust"
            document.getElementById('emotion-text').style.color = 'rgb(54, 215, 183)'; // Update the color of the displayed text
          }

          // Default case if no emotion is detected
          else {
            currentText = ''; // Clear the emotion text
          }

          // If an emotion is detected, draw the shape connecting the relevant joints
          if (currentText) {
            fill(c); // Set the fill color for the emotion shape
            beginShape(); // Begin drawing the shape
            for (let i = 0; i < joinPos.length; i++) {
              const index = joinPos[i];
              curveVertex(realList[index].x, realList[index].y); // Draw a vertex at each joint position
            }
            endShape(CLOSE); // Close and fill the shape
          }


          //   for (let j = 0; j < list.length; j++) {
          //     let index2 = list[j];
          //     let x2 = map(joints[index2].x, 0, 1, width, 0);
          //     let y2 = map(joints[index2].y, 0, 1, 0, height);
          //     let d = dist(x, y, x2, y2);
          //     if (index != index2 && d > 0 && d <= rateDist / 2.5) {
          //       activeList.push(createVector(x, y));
          //       activeList.push(createVector(x2, y2));
          //     }
          //   }
          // }

          // if (activeList.length >= 3) {
          //   activeList = grahamScan(activeList);
          //   fill(random(colors));

          //   beginShape();
          //   for (let i = 0; i < activeList.length; i++) {
          //     curveVertex(activeList[i].x, activeList[i].y);
          //   }
          //   endShape(CLOSE);
          // }
        }
      }
    }
  }
}

// Function to perform the Graham scan algorithm to find the convex hull of a set of points
function grahamScan(points) {
  // Sort the points by x-coordinate (and by y-coordinate in case of a tie)
  points.sort((a, b) => a.x - b.x || a.y - b.y);
  
  let lower = []; // Array to hold the lower hull of the convex hull
  // Construct the lower hull
  for (let p of points) {
    // Remove the last point from the lower hull if it makes a non-left turn
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    // Add the current point to the lower hull
    lower.push(p);
  }

  let upper = []; // Array to hold the upper hull of the convex hull
  // Construct the upper hull by iterating over the points in reverse order
  for (let i = points.length - 1; i >= 0; i--) {
    let p = points[i];
    // Remove the last point from the upper hull if it makes a non-left turn
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    // Add the current point to the upper hull
    upper.push(p);
  }

  // Remove the last point of each half because it's repeated at the beginning of the other half
  lower.pop();
  upper.pop();

  // Concatenate the lower and upper hulls to get the full convex hull
  return lower.concat(upper);
}

// Function to compute the cross product of vectors OA and OB
// A positive cross product indicates a left turn, zero indicates a collinear point, and negative indicates a right turn
function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}