import { init } from 'z3-solver';

const { Context } = await init();
const { Solver, Int, And, Or, Distinct } = new Context("main");

const groundIndexes = [1, 2, 3];

export default class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");
        this.solver = new Solver();
    }

    preload() {}

    init() {
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;

        this.numWheelbarrows = this.sceneData?.numWheelbarrows || 1;
        this.numMushrooms = this.sceneData?.numMushrooms || 1;
        this.numSigns = this.sceneData?.numSigns || 3;
        this.numBeehives = this.sceneData?.numBeehives || 1;
    }

    create() {
        console.log("Press R to restart the scene.");
        console.log("Press 'Apply Settings' to change the number of items to place.");
        console.log("Both actions can only be done when the scene is not generating.");

        // Note: Every row is 12 tiles wide

        this.objectList = [
            {name: "Wheelbarrow", index: 57}, 
            {name: "Mushroom", index: 29}, 
            {name: "Sign", index: 83}, 
            {name: "Beehive", index: 94}, 
            {name: "Key", index: 117}, 
            {name: "Bow", index: 118}, 
            {name: "Arrow", index: 119}, 
            {name: "Rake", index: 116},
            {name: "Target", index: 95},
            {name: "Coin", index: 93},
            {name: "Bomb", index: 105},
            {name: "Scythe", index: 129},
            {name: "Shovel", index: 128},
            {name: "Pickaxe", index: 115},
            {name: "Axe", index: 127},
            {name: "Empty Bucket", index: 130},
            {name: "Full Bucket", index: 131},
        ];

        // Track user input and conversation history
        this.userInput = '';
        this.conversationHistory = []; // This will act as memory
        
        this.initializeMap();

        // Add a basic text display
        this.chatText = this.add.text(16, 80, 'ChatGPT', { fontSize: '16px', fill: '#ffffff', backgroundColor: "#000000", wordWrap: { width: 700} });

        // Display user typing and listen for keyboard input
        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'Enter') {
                if (this.userInput.trim()) {
                    const input = this.userInput.trim();
                    this.userInput = ''; // Reset the input field
                    this.chatText.text += `\nYou: ${input}`;
                    this.handleChat(input); // Send input to OpenAI
                }
                return;
            } 
            // if shift key is pressed, do not append to user input
            else if (event.key === 'Shift') {
                return;
            } 
            // if the tilda key is pressed, generate the objects and return
            else if (event.key === '`') {
                this.generateObjects();
                return;
            }

            // Allow backspace
            if (event.key === 'Backspace') {
                this.userInput = this.userInput.slice(0, -1);
            } else {
                // Append typed character
                this.userInput += event.key;
            }

            // Display user input in real-time
            this.updateTypingDisplay();
        });

        // Set a timer to update the loading text every second
        this.time.addEvent({
            delay: 800,
            callback: this.updateLoadingText,
            callbackScope: this,
            loop: true
        });
    }

    async generateObjects() {
        // display "generating" loading text while all the z3 scenarios are running
        this.loadingText = this.add.text(16, 16, "Generating...", { fontSize: "32px", fill: "#FFFFFF", backgroundColor: "#000000", padding: 8 });

        // When R is pressed, reset the scene
        this.input.keyboard.on("keydown-R", () => {
            if (this.loadingText.alpha === 0) {
                this.scene.restart();
            } else {
                console.log("Cannot restart while generating...");
            }
        });

        // Run map placement z3 scenarios
        // Get the wheelbarrow from the object list

        const wheelbarrow = this.objectList.find(obj => obj.name === "Wheelbarrow").index;

        const mushroom = this.objectList.find(obj => obj.name === "Mushroom").index;

        const sign = this.objectList.find(obj => obj.name === "Sign").index;

        const beehive = this.objectList.find(obj => obj.name === "Beehive").index;

        await this.placeItemsInsideFencedAreas(this.numWheelbarrows, wheelbarrow);
        await this.placeItemAdjacentToTree(this.numMushrooms, mushroom);
        await this.placeItemAdjacentToPath(this.numSigns, sign);
        await this.placeItemAnywhere(this.numBeehives, beehive);
        
        this.renderZ3Map();
    }

    initializeMap() {
        this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE, this.TILEHEIGHT, this.TILEWIDTH);
        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);

        this.tinyTownGrid = this.layersToGrid([this.groundLayer, this.treesLayer, this.housesLayer]);
        this.z3Layer = Array.from({ length: this.map.height }, () => Array(this.map.width).fill(-1));
    }

    async placeItemsInsideFencedAreas(num = 1, item) {
        /*
        World Facts collection
        */

        let fencedAreas = this.getFencedAreas();  // Get all fenced areas
    
        /*
        z3 constraints
        */


        let allValidCoords = [];  // List to store all valid positions for the item

        // Iterate over each fenced area to find valid positions within it
        for (let area of fencedAreas) {
            this.solver.reset();  // Reset solver for fresh constraints
            let [x, y] = [Int.const('x'), Int.const('y')];
    
            // Define constraints to ensure (x, y) is inside the fenced area
            this.solver.add(x.gt(area.x), x.lt(area.x + area.width - 1), y.gt(area.y), y.lt(area.y + area.height - 1));
    
            // List to collect valid positions within the current fenced area
            let validPositions = [];
    
            // Find all solutions within this fenced area
            while (await this.solver.check() === "sat") {
                const model = this.solver.model();
                const xVal = parseInt(model.eval(x).toString());
                const yVal = parseInt(model.eval(y).toString());
    
                // Add the valid position to the main list
                allValidCoords.push({ x: xVal, y: yVal });
                
                // Exclude the current solution to find new solutions in the next iteration
                this.solver.add(Or(x.neq(xVal), y.neq(yVal)));
            }
        }

        /*
        item placement
        */

        // Place items at random positions within all valid positions
        if (!this.placeItemsAtRandomPositions(allValidCoords, num, item)) {
            console.log("No valid positions found for item placement inside any fenced area.");
            return false;
        }
        return true;
    }    

    async placeItemAdjacentToTree(num = 1, item) {
        let treeIndexes = this.getTreeIndexes();  // Get all tree tile coordinates
        const groundIndexes = [1, 2, 3];  // Define ground indexes
        let allValidCoords = [];  // List to store all valid positions for the mushroom

        for (let tree of treeIndexes) {
            this.solver.reset();
            let [x, y] = [Int.const('x'), Int.const('y')];

            // Define potential mushroom placement positions adjacent to the tree tile
            let adjacentTiles = [
                { x: tree.x + 1, y: tree.y },
                { x: tree.x - 1, y: tree.y },
                { x: tree.x, y: tree.y + 1 },
                { x: tree.x, y: tree.y - 1 }
            ];

            // Collect all valid positions adjacent to this tree
            let validPositions = [];

            for (let adjTile of adjacentTiles) {

                // Check if the adjacent tile is within the map bounds
                if (adjTile.x < 0 || adjTile.x >= this.map.width || adjTile.y < 0 || adjTile.y >= this.map.height) {
                    continue;
                }
                if (groundIndexes.includes(this.tinyTownGrid[adjTile.y][adjTile.x][0]) &&
                    this.tinyTownGrid[adjTile.y][adjTile.x][1] === -1 &&
                    this.tinyTownGrid[adjTile.y][adjTile.x][2] === -1) {
                    validPositions.push(And(x.eq(adjTile.x), y.eq(adjTile.y)));
                }
            }

            if (validPositions.length === 0) {
                continue;
            }

            // Add constraint to place the mushroom on any of the valid positions
            this.solver.add(Or(...validPositions));

            // Find all solutions for this tree's valid positions
            while (await this.solver.check() === "sat") {
                const model = this.solver.model();
                const xVal = parseInt(model.eval(x).toString());
                const yVal = parseInt(model.eval(y).toString());
                allValidCoords.push({ x: xVal, y: yVal });
                this.solver.add(Or(x.neq(xVal), y.neq(yVal)));  // Exclude current solution
            }
        }

        // Place mushrooms at random positions within all valid positions
        if (!this.placeItemsAtRandomPositions(allValidCoords, num, item)) {
            console.log("No valid positions found for mushroom placement adjacent to any tree.");
            return false;
        }
        return true;
    }

    async placeItemAdjacentToPath(num = 1, item) {
        let pathIndexes = this.getPathIndexes();  // Get all path tile coordinates
        let allValidCoords = [];  // List to store all valid positions for the sign
    
        for (let path of pathIndexes) {
            this.solver.reset();
            let [x, y] = [Int.const('x'), Int.const('y')];
    
            // Define potential sign placement positions adjacent to the path tile
            let adjacentTiles = [
                { x: path.x + 1, y: path.y },
                { x: path.x - 1, y: path.y },
                { x: path.x, y: path.y + 1 },
                { x: path.x, y: path.y - 1 }
            ];
    
            let validPositions = [];
    
            for (let adjTile of adjacentTiles) {
                // Check if the adjacent tile is within the map bounds
                if (adjTile.x < 0 || adjTile.x >= this.map.width || adjTile.y < 0 || adjTile.y >= this.map.height) {
                    continue;
                }

                if (groundIndexes.includes(this.tinyTownGrid[adjTile.y][adjTile.x][0]) &&
                    this.tinyTownGrid[adjTile.y][adjTile.x][1] === -1 &&
                    this.tinyTownGrid[adjTile.y][adjTile.x][2] === -1) {
                    validPositions.push(And(x.eq(adjTile.x), y.eq(adjTile.y)));
                }
            }
    
            if (validPositions.length === 0) {
                continue;
            }
    
            // Add constraint to place the sign on any of the valid positions
            this.solver.add(Or(...validPositions));
    
            // Find all solutions for this path tile's valid positions
            while (await this.solver.check() === "sat") {
                const model = this.solver.model();
                const xVal = parseInt(model.eval(x).toString());
                const yVal = parseInt(model.eval(y).toString());
                allValidCoords.push({ x: xVal, y: yVal });
                this.solver.add(Or(x.neq(xVal), y.neq(yVal)));  // Exclude current solution
            }
        }

        // Place signs at random positions within all valid positions
        if (!this.placeItemsAtRandomPositions(allValidCoords, num, item)) {
            console.log("No valid positions found for sign placement adjacent to any path.");
            return false;
        }
        return true;
    }

    async placeItemAnywhere(num = 1, item) {
        const groundIndexes = [1, 2, 3];  // Define ground indexes
        this.solver.reset();
        let [x, y] = [Int.const('x'), Int.const('y')];
        let allValidCoords = [];  // List to store all valid positions for the beehive

        let validPositions = [];
    
        // Iterate over the entire map to find all ground tiles that are empty
        for (let i = 0; i < this.map.height; i++) {
            for (let j = 0; j < this.map.width; j++) {
                if (groundIndexes.includes(this.tinyTownGrid[i][j][0]) &&
                    this.tinyTownGrid[i][j][1] === -1 &&
                    this.tinyTownGrid[i][j][2] === -1) {
                    validPositions.push(And(x.eq(j), y.eq(i)));
                }
            }
        }

        if (validPositions.length === 0) {
            console.log("No valid positions found for beehive placement. Exiting...");
            return false;
        }

        // Add constraint to place the beehive on any of the valid positions
        this.solver.add(Or(...validPositions));
    
        // Find all solutions for placing the beehive
        while (await this.solver.check() === "sat") {
            const model = this.solver.model();
            const xVal = parseInt(model.eval(x).toString());
            const yVal = parseInt(model.eval(y).toString());

            allValidCoords.push({ x: xVal, y: yVal });
            this.solver.add(Or(x.neq(xVal), y.neq(yVal)));  // Exclude current solution
        }

        // Place beehives at random positions within all valid positions
        if (!this.placeItemsAtRandomPositions(allValidCoords, num, item)) {
            console.log("No valid positions found for beehive placement.");
            return false;
        }
        return true;
    }
    
    placeItemsAtRandomPositions(validPositions, num, item) {
        if (validPositions.length > 0) {
            for (let i = 0; i < num; i++) {
                let selectedPosition = validPositions[Math.floor(Math.random() * validPositions.length)];
                this.z3Layer[selectedPosition.y][selectedPosition.x] = item;
    
                // Remove the selected position from the list to avoid duplication
                validPositions = validPositions.filter(coord => coord.x !== selectedPosition.x || coord.y !== selectedPosition.y);
            }
            return true;
        }
        return false;
    }    

    renderZ3Map() {
        this.z3Map = this.make.tilemap({
            data: this.z3Layer,
            tileWidth: this.TILESIZE,
            tileHeight: this.TILESIZE
        });
        this.z3Tileset = this.z3Map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");
        this.zlayer = this.z3Map.createLayer(0, this.z3Tileset, 0, 0);

        // remove the loading text (hide it)
        this.loadingText.alpha = 0;
    }

    getFencedAreas() {
        // Implementation that scans the map to find fenced areas

        // List of all fence indexes
        const fences = [44, 45, 46, 47, 60, 59, 57, 69, 70, 71, 81, 82];

        // Top left fence indexes
        const topLeftFence = 45;

        // Find all fenced-in areas in the map and get the dimensions of each fenced-in area

        let fencedAreas = [];

        for (let i = 0; i < this.map.height; i++) {
            for (let j = 0; j < this.map.width; j++) {
                let index = this.tinyTownGrid[i][j][2];
                if (fences.includes(index)) {
                    if (topLeftFence == index) {
                        // Currently at top left corner, 
                        // now look down until there is no more fence, that is the height, 
                        // then look right until there is no more fence, that is the width

                        let height = 0;
                        let width = 0;

                        let k = i;
                        let l = j;

                        while (fences.includes(this.tinyTownGrid[k][j][2])) {
                            height++;
                            k++;
                        }

                        while (fences.includes(this.tinyTownGrid[i][l][2])) {
                            width++;
                            l++;
                        }

                        fencedAreas.push({x: j, y: i, width: width, height: height});
                    }
                }
            }
        }
        return fencedAreas;
    }

    getTreeIndexes() {
        // Trees / Bushes / Mushrooms / Hives
        const trees = [5, 4, 17, 16, 30, 107, 2, 8, 95, 19, 20, 21, 28, 29, 32, 22, 23, 24, 35, 11, 84];

        const treeIndexes = [];

        for (let i = 0; i < this.map.height; i++) {
            for (let j = 0; j < this.map.width; j++) {
                let index = this.tinyTownGrid[i][j][1];
                if (trees.includes(index)) {
                    // List all of the coordinates of the trees
                    treeIndexes.push({x: j, y: i});
                }
            }
        }

        return treeIndexes;
    }

    getPathIndexes() {
        const notPaths = [1, 2, 3];

        const pathIndexes = [];

        for (let i = 0; i < this.map.height; i++) {
            for (let j = 0; j < this.map.width; j++) {
                let index = this.tinyTownGrid[i][j][0];
                if (!notPaths.includes(index)) {
                    // List all of the coordinates of the paths
                    pathIndexes.push({x: j, y: i});
                }
            }
        }

        return pathIndexes;
    }

    tileXtoWorld(tileX) {
        return tileX * this.TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * this.TILESIZE;
    }

    layersToGrid(layers) {
        let grid = [];
        for (let i = 0; i < this.map.height; i++) {
            grid[i] = [];
            for (let j = 0; j < this.map.width; j++) {
                grid[i][j] = [];
                for (let k = 0; k < layers.length; k++) {
                    let tile = this.map.getTileAt(j, i, true, layers[k]);
                    if (tile != null) {
                        grid[i][j].push(tile.index);
                    } else {
                        grid[i][j].push(-1);
                    }
                }
            }
        }
        return grid;
    }

    updateLoadingText() {
        // Update loading text every second
        if (this.loadingText) {
            if (this.loadingText.text.length < 13) {
                this.loadingText.text += ".";
            } else {
                this.loadingText.text = "Generating";
            }
        }
    }

    update() {;
        // Retrieve values from data or use defaults if not set

        this.numWheelbarrows = this.data.get('numWheelbarrows') || 1;
        this.numMushrooms = this.data.get('numMushrooms') || 1;
        this.numSigns = this.data.get('numSigns') || 3;
        this.numBeehives = this.data.get('numBeehives') || 1;

        // Reset changedSettings flag
        let changedSettings = this.data.get('changedSettings') || false;

        // If settings have changed, restart the scene
        if (changedSettings) {
            this.data.set('changedSettings', false);
            if (this.loadingText.alpha === 0) {
                this.scene.restart();
            } else {
                console.log("Cannot restart while generating...");
            }
        }
    }

    updateTypingDisplay() {
        const lines = this.chatText.text.split('\n');
        lines[lines.length - 1] = `Typing: ${this.userInput}`;
        this.chatText.text = lines.join('\n');
    }

    async handleChat(input) {
        // Hidden API key
        const apiKey = ''; // Replace with your API key
        const url = 'https://api.openai.com/v1/chat/completions';

        // Add user message to conversation history
        this.conversationHistory.push({ role: 'user', content: input });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: this.conversationHistory, // Send the conversation history
                }),
            });

            const data = await response.json();

            // Add assistant response to conversation history
            const botResponse = data.choices[0].message.content;
            console.log('ChatBot:', botResponse);
            this.conversationHistory.push({ role: 'assistant', content: botResponse });

            // Update the chat text
            this.chatText.text += `\nChatBot: ${botResponse}`;
        } catch (error) {
            console.error('Error:', error);
            this.chatText.text += '\nChatBot: (Error fetching response)';
        }
    }
}