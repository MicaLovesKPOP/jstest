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
};

// You can specify the position (0, 0) where you want to draw the SVG on the canvas.
