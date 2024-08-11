let myPoseLandmarker;
let poseLandmarks;
let myCapture;
let lastVideoTime = -1;
let colors = [];
let currentText = ''

const trackingConfig = {
  doAcquirePoseLandmarks: true,
  poseModelLiteOrFull: "lite" /* "lite" (3MB) or "full" (6MB) */,
  cpuOrGpuString: "GPU" /* "GPU" or "CPU" */,
  maxNumPoses: 1,
};

async function preload() {
  const mediapipe_module = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"
  );

  PoseLandmarker = mediapipe_module.PoseLandmarker;
  FilesetResolver = mediapipe_module.FilesetResolver;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm"
  );

  if (trackingConfig.doAcquirePoseLandmarks) {
    const poseModelLite =
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
    const poseModelFull =
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";
    let poseModel = poseModelLite;
    poseModel =
      trackingConfig.poseModelLiteOrFull == "full"
        ? poseModelFull
        : poseModelLite;
    myPoseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      numPoses: trackingConfig.maxNumPoses,
      runningMode: "VIDEO",
      baseOptions: {
        modelAssetPath: poseModel,
        delegate: trackingConfig.cpuOrGpuString,
      },
    });
  }
}

//------------------------------------------
async function predictWebcam() {
  let startTimeMs = performance.now();
  if (lastVideoTime !== myCapture.elt.currentTime) {
    if (trackingConfig.doAcquirePoseLandmarks && myPoseLandmarker) {
      poseLandmarks = myPoseLandmarker.detectForVideo(
        myCapture.elt,
        startTimeMs
      );
    }
    lastVideoTime = myCapture.elt.currentTime;
  }
}

//------------------------------------------
function setup() {
  // createCanvas(640, 480);
  createCanvas(windowWidth, windowHeight);
  myCapture = createCapture(VIDEO);
  myCapture.size(320, 240);
  myCapture.hide();

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

function draw() {
  background("white");
  drawVideoBackground();
  predictWebcam();
  drawPosePoints();

  if (currentText) {
    textSize(64)
    fill(255, 25, 25)
    text(currentText, 16, 64)
  }
}

//------------------------------------------
function drawVideoBackground() {
  push();
  translate(width, 0);
  scale(-1, 1);
  image(myCapture, 0, 0, width, height);
  pop();
}

//------------------------------------------
// 33 joints of the body. See landmarks.js for the list.
function drawPosePoints() {
  if (trackingConfig.doAcquirePoseLandmarks) {
    if (poseLandmarks && poseLandmarks.landmarks) {
      const nPoses = poseLandmarks.landmarks.length;
      if (nPoses > 0) {
        // Draw lines connecting the joints of the body
        fill("darkblue");
        noStroke();
        let activeList = [];

        for (let h = 0; h < nPoses; h++) {
          let joints = poseLandmarks.landmarks[h];
          let list = [0, 11, 12, 13, 15, 14, 16, 23, 24, 25, 26, 27, 28];

          let x11 = map(joints[11].x, 0, 1, width, 0);
          let y11 = map(joints[11].y, 0, 1, 0, height);
          let x12 = map(joints[12].x, 0, 1, width, 0);
          let y12 = map(joints[12].y, 0, 1, 0, height);
          let rateDist = dist(x11, y11, x12, y12);

          for (let i = 0; i < list.length; i++) {
            let index = list[i]
            let x = map(joints[index].x, 0, 1, width, 0);
            let y = map(joints[index].y, 0, 1, 0, height);

            for (let j = 0; j < list.length; j++) {
              let index2 = list[j];
              let x2 = map(joints[index2].x, 0, 1, width, 0);
              let y2 = map(joints[index2].y, 0, 1, 0, height);
              let d = dist(x, y, x2, y2);
              if (index != index2 && d > 0 && d <= rateDist / 2.5) {
                activeList.push(createVector(x, y));
                activeList.push(createVector(x2, y2));
              }
            }
          }
        }

        if (activeList.length >= 3) {
          activeList = grahamScan(activeList);
          fill(random(colors));

          beginShape();
          for (let i = 0; i < activeList.length; i++) {
            curveVertex(activeList[i].x, activeList[i].y);
          }
          endShape(CLOSE);
        }
      }
    }
  }
}

function grahamScan(points) {
  points.sort((a, b) => a.x - b.x || a.y - b.y);

  let lower = [];
  for (let p of points) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  let upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    let p = points[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}
