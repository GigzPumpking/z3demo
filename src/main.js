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
  const numFenceItems = parseInt(document.getElementById('numFenceItems').value);
  const numTreeItems = parseInt(document.getElementById('numTreeItems').value);
  const numPathItems = parseInt(document.getElementById('numPathItems').value);
  const numAnywhereItems = parseInt(document.getElementById('numAnywhereItems').value);

  // Get reference to Pathfinder scene
  const pathfinderScene = game.scene.getScene('pathfinderScene');

  if (pathfinderScene) {
    // Set data directly on the scene's data object
    pathfinderScene.data.set('numFenceItems', numFenceItems);
    pathfinderScene.data.set('numTreeItems', numTreeItems);
    pathfinderScene.data.set('numPathItems', numPathItems);
    pathfinderScene.data.set('numAnywhereItems', numAnywhereItems);
    pathfinderScene.data.set('changedSettings', true);
  } else {
    console.error('Pathfinder scene is not initialized');
  }
});
