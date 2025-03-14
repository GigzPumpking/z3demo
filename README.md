# Z3Demo - ChatGPT-Powered 2D Map Item Placing

## Overview
This repo is a tool that integrates ChatGPT with a text-based input system to assist in generating items on a 2D map. By using OpenAI's ChatGPT and the Z3 SMT Solver, this project enables users to dynamically place objects on a 2D map using Natural Language.

## Features
- **ChatGPT Integration**: Uses natural language prompts to generate and place items on a 2D map.
- **Z3 Solver Support**: Utilizes [Z3 Prover](https://github.com/Z3Prover/z3) for constraint solving and logical processing.
- **Interactive Text Box**: Users can enter descriptions and receive AI-generated object placements.

## Setup
### Requirements
- Node.js
- ChatGPT API key
- Z3 SMT Solver

### Installation
1. Install Node.js: https://nodejs.org/en/download
2. Clone the repository: git clone https://github.com/GigzPumpking/z3demo.git
3. Replace the empty apiKey variable (Initially '') with your own ChatGPT API key
4. Type npm run dev in the terminal
5. Click the localhost link
6. Choose from the options of Wheelbarrow / Mushroom / Sign / Beehive / Key / Bow / Arrow / Rake to place on the map (Ex: Place 12 keys) 
7. Press generate, and items should appear if apiKey set up properly.
