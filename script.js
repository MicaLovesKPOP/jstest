const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Car properties
let carWidth = 80;
let carHeight = 50;
let carSpeed = 5;

let carData = null; // Will store the currently selected car's data
const carXPercentage = 10; // Set the percentage from the left
let carX = (canvas.width * carXPercentage) / 100;
let raceStarted = false;
let raceFinished = false;
let raceTime = 0;

let enableLogging = 1; // Set to 1 to enable logging, 0 to disable

// Function to resize the canvas based on the viewport size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Call the resizeCanvas function when the window is resized
window.addEventListener('resize', resizeCanvas);

// Initial canvas size setup
resizeCanvas();

// Function to get the last modified timestamp of script.js
function getLastModifiedTimestamp() {
  return fetch('script.js')
    .then((response) => response.headers.get('Last-Modified'))
    .then((lastModified) => new Date(lastModified).toLocaleString());
}

// Function to set the last modified timestamp
function setLastModifiedTimestamp() {
  getLastModifiedTimestamp().then((timestamp) => {
    const lastModifiedElement = document.getElementById('lastModified');
    lastModifiedElement.textContent = `Last Modified: ${timestamp}`;
  });
}

// Call setLastModifiedTimestamp to set the timestamp once
setLastModifiedTimestamp();

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
  const carInfoPath = `vehicles/${carFolder}/carinfo.cfg`;
  const powerbandPath = `vehicles/${carFolder}/powerband.crv`;
  const imagePath = `https://micaloveskpop.github.io/jstest/vehicles/${carFolder}/sprite.svg`; // Use the direct URL

  return Promise.all([
    fetch(carInfoPath).then((response) => response.text()),
    fetch(powerbandPath).then((response) => response.text()),
  ])
    .then(([carInfo, powerband]) => {
      // Parse carinfo.cfg and powerband.crv data here
      const parsedCarData = parseCarData(carInfo, powerband);

      if (parsedCarData) {
        return { carData: parsedCarData, imagePath };
      } else {
        log("Error loading car data: Some data is missing.");
        return null;
      }
    })
    .catch((error) => {
      log(`Error loading car data for ${carFolder}: ${error}`);
      return null;
    });
}

// Load car data and start the game when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  loadCarData('sedan_001')
    .then(({ carData, imagePath }) => {
      if (carData) {
        window.carData = carData;
        log('Car data loaded successfully.');
        loadCarImage(imagePath, carData.dimensions)
          .then(() => {
            console.log("SVG image loaded successfully");
            updateGameArea();
          })
          .catch((error) => {
            console.error("Error loading SVG image:", error);
          });
      }
    });
});

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

// Create an Image object for the car sprite
const carImage = new Image();

// Function to load the car image and extract dimensions from the SVG
function loadCarImage(imagePath) {
  return new Promise((resolve, reject) => {
    const carImage = new Image();

    carImage.onload = () => {
      log("Car Image Loaded");

      // You may need to adjust the scale factor based on your requirements
      const scaleFactor = canvas.width / 800; // Adjust as needed

      // Get the dimensions of the loaded image
      carWidth = carImage.width * scaleFactor;
      carHeight = carImage.height * scaleFactor;

      log(`Car Size: Width = ${carWidth}, Height = ${carHeight}`);

      resolve();
    };

    carImage.onerror = () => {
      log("Error: Failed to load the SVG image.");
      reject();
    };

    carImage.src = imagePath;
  });
}

let carInfoLogged = false; // Add this flag to track if car info has been logged

// Calculate scaling factors based on the initial canvas size
const initialCanvasWidth = 800; // Set to your initial canvas width
const initialCanvasHeight = 400; // Set to your initial canvas height
const widthScaleFactor = canvas.width / initialCanvasWidth;
const heightScaleFactor = canvas.height / initialCanvasHeight;

// Apply the scaling factors to the car's width and height
carWidth *= widthScaleFactor;
carHeight *= heightScaleFactor;

// Function to draw the car
function drawCar() {
  const scaledCarX = carX * (canvas.width / initialCanvasWidth);
  const scaledCarY = (canvas.height - carHeight) / 2;
  ctx.drawImage(carImage, scaledCarX, scaledCarY, carWidth, carHeight);

  // Log car size and location only once
  if (!carInfoLogged) {
    log(`Car Location: X = ${scaledCarX}, Y = ${scaledCarY}`);
    carInfoLogged = true; // Set the flag to true to prevent further logging
  }
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
loadCarData(`sedan_001`);

canvas.width = 800;
canvas.height = 400;
updateGameArea();
