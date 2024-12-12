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
