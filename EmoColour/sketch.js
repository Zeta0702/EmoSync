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
  myCapture.size(1920, 1080);
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
    // textSize(64)
    // fill(118,215,207)
    // text(currentText, 16, 64)
     document.getElementById('emotion-text').innerHTML = currentText;
   }  else {
      document.getElementById('emotion-text').innerHTML = '';
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
        for (let h = 0; h < nPoses; h++) {
          let joints = poseLandmarks.landmarks[h];
          // console.log(joints.length)
          let list = [0, 11, 12, 13, 15, 14, 16, 23, 24, 25, 26, 27, 28];
          // let list = Array(33).fill(1).map((_, index) => index)
          let activeList = [];
          let realList = {}

          let x11 = map(joints[11].x, 0, 1, width, 0);
          let y11 = map(joints[11].y, 0, 1, 0, height);
          let x12 = map(joints[12].x, 0, 1, width, 0);
          let y12 = map(joints[12].y, 0, 1, 0, height);
          let rateDist = dist(x11, y11, x12, y12);

          for (let i = 0; i < list.length; i++) {
            let index = list[i];
            let x = map(joints[index].x, 0, 1, width, 0);
            let y = map(joints[index].y, 0, 1, 0, height);
            realList[index] = { x, y }
            fill(236, 246, 246)
            ellipse(x, y, 15, 15);
            // fill(255, 25, 2)
            // text(index, x, y)
          }

          // Neck
          realList[33] = {
            x: (x12 - x11) / 2 + x11,
            y: (y12 - y11) / 2 + y11 - rateDist / 5,
          }
          fill(236, 246, 246)
          ellipse(realList[33].x, realList[33].y, 15, 15);
          // fill(255, 25, 2)
          // text(33, realList[33].x, realList[33].y)

          // Basic standing
          //&& dist(realList[11].x, realList[11].y, realList[25].x, realList[25].y) > rateDist * 2
          //&& dist(realList[12].x, realList[12].y, realList[26].x, realList[26].y) > rateDist * 2

          // Angry1
          let d = rateDist / 4
          let joinPos = []
          let c
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
            joinPos = [11, 12, 14, 16, 24, 23, 15, 13]
            c = color(255, 25, 25)
            currentText = 'Angry'
            document.getElementById('emotion-text').style.color = 'rgb(255, 25, 25)';
          }
          // Angry2
          else if (realList[13].x < realList[15].x - d
            && realList[14].x > realList[16].x + d
            && dist(realList[15].x, realList[15].y, realList[11].x, realList[11].y) < rateDist / 2
            && dist(realList[16].x, realList[16].y, realList[12].x, realList[12].y) < rateDist / 2
            && dist(realList[11].x, realList[11].y, realList[25].x, realList[25].y) > rateDist * 2
            && dist(realList[12].x, realList[12].y, realList[26].x, realList[26].y) > rateDist * 2
          ) {
            joinPos = [11, 12, 14, 13]
            c = color(226, 106, 106)
            currentText = 'Angry'
            document.getElementById('emotion-text').style.color = 'rgb(226, 106, 106)';
          }
          // Bored
          else if (
            dist(realList[15].x, realList[15].y, realList[33].x, realList[33].y) < rateDist / 2
            && dist(realList[16].x, realList[16].y, realList[33].x, realList[33].y) < rateDist / 2
            && dist(realList[13].x, realList[13].y, realList[25].x, realList[25].y) < rateDist / 2
            && dist(realList[14].x, realList[14].y, realList[26].x, realList[26].y) < rateDist / 2
            && dist(realList[11].x, realList[11].y, realList[25].x, realList[25].y) < rateDist * 1.5
            && dist(realList[12].x, realList[12].y, realList[26].x, realList[26].y) < rateDist * 1.5
          ) {
            joinPos = [11, 12, 14, 13]
            c = color(241, 169, 161)
            currentText = 'Bored'
            document.getElementById('emotion-text').style.color = 'rgb(241, 169, 161)';
          }
          // Hopeless
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
            joinPos = [11, 12, 14, 16, 15, 13]
            c = color(30, 138, 194)
            currentText = 'Hopeless'
            document.getElementById('emotion-text').style.color = 'rgb(30, 138, 194)';
          }
          // Shame
          else if (dist(realList[16].x, realList[16].y, realList[0].x, realList[0].y) < rateDist
            && realList[15].x > realList[23].x
            && realList[15].y < realList[23].y) {
            joinPos = [0, 16, 15, 13, 11]
            c = color(95, 52, 135)
            currentText = 'Shame'
            document.getElementById('emotion-text').style.color = 'rgb(95, 52, 135)';
          }
          // Fear
          else if (realList[15].y < realList[11].y
            && realList[16].y < realList[12].y
            && dist(realList[15].x, realList[15].y, realList[11].x, realList[11].y) < rateDist
            && dist(realList[16].x, realList[16].y, realList[12].x, realList[12].y) < rateDist
          ) {
            joinPos = [0, 16, 14, 12, 11, 13, 15]
            c = color(30, 58, 146)
            currentText = 'Fear'
            document.getElementById('emotion-text').style.color = 'rgb(30, 58, 146)';
          }
          // Shock
          else if (realList[15].x < realList[13].x
            && realList[16].x > realList[14].x
            && realList[15].y < realList[13].x
            && realList[16].y < realList[14].y
          ) {
            joinPos = [15, 16, 14, 24, 23, 13]
            c = color(88, 171, 227)
            currentText = 'Shock'
            document.getElementById('emotion-text').style.color = 'rgb(88, 171, 227)';
          }
          // Joy1
          else if (realList[28].y < realList[25].y - d
          ) {
            joinPos = [16, 12, 24, 26, 28]
            c = color(255, 169, 0)
            currentText = 'Joy'
            document.getElementById('emotion-text').style.color = 'rgb(255, 169, 0)';
          }
          // Joy2
          else if (realList[15].y < realList[13].y
            && realList[13].y < realList[11].y
            && realList[16].y < realList[14].y
            && realList[14].y < realList[12].y
            && realList[28].y < realList[27].y - d
          ) {
            joinPos = [15, 13, 11, 24, 26, 28, 16]
            c = color(255, 223, 13)
            currentText = 'Joy'
            document.getElementById('emotion-text').style.color = 'rgb(255, 223, 13)';
          }
          // Joy3
          else if (realList[15].y < realList[13].y
            && realList[13].y < realList[11].y
            && realList[16].y < realList[14].y
            && realList[14].y < realList[12].y
          ) {
            joinPos = [15, 16, 14, 12, 11, 13]
            c = color(255, 169, 0)
            currentText = 'Joy'
            document.getElementById('emotion-text').style.color = 'rgb(255, 169, 0)';
          }
          // Anticipation1
          else if (realList[15].y < realList[13].y
            && realList[13].y < realList[11].y) {
            joinPos = [15, 14, 28, 27, 25, 23]
            c = color(255, 113, 13)
            currentText = 'Anticipation'
            document.getElementById('emotion-text').style.color = 'rgb(255, 113, 13)';
          }
          // Anticipation2
          else if (realList[16].y < realList[14].y
            && realList[14].y < realList[12].y) {
            joinPos = [15, 14, 28, 27, 25, 23]
            c = color(255, 169, 0)
            currentText = 'Anticipation'
            document.getElementById('emotion-text').style.color = 'rgb(255, 169, 0)';
          }
          // Grateful1
          else if (realList[15].x < realList[13].x
            && realList[15].y > realList[13].y
            && realList[13].y > realList[11].y
            && realList[13].x < realList[11].x
            && realList[16].x < realList[14].x
            && realList[16].y > realList[14].y
            && realList[14].y > realList[12].y
            && realList[14].x < realList[12].x) {
            joinPos = [11, 12, 14, 16, 15, 13]
            c = color(42, 187, 154)
            currentText = 'Grateful'
            document.getElementById('emotion-text').style.color = 'rgb(42, 187, 154)';
          }
          // Grateful2
          else if (abs(realList[11].y - realList[13].y) < d
            && abs(realList[11].y - realList[15].y) < d
            && abs(realList[12].y - realList[14].y) < d
            && abs(realList[12].y - realList[16].y) < d) {
            joinPos = [15, 16, 24, 23]
            c = color(33, 152, 117)
            currentText = 'Grateful'
            document.getElementById('emotion-text').style.color = 'rgb(33, 152, 117)';
          }
          // Trust
          else if (abs(realList[11].y - realList[13].y) < d
            && realList[15].y < realList[13].y
            && abs(realList[12].y - realList[14].y) < d
            && realList[16].y < realList[14].y) {
            joinPos = [15, 13, 11, 12, 14, 16]
            c = color(54, 215, 183)
            currentText = 'Trust'
            document.getElementById('emotion-text').style.color = 'rgb(54, 215, 183)';
          }
          else {
            currentText = ''
          }

          if (currentText) {
            fill(c)
            beginShape();
            for (let i = 0; i < joinPos.length; i++) {
              const index = joinPos[i]
              curveVertex(realList[index].x, realList[index].y);
            }
            endShape(CLOSE);
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
