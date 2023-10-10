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
  const imagePath = `https://micaloveskpop.github.io/jstest/vehicles/${carFolder}/test.png`; // Use the direct URL
    
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
        const image = new Image();

        // Handle the image load event
        image.onload = () => {
          // Display the loaded image on the canvas (replace 'canvas' with your canvas element)
          const canvas = document.getElementById('canvas');
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);

          log('Image loaded successfully.'); // Update the log message
        };

        // Handle any errors
        image.onerror = (error) => {
          log(`Error loading image: ${error}`); // Update the log message
        };

        // Set the image source to load the SVG image
        image.src = imagePath;

        // Return the loaded car data
        return carData;
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
document.addEventListener('DOMContentLoaded', () => {
  loadCarData('sedan_001') // Try with 'sports_001' or 'sedan_001'
    .then((carData) => {
      if (carData) {
        window.carData = carData;
        log('Car data loaded successfully.');
        // You can add any other game initialization or logic here
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

  return { ...carInfoData, powerband: powerbandData, pngImageBase64: 'your_base64_string_here' };
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
    if (carData && carData.pngImageBase64) {
      carImage.onload = resolve;
      carImage.onerror = reject;
      carImage.src = `data:image/png;base64,${carData.pngImageBase64}`;
    } else {
      reject('carData or carData.pngImageBase64 is null');
    }
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
