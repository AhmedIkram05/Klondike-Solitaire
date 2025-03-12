import Card from './card.js';

class Solitaire {
    constructor() {
        this.deck = [];
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.history = [];
        this.draggingCards = null;
        this.draggingElement = null;
        this.dragStartPos = {x: 0, y: 0};
        this.dragSourcePile = null;
        this.dragSourceIndex = null;
        this.movesSinceLastCheck = 0;
        this.noMovesCheckThreshold = 3;  // Check for no moves after this many unsuccessful attempts
        
        this.initDeck();
        this.setupEventListeners();
    }
    
    initDeck() {
        this.deck = [];
        for (let suit = 0; suit < 4; suit++) {
            for (let rank = 1; rank <= 13; rank++) {
                this.deck.push(new Card(rank, suit));
            }
        }
    }
    
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    setupEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('stock').addEventListener('click', () => this.drawFromStock());
        
        // Game over modal close button
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('game-over-modal').style.display = 'none';
        });
        
        // Play again button
        document.getElementById('play-again').addEventListener('click', () => {
            document.getElementById('game-over-modal').style.display = 'none';
            this.newGame();
        });
        
        // Setup drop targets
        document.querySelectorAll('.foundation, .tableau-pile, .waste').forEach(pile => {
            pile.addEventListener('dragover', e => this.handleDragOver(e));
            pile.addEventListener('drop', e => this.handleDrop(e, pile));
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.draggingElement) {
                // Find element underneath
                this.draggingElement.style.display = 'none';
                const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
                this.draggingElement.style.display = 'block';
                
                const targetPile = elemBelow?.closest('.pile');
                this.endDrag(targetPile?.id || null);
            }
        });
    }
    
    newGame() {
        this.clearPiles();
        this.initDeck();
        this.shuffleDeck();
        this.deal();
        this.render();
        this.history = [];
    }
    
    clearPiles() {
        this.stock = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        
        document.querySelectorAll('.pile').forEach(pile => {
            pile.innerHTML = '';
        });
    }
    
    deal() {
        // Deal cards to tableau
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.pop();
                if (i === j) {
                    card.faceUp = true;
                }
                this.tableau[j].push(card);
            }
        }
        
        // Remaining cards go to stock
        this.stock = this.deck.slice();
        this.deck = [];
    }
    
    render() {
        this.renderStock();
        this.renderWaste();
        this.renderFoundations();
        this.renderTableau();
    }
    
    renderStock() {
        const pile = document.getElementById('stock');
        pile.innerHTML = '';
        
        if (this.stock.length > 0) {
            const card = this.stock[this.stock.length - 1];
            card.faceUp = false;
            const element = card.createHTML();
            pile.appendChild(element);
        }
    }
    
    renderWaste() {
        const pile = document.getElementById('waste');
        pile.innerHTML = '';
        
        if (this.waste.length > 0) {
            const card = this.waste[this.waste.length - 1];
            card.faceUp = true;
            const element = card.createHTML();
            pile.appendChild(element);
            this.setupDraggable(element, 'waste', this.waste.length - 1);
        }
    }
    
    renderFoundations() {
        for (let i = 0; i < 4; i++) {
            const pile = document.getElementById(`foundation-${i}`);
            pile.innerHTML = '';
            
            if (this.foundations[i].length > 0) {
                const card = this.foundations[i][this.foundations[i].length - 1];
                card.faceUp = true;
                const element = card.createHTML();
                pile.appendChild(element);
                this.setupDraggable(element, `foundation-${i}`, this.foundations[i].length - 1);
            }
        }
    }
    
    renderTableau() {
        for (let i = 0; i < 7; i++) {
            const pile = document.getElementById(`tableau-${i}`);
            pile.innerHTML = '';
            
            this.tableau[i].forEach((card, index) => {
                const element = card.createHTML();
                element.style.top = (index * 20) + 'px';
                pile.appendChild(element);
                
                if (card.faceUp) {
                    this.setupDraggable(element, `tableau-${i}`, index);
                }
            });
        }
    }
    
    setupDraggable(element, pileId, index) {
        element.draggable = true;
        
        element.addEventListener('mousedown', e => {
            if (!element.draggable) return;
            e.preventDefault();
            
            const rect = element.getBoundingClientRect();
            this.dragStartPos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            this.startDrag(pileId, index, e);
        });
        
        element.addEventListener('dragstart', e => {
            // Needed for Firefox
            e.dataTransfer.setData('text', pileId + ':' + index);
            
            // Make drag image transparent
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(img, 0, 0);
        });
    }
    
    startDrag(pileId, index, event) {
        let cards;
        let pile;
        
        if (pileId === 'waste') {
            cards = [this.waste[this.waste.length - 1]];
            pile = this.waste;
        } else if (pileId.startsWith('foundation-')) {
            const foundationIndex = parseInt(pileId.split('-')[1]);
            cards = [this.foundations[foundationIndex][this.foundations[foundationIndex].length - 1]];
            pile = this.foundations[foundationIndex];
        } else if (pileId.startsWith('tableau-')) {
            const tableauIndex = parseInt(pileId.split('-')[1]);
            cards = this.tableau[tableauIndex].slice(index);
            pile = this.tableau[tableauIndex];
        }
        
        if (!cards || !cards.every(card => card.faceUp)) return;
        
        this.draggingCards = cards;
        this.dragSourcePile = pileId;
        this.dragSourceIndex = index;
        
        // Create drag representation
        this.draggingElement = document.createElement('div');
        this.draggingElement.className = 'dragging-cards';
        this.draggingElement.style.position = 'fixed';
        this.draggingElement.style.pointerEvents = 'none';
        this.draggingElement.style.zIndex = '1000';
        
        cards.forEach((card, i) => {
            const cardElement = card.createHTML().cloneNode(true);
            cardElement.style.position = 'absolute';
            cardElement.style.top = (i * 20) + 'px';
            cardElement.style.left = '0px';
            this.draggingElement.appendChild(cardElement);
        });
        
        document.body.appendChild(this.draggingElement);
        
        this.updateDragPosition(event.clientX, event.clientY);
        
        document.addEventListener('mousemove', this.handleMouseMove);
    }
    
    handleMouseMove = (e) => {
        if (this.draggingElement) {
            this.updateDragPosition(e.clientX, e.clientY);
        }
    }
    
    updateDragPosition(x, y) {
        if (this.draggingElement) {
            this.draggingElement.style.left = (x - this.dragStartPos.x) + 'px';
            this.draggingElement.style.top = (y - this.dragStartPos.y) + 'px';
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        return false;
    }
    
    handleDrop(e, targetPile) {
        e.preventDefault();
        
        if (!this.draggingCards) return;
        
        const targetId = targetPile.id;
        this.endDrag(targetId);
    }
    
    endDrag(targetId) {
        document.removeEventListener('mousemove', this.handleMouseMove);
        
        if (this.draggingElement) {
            document.body.removeChild(this.draggingElement);
            this.draggingElement = null;
        }
        
        if (!this.draggingCards || !targetId) {
            this.draggingCards = null;
            this.dragSourcePile = null;
            this.dragSourceIndex = null;
            return;
        }
        
        this.tryMoveCards(this.dragSourcePile, this.dragSourceIndex, targetId);
        
        this.draggingCards = null;
        this.dragSourcePile = null;
        this.dragSourceIndex = null;
    }
    
    tryMoveCards(sourcePile, sourceIndex, targetId) {
        let cards;
        
        // Get source cards
        if (sourcePile === 'waste') {
            cards = [this.waste[this.waste.length - 1]];
        } else if (sourcePile.startsWith('foundation-')) {
            const foundationIndex = parseInt(sourcePile.split('-')[1]);
            cards = [this.foundations[foundationIndex][this.foundations[foundationIndex].length - 1]];
        } else if (sourcePile.startsWith('tableau-')) {
            const tableauIndex = parseInt(sourcePile.split('-')[1]);
            cards = this.tableau[tableauIndex].slice(sourceIndex);
        }
        
        // Try to move to target pile
        let moved = false;
        if (targetId.startsWith('foundation-')) {
            const foundationIndex = parseInt(targetId.split('-')[1]);
            moved = this.tryMoveToFoundation(cards, foundationIndex);
        } else if (targetId.startsWith('tableau-')) {
            const tableauIndex = parseInt(targetId.split('-')[1]);
            moved = this.tryMoveToTableau(cards, tableauIndex);
        }
        
        if (moved) {
            // Remove cards from source
            if (sourcePile === 'waste') {
                this.waste.pop();
            } else if (sourcePile.startsWith('foundation-')) {
                const foundationIndex = parseInt(sourcePile.split('-')[1]);
                this.foundations[foundationIndex].pop();
            } else if (sourcePile.startsWith('tableau-')) {
                const tableauIndex = parseInt(sourcePile.split('-')[1]);
                this.tableau[tableauIndex].splice(sourceIndex);
                
                // Flip the new top card if needed
                if (this.tableau[tableauIndex].length > 0 && 
                    !this.tableau[tableauIndex][this.tableau[tableauIndex].length - 1].faceUp) {
                    this.tableau[tableauIndex][this.tableau[tableauIndex].length - 1].flip();
                }
            }
            
            // Save state for undo
            this.saveState();
            this.render();
            
            // Reset the counter since a successful move was made
            this.movesSinceLastCheck = 0;
            
            // Check for win
            this.checkForWin();
        } else {
            // Increment counter for unsuccessful move attempts
            this.movesSinceLastCheck++;
            if (this.movesSinceLastCheck >= this.noMovesCheckThreshold) {
                this.checkForNoMoves();
                this.movesSinceLastCheck = 0;
            }
        }
    }
    
    tryMoveToFoundation(cards, foundationIndex) {
        if (cards.length !== 1) return false;
        
        const card = cards[0];
        const foundation = this.foundations[foundationIndex];
        
        // Can only place Ace on empty foundation
        if (foundation.length === 0) {
            if (card.rank === 1) {
                foundation.push(card);
                return true;
            }
            return false;
        }
        
        // Can only place next rank of same suit
        const topCard = foundation[foundation.length - 1];
        if (card.suit === topCard.suit && card.rank === topCard.rank + 1) {
            foundation.push(card);
            return true;
        }
        
        return false;
    }
    
    tryMoveToTableau(cards, tableauIndex) {
        const tableau = this.tableau[tableauIndex];
        
        // Can place King on empty tableau
        if (tableau.length === 0) {
            if (cards[0].rank === 13) {
                tableau.push(...cards);
                return true;
            }
            return false;
        }
        
        // Can place card of opposite color and one rank lower
        const topCard = tableau[tableau.length - 1];
        if (cards[0].color !== topCard.color && cards[0].rank === topCard.rank - 1) {
            tableau.push(...cards);
            return true;
        }
        
        return false;
    }
    
    drawFromStock() {
        if (this.stock.length === 0) {
            // Recycle waste back into stock when empty
            if (this.waste.length > 0) {
                this.stock = this.waste.slice().reverse();
                this.waste = [];
                this.stock.forEach(card => card.faceUp = false);
                this.saveState();
                this.movesSinceLastCheck = 0;  // Reset counter after recycling
            } else {
                // If stock and waste are both empty, check if any moves are possible
                this.movesSinceLastCheck++;
                if (this.movesSinceLastCheck >= this.noMovesCheckThreshold) {
                    this.checkForNoMoves();
                    this.movesSinceLastCheck = 0;
                }
            }
        } else {
            // Draw one card from stock to waste
            const card = this.stock.pop();
            card.faceUp = true;
            this.waste.push(card);
            this.saveState();
            this.movesSinceLastCheck = 0;  // Reset counter after drawing
        }
        this.render();
    }
    
    saveState() {
        // Save the current game state for undo functionality
    }
    
    undo() {
        // Implement undo functionality
    }
    
    checkForWin() {
        // Game is won when all foundations have 13 cards each
        const isWin = this.foundations.every(foundation => foundation.length === 13);
        
        if (isWin) {
            this.showGameOverMessage(true);
        }
        
        return isWin;
    }
    
    checkForNoMoves() {
        // Only check if we still have cards to play
        if (this.stock.length > 0 || this.waste.length > 0) {
            return false;
        }
        
        // Check if any card can be moved to foundations
        const allCards = [
            ...this.waste,
            ...this.foundations.flat(),
            ...this.tableau.flat().filter(card => card.faceUp)
        ];
        
        for (const card of allCards) {
            // Check if card can be moved to any foundation
            for (let i = 0; i < 4; i++) {
                if (this.canAddToFoundation(card, i)) {
                    return false;
                }
            }
        }
        
        // Check if cards can be moved between tableau piles
        for (let sourceIdx = 0; sourceIdx < 7; sourceIdx++) {
            const sourcePile = this.tableau[sourceIdx];
            for (let cardIdx = 0; cardIdx < sourcePile.length; cardIdx++) {
                if (!sourcePile[cardIdx].faceUp) continue;
                
                const cards = sourcePile.slice(cardIdx);
                
                for (let targetIdx = 0; targetIdx < 7; targetIdx++) {
                    if (sourceIdx === targetIdx) continue;
                    if (this.canAddToTableau(cards[0], targetIdx)) {
                        return false;
                    }
                }
            }
        }
        
        // If we get here, no moves are possible
        // Check if we've won (all cards in foundations) or lost (some cards not in foundations)
        const isWin = this.foundations.flat().length === 52;
        
        if (!isWin) {
            this.showGameOverMessage(false);
        }
        
        return true;
    }
    
    canAddToFoundation(card, foundationIndex) {
        const foundation = this.foundations[foundationIndex];
        
        if (foundation.length === 0) {
            return card.rank === 1; // Can place Ace on empty foundation
        }
        
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && card.rank === topCard.rank + 1;
    }
    
    canAddToTableau(card, tableauIndex) {
        const tableau = this.tableau[tableauIndex];
        
        if (tableau.length === 0) {
            return card.rank === 13; // Can place King on empty tableau
        }
        
        const topCard = tableau[tableau.length - 1];
        return card.color !== topCard.color && card.rank === topCard.rank - 1;
    }
    
    showGameOverMessage(isWin) {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('game-over-title');
        const message = document.getElementById('game-over-message');
        
        if (isWin) {
            title.textContent = 'Congratulations!';
            message.textContent = 'Well done! You completed the game successfully!';
        } else {
            title.textContent = 'Game Over';
            message.textContent = 'No more moves are possible. You were not able to complete the game.';
        }
        
        modal.style.display = 'block';
    }
}

export default Solitaire;