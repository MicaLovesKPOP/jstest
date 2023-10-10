const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Car properties
let carWidth = 50;
let carHeight = 80;
let carSpeed = 5;

let carData = null; // Will store the currently selected car's data
let carX = canvas.width / 2 - carWidth / 2;
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

      // Check that all data is available
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

  const carDimensions = {
    length: parseFloat(carInfoData["Vehicle Length"]),
    width: parseFloat(carInfoData["Vehicle Width"]),
    height: parseFloat(carInfoData["Vehicle Height"]),
  };

  return { ...carInfoData, powerband: powerbandData, dimensions: carDimensions };
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
    carImage.onload = () => {
      // Parse the SVG content to get the width and height
      const parser = new DOMParser();
      const svgDocument = parser.parseFromString(carImage.contentDocument.documentElement.outerHTML, 'image/svg+xml');
      const svgElement = svgDocument.querySelector('svg');

      if (svgElement) {
        // Get the width and height attributes from the SVG
        const carWidthStr = svgElement.getAttribute('width');
        const carHeightStr = svgElement.getAttribute('height');

        // Convert the width and height to meters (assuming SVG units are meters)
        const carWidthMeters = parseFloat(carWidthStr);
        const carHeightMeters = parseFloat(carHeightStr);

        // Log car size in meters
        log(`Car Size: Width = ${carWidthMeters} meters, Height = ${carHeightMeters} meters`);

        // Calculate the scaling factor (assuming 1 meter in the game is equivalent to 1 pixel)
        const scaleFactor = 1;

        // Apply the scaling factor to the car's width and height
        carWidth = carWidthMeters * scaleFactor;
        carHeight = carHeightMeters * scaleFactor;

        resolve();
      } else {
        log("Error: SVG element not found in the loaded image.");
        reject();
      }
    };
    carImage.onerror = () => {
      log("Error: Failed to load the SVG image.");
      reject();
    };
    carImage.src = imagePath;
  });
}

let carInfoLogged = false; // Add this flag to track if car info has been logged

// Function to draw the car
function drawCar() {
  const scaledCarX = carX * widthScaleFactor;
  const scaledCarY = (canvas.height - carHeight) * heightScaleFactor;
  ctx.drawImage(carImage, scaledCarX, scaledCarY, carWidth, carHeight);

  // Log car size and location only once
  if (!carInfoLogged) {
    //log(`Car Size: Width = ${carWidth}, Height = ${carHeight}`);
    log(`Car Location: X = ${carX}, Y = ${canvas.height - carHeight}`);
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
