const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Car properties
const carWidth = 50;
const carHeight = 80;
const carSpeed = 5;

let carData = null; // Will store the currently selected car's data
let carX = canvas.width / 2 - carWidth / 2;
let raceStarted = false;
let raceFinished = false;
let raceTime = 0;

let enableLogging = 1; // Set to 1 to enable logging, 0 to disable

// Function to log messages and display them in the log area
function log(message) {
  if (enableLogging) {
    const logArea = document.getElementById("logArea");
    logArea.innerHTML += message + "<br>";
    logArea.scrollTop = logArea.scrollHeight; // Auto-scroll to the bottom
    console.log(message);
  }
}

// Function to load car data from a car folder
function loadCarData(carFolder) {
    log(`Loading car data from folder: ${carFolder}`);
    const basePath = window.location.href.replace(/\/[^/]*$/, "/"); // Remove the HTML file name from the URL
    const carInfoPath = `${basePath}vehicles/${carFolder}/carinfo.cfg`;
    const powerbandPath = `${basePath}vehicles/${carFolder}/powerband.crv`;
    const svgImagePath = `${basePath}vehicles/${carFolder}/sprite.svg`;
  
    Promise.all([
      fetch(carInfoPath).then((response) => response.text()),
      fetch(powerbandPath).then((response) => response.text()),
      fetch(svgImagePath).then((response) => response.text()),
    ])
      .then(([carInfo, powerband, svgImage]) => {
        // Parse carinfo.cfg, powerband.crv, and SVG image data here and set carData
        carData = parseCarData(carInfo, powerband);
        carData.svgImage = svgImage;
        log("Car data loaded successfully.");
      })
      .catch((error) => {
        log(`Error loading car data for ${carFolder}: ${error}`);
        log(`'carInfoPath' was expected to be at ${carInfoPath}`);
        log(`'powerbandPath' was expected to be at ${powerbandPath}`);
        log(`'svgImagePath' was expected to be at ${svgImagePath}`);
      });
  }

// Function to parse carinfo.cfg and powerband.crv data
function parseCarData(carInfo, powerband) {
  const carInfoLines = carInfo.split("\n");
  const powerbandLines = powerband.split("\n");

  const carInfoData = {};
  carInfoLines.forEach((line) => {
    const [key, value] = line.split(/\s+/).filter(Boolean);
    carInfoData[key] = value;
  });

  const powerbandData = powerbandLines
    .filter((line) => !line.startsWith("#"))
    .map((line) => {
      const [rpm, torque] = line.split(/\s+/).filter(Boolean);
      return [parseInt(rpm), parseFloat(torque)];
    });

  return { ...carInfoData, powerband: powerbandData };
}

// Function to calculate torque based on RPM and powerband
function calculateTorque(rpm) {
  if (carData && carData.powerband) {
    for (let i = 0; i < carData.powerband.length - 1; i++) {
      const [rpm1, torque1] = carData.powerband[i];
      const [rpm2, torque2] = carData.powerband[i + 1];
      if (rpm >= rpm1 && rpm <= rpm2) {
        const slope = (torque2 - torque1) / (rpm2 - rpm1);
        return torque1 + slope * (rpm - rpm1);
      }
    }
  }
  return 0;
}

// Function to draw the car
function drawCar() {
  ctx.fillStyle = "blue"; // Set a color
  ctx.fillRect(carX, canvas.height - carHeight, carWidth, carHeight);
}


// Function to update the game area
function updateGameArea() {
  if (raceStarted && !raceFinished) {
    const currentRPM = raceTime * 1000; // Simulate RPM increase (adjust as needed)

    // Calculate torque based on current RPM and car's powerband
    const currentTorque = calculateTorque(currentRPM);

    // Update car speed based on torque
    carX += (currentTorque / carData.weight) * carSpeed;

    if (carX + carWidth > canvas.width) {
      carX = canvas.width - carWidth;
      raceFinished = true;
    }

    raceTime += 0.01; // Increment time

    // Add more game logic as needed
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCar();

  if (!raceStarted) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Press Space to Start", 100, 100);
  }

  if (raceFinished) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Race Time: " + raceTime.toFixed(2) + " seconds", 100, 100);
  }

  requestAnimationFrame(updateGameArea);
}

// Event listener to start the race
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !raceStarted) {
    raceStarted = true;
  }
});

// Load initial car data (you can change the car folder as needed)
loadCarData("sedan_001");

canvas.width = 800;
canvas.height = 400;
updateGameArea();
