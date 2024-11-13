
import { init } from 'z3-solver';

const { Context } = await init();

const { Solver, Int, And, Or, Distinct } = new Context("main");

export default class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");
    }

    preload() {
    }

    init() {
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
    }

    async create() {
        // Create a new tilemap which uses 16x16 tiles, and is 40 tiles wide and 25 tiles tall
        this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, this.TILEHEIGHT, this.TILEWIDTH);

        // Add a tileset to the map
        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

        // Create the layers
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);
        
        // Camera settings
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);

        // Create grid of visible tiles for use with path planning
        let tinyTownGrid = this.layersToGrid([this.groundLayer, this.treesLayer, this.housesLayer]);

        let walkables = [1, 2, 3, 30, 40, 41, 42, 43, 44, 95, 13, 14, 15, 25, 26, 27, 37, 38, 39, 70, 84];

        // Make a new layer for placing z3 constraint items

        const wheelbarrow = 57;

        const mushroom = 29;

        const sign = 83;

        const beehive = 94;

        const blank = -1;

        this.z3Layer = [];

        for (let i = 0; i < this.map.height; i++) {
            this.z3Layer[i] = [];
            for (let j = 0; j < this.map.width; j++) {
                this.z3Layer[i][j] = blank;
            }
        }

        let solver = new Solver();

        // There are 4 pets, a dog, a cat, a bird, and a fish, where cat is 1, dog is 2, bird is 3, and fish is 4

        // There are 4 kids, Bob, Mary, Cathy, and Sue

        // Each kid has a pet, and no two kids have the same pet

        let Bob = Int.const('Bob');

        let Mary = Int.const('Mary');

        let Cathy = Int.const('Cathy');

        let Sue = Int.const('Sue');

        // Each kid has a different pet

        solver.add(Distinct(Bob, Mary, Cathy, Sue));

        // Each pet is assigned to a kid

        solver.add(Or(Bob.eq(1), Mary.eq(1), Cathy.eq(1), Sue.eq(1)));

        solver.add(Or(Bob.eq(2), Mary.eq(2), Cathy.eq(2), Sue.eq(2)));

        solver.add(Or(Bob.eq(3), Mary.eq(3), Cathy.eq(3), Sue.eq(3)));

        solver.add(Or(Bob.eq(4), Mary.eq(4), Cathy.eq(4), Sue.eq(4)));

        // Bob has a dog

        solver.add(Bob.eq(2));

        // Sue has a bird

        solver.add(Sue.eq(3));

        // Mary does not have a fish

        solver.add(Mary.neq(4));

        // Run Z3 solver, find solution and sat/unsat
        console.log(await solver.check());

        // Extract value for Bob, Mary, Cathy, and Sue
        const model = solver.model();
        const bobVal = model.eval(Bob);
        const maryVal = model.eval(Mary);
        const cathyVal = model.eval(Cathy);
        const sueVal = model.eval(Sue);

        // Log pet values

        console.log("Pet Scenario: " + `${bobVal} ${maryVal} ${cathyVal} ${sueVal}`);

        // clear solver
        solver = new Solver();

        // New scenario: fenced in area

        // Left fence is at tile x = 5

        // Right fence is at tile x = 10

        // Top fence is at tile y = 15

        // Bottom fence is at tile y = 25

        // Generate an item inside the fenced area

        let x = Int.const('x');

        let y = Int.const('y');

        // x is between 5 and 10

        solver.add(x.gt(5));

        solver.add(x.lt(10));

        // y is between 15 and 25

        solver.add(y.gt(15));

        solver.add(y.lt(25));

        // Run Z3 solver, find solution and sat/unsat

        console.log(await solver.check());

        // Extract value for x and y

        const model2 = solver.model();

        const xVal = model2.eval(x);

        const yVal = model2.eval(y);

        // Log x and y values

        console.log("Item inside of fence: " + `${xVal} ${yVal}`);

        // clear solver

        solver.reset();

        // New scenario: generate an item on the top side of the fence or left side of the fence

        // if left side, 
        // x should be 5 and y should be between 15 and 25 (not 25 because it could be considered bottom side), 
        // if top side, 
        // y should be 15 and x should be between 5 and 10 (not 10 because it could be considered right side)

        solver.add(Or(And(x.eq(5), y.ge(15), y.lt(25)), And(y.eq(15), x.ge(5), x.lt(10))));

        // Run Z3 solver, find solution and sat/unsat

        console.log(await solver.check());

        // Extract value for x and y

        const model3 = solver.model();

        const xVal2 = model3.eval(x);

        const yVal2 = model3.eval(y);

        // Log x and y values

        console.log("Item on top or left side of fence: " + `${xVal2} ${yVal2}`);

        // clear solver

        solver.reset();

        // New scenario: generate an item outside of the fenced area

        // x should be greater than 8 and y should be greater than 20

        // x can technically be less than 10 as long as y is greater than 25, and y can be less than 25 as long as x is greater than 10

        solver.add(x.ge(8));

        solver.add(y.ge(20));

        solver.add(Or(And(x.lt(10), y.gt(25)), And(x.gt(10), y.lt(25))));

        // Run Z3 solver, find solution and sat/unsat

        console.log(await solver.check());

        // Extract value for x and y

        const model4 = solver.model();

        const xVal3 = model4.eval(x);

        const yVal3 = model4.eval(y);

        // Log x and y values

        console.log("Item outside of fence and x >= 8 and y >= 20: " + `${xVal3} ${yVal3}`);

        // Phaser Time

        // List of all fence indexes
        const fences = [44, 45, 46, 47, 60, 59, 57, 69, 70, 71, 81, 82];

        // Top left fence indexes
        const topLeftFence = 45;

        // Find all fenced-in areas in the map and get the dimensions of each fenced-in area

        let fencedAreas = [];

        for (let i = 0; i < this.map.height; i++) {
            for (let j = 0; j < this.map.width; j++) {
                let index = tinyTownGrid[i][j][2];
                if (fences.includes(index)) {
                    if (topLeftFence == index) {
                        // Currently at top left corner, 
                        // now look down until there is no more fence, that is the height, 
                        // then look right until there is no more fence, that is the width

                        let height = 0;
                        let width = 0;

                        let k = i;
                        let l = j;

                        while (fences.includes(tinyTownGrid[k][j][2])) {
                            height++;
                            k++;
                        }

                        while (fences.includes(tinyTownGrid[i][l][2])) {
                            width++;
                            l++;
                        }

                        fencedAreas.push({x: j, y: i, width: width, height: height});
                    }
                }
            }
        }

        // Using z3 solver, place a wheelbarrow inside each fenced area

        for (let i = 0; i < fencedAreas.length; i++) {
            let x = Int.const('x' + i);
            let y = Int.const('y' + i);
            
            // Define variables for the boundaries of fencedAreas[i]
            let fencedAreaX = fencedAreas[i].x;
            let fencedAreaY = fencedAreas[i].y;
            let fencedAreaWidth = fencedAreas[i].width;
            let fencedAreaHeight = fencedAreas[i].height;
            
            // Define boundary constraints for x and y
            let xGreaterThanLeft = x.gt(fencedAreaX);  // x is greater than the left boundary
            let xLessThanRight = x.lt(fencedAreaX + fencedAreaWidth);  // x is less than the right boundary
            let yGreaterThanTop = y.gt(fencedAreaY);  // y is greater than the top boundary
            let yLessThanBottom = y.lt(fencedAreaY + fencedAreaHeight);  // y is less than the bottom boundary
            
            // Combine them into an And statement to ensure (x, y) is inside the fenced area
            solver.add(
                And(
                    xGreaterThanLeft,
                    xLessThanRight,
                    yGreaterThanTop,
                    yLessThanBottom
                )
            );

            // Run Z3 solver, find solution and sat/unsat

            console.log(await solver.check());

            // Extract value for x and y

            const model5 = solver.model();

            const xVal4 = model5.eval(x);

            const yVal4 = model5.eval(y);

            // Log x and y values

            let xV = `${xVal4}`;

            let yV = `${yVal4}`;
            
            this.z3Layer[yV][xV] = wheelbarrow;

            // clear solver
            solver.reset();
        }

        // Trees / Bushes / Mushrooms / Hives
        const trees = [5, 4, 17, 16, 30, 107, 2, 8, 95, 19, 20, 21, 28, 29, 32, 22, 23, 24, 35, 11, 84];

        const treeIndexes = [];

        for (let i = 0; i < this.map.height; i++) {
            for (let j = 0; j < this.map.width; j++) {
                let index = tinyTownGrid[i][j][1];
                if (trees.includes(index)) {
                    // List all of the coordinates of the trees
                    treeIndexes.push({x: j, y: i});
                }
            }
        }

        // Using z3 solver, place a mushroom adjacent to a tree, but not on the tree.

        x = Int.const('x');
        y = Int.const('y');

        let treeX = treeIndexes[0].x;
        let treeY = treeIndexes[0].y;

        // Note: I would make it possible to place mushrooms adjacent to all trees,
        //       but certain trees are made up of multiple tiles, 
        //       so a mushroom might be placed on top of a tree because of the adjacency placement.

        let right = And(x.eq(treeX + 1), y.eq(treeY));  // Right of tree
        let left = And(x.eq(treeX - 1), y.eq(treeY));  // Left of tree
        let up = And(x.eq(treeX), y.eq(treeY + 1));  // Above tree
        let down = And(x.eq(treeX), y.eq(treeY - 1));  // Below tree

        solver.add(Or(right, left, up, down));

        // Run Z3 solver, find solution and sat/unsat

        console.log(await solver.check());

        // Extract value for x and y

        const model6 = solver.model();

        const xVal5 = model6.eval(x);

        const yVal5 = model6.eval(y);

        // Log x and y values

        let xV = `${xVal5}`;

        let yV = `${yVal5}`;

        this.z3Layer[yV][xV] = mushroom;

        // clear solver
        solver.reset();


        this.z3Map = this.make.tilemap({
            data: this.z3Layer,
            tileWidth: this.TILESIZE,
            tileHeight: this.TILESIZE
        })

        this.z3Tileset = this.z3Map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");

        this.zlayer = this.z3Map.createLayer(0, this.z3Tileset, 0, 0);

    }

    update() {
    }

    tileXtoWorld(tileX) {
        return tileX * this.TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * this.TILESIZE;
    }

    // layersToGrid
    //
    // Uses the tile layer information in this.map and outputs
    // an array which contains the tile ids of the visible tiles on screen.
    layersToGrid(layers) {
        // Layers is an array of tile layers

        let grid = [];

        for (let i = 0; i < this.map.height; i++) {
            grid[i] = [];
            for (let j = 0; j < this.map.width; j++) {
                // Initialize the grid value with the index values of each layer in an array

                grid[i][j] = [];

                for (let k = 0; k < layers.length; k++) {
                    let tile = this.map.getTileAt(j, i, true, layers[k]);
                    if (tile != null) {
                        grid[i][j].push(tile.index);
                    }
                }
            }
        }

        return grid;
    }
}

