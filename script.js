// Get a reference to the canvas element and its 2D context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Create an Image object to load the SVG
const svgImage = new Image();

// Set the source of the image to your SVG file
svgImage.src = `https://micaloveskpop.github.io/jstest/vehicles/sedan_001/sprite.svg`;

// Add an event listener to handle the image load
svgImage.onload = function () {
    // Once the SVG is loaded, draw it on the canvas
    ctx.drawImage(svgImage, 0, 0);

    // Your game logic here:
    // - Initialize variables
    // - Add event listeners for game controls
    // - Implement game loop (requestAnimationFrame)
    // - Add functions for updating and rendering the game

    // Example:
    let carX = 100;
    let carY = 100;
    
    function updateGameArea() {
        // Update game logic
    }
    
    function drawGame() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the car or other game elements
        ctx.drawImage(svgImage, carX, carY);
    }
    
    function gameLoop() {
        updateGameArea();
        drawGame();
        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    gameLoop();
};
