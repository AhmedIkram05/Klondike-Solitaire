# Klondike Solitaire

## Overview
Klondike Solitaire is a classic card game that challenges players to build four foundation piles, each representing a suit, in ascending order from Ace to King. The game is played with a standard 52-card deck and involves strategic moves to uncover and organize cards.

## Project Structure
The project is organized into the following directories and files:

```
Solitaire
├── css
│   └── styles.css          # Contains the CSS styles for the game
├── js
│   ├── card.js             # Exports the Card class for card representation
│   ├── solitaire.js         # Exports the Solitaire class for game logic
│   └── main.js             # Entry point for the application
├── index.html              # Main HTML document for the game
└── README.md               # Documentation for the project
```

## Setup Instructions
1. **Clone the Repository**: 
   ```
   git clone <repository-url>
   cd Solitaire
   ```

2. **Open the Project**: Open `index.html` in a web browser to start playing the game.

## Game Rules
- The objective is to move all cards to the foundation piles.
- Cards can be moved between tableau piles, the waste pile, and the foundation piles according to specific rules:
  - Only Kings can be placed in empty tableau spaces.
  - Cards must be placed in alternating colors and in descending order in tableau piles.
  - Foundation piles must be built in ascending order by suit.

## How to Play
1. Click on the stock pile to draw cards.
2. Move cards between tableau piles by dragging and dropping.
3. Build foundation piles by placing cards in the correct order and suit.
4. Use the "New Game" button to start a fresh game or "Undo" to revert the last move.

Enjoy playing Klondike Solitaire!