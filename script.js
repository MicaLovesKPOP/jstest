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
  const carInfoPath = `vehicles/${carFolder}/carinfo.cfg`;
  const powerbandPath = `vehicles/${carFolder}/powerband.crv`;
  const svgImagePath = `vehicles/${carFolder}/sprite.svg`;

  return Promise.all([
    fetch(carInfoPath).then((response) => response.text()),
    fetch(powerbandPath).then((response) => response.text()),
  ])
    .then(([carInfo, powerband]) => {
      // Parse carinfo.cfg and powerband.crv data here
      const parsedCarData = parseCarData(carInfo, powerband);

      // Check that all data is available
      if (parsedCarData) {
        return parsedCarData;
      } else {
        log("Error loading car data: Some data is missing.");
        return null;
      }
    })
    .then((carData) => {
      if (carData) {
        // Create an Image object for the SVG image and load it
        const carImage = new Image();
        carImage.src = svgImagePath;

        // Return the loaded car data and image
        return { ...carData, carImage };
      } else {
        return null;
      }
    })
    .catch((error) => {
      log(`Error loading car data for ${carFolder}: ${error}`);
      return null;
    });
}

// Load car data and start the game when the document is ready
document.addEventListener("DOMContentLoaded", () => {
  loadCarData("sports_001")
    .then((carData) => {
      if (carData) {
        window.carData = carData;
        log("Car data loaded successfully.");
        updateGameArea();
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

// Function to load the car image
function loadCarImage() {
  return new Promise((resolve, reject) => {
    carImage.onload = resolve;
    carImage.onerror = reject;
    carImage.src = `data:image/svg+xml,${encodeURIComponent(carData.svgImage)}`;
  });
}

// Call the loadCarImage function when initializing the game
loadCarImage()
  .then(() => {
    console.log("SVG image loaded successfully");
    // Start the game loop
    updateGameArea();
  })
  .catch((error) => {
    console.error("Error loading SVG image:", error);
  });

// Function to draw the car
function drawCar() {
  ctx.drawImage(carImage, carX, canvas.height - carHeight, carWidth, carHeight);
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
