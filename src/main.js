import Phaser from 'phaser';
import Load from './Scenes/Load.js';
import Pathfinder from './Scenes/Pathfinder.js';

// Game configuration
let config = {
  parent: 'phaser-game',
  type: Phaser.CANVAS,
  render: {
      pixelArt: true  // prevent pixel art from getting blurred when scaled
  },
  width: 1280,
  height: 800,
  scene: [Load, Pathfinder]
}

let game = new Phaser.Game(config);

// Apply settings button functionality
document.getElementById('applySettings').addEventListener('click', () => {
  const numWheelbarrows = parseInt(document.getElementById('numWheelbarrows').value);
  const numMushrooms = parseInt(document.getElementById('numMushrooms').value);
  const numSigns = parseInt(document.getElementById('numSigns').value);
  const numBeehives = parseInt(document.getElementById('numBeehives').value);

  // Get reference to Pathfinder scene
  const pathfinderScene = game.scene.getScene('pathfinderScene');

  if (pathfinderScene) {
    // Set data directly on the scene's data object
    pathfinderScene.data.set('numWheelbarrows', numWheelbarrows);
    pathfinderScene.data.set('numMushrooms', numMushrooms);
    pathfinderScene.data.set('numSigns', numSigns);
    pathfinderScene.data.set('numBeehives', numBeehives);
    pathfinderScene.data.set('changedSettings', true);
  } else {
    console.error('Pathfinder scene is not initialized');
  }
});
