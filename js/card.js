class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
        this.faceUp = false;
    }
    
    get color() {
        return this.suit === 0 || this.suit === 3 ? 'red' : 'black';
    }
    
    createHTML() {
        const element = document.createElement('div');
        element.className = `card ${this.color} ${this.faceUp ? '' : 'back'}`;
        element.dataset.rank = this.rank;
        element.dataset.suit = this.suit;
        
        if (this.faceUp) {
            const topRank = document.createElement('div');
            topRank.className = 'rank-top';
            topRank.innerHTML = this.rankSymbol() + '<span class="suit">' + this.suitSymbol() + '</span>';
            
            const center = document.createElement('div');
            center.className = 'center';
            center.innerHTML = this.suitSymbol();
            
            const bottomRank = document.createElement('div');
            bottomRank.className = 'rank-bottom';
            bottomRank.innerHTML = this.rankSymbol() + '<span class="suit">' + this.suitSymbol() + '</span>';
            
            element.appendChild(topRank);
            element.appendChild(center);
            element.appendChild(bottomRank);
        }
        
        return element;
    }
    
    rankSymbol() {
        switch (this.rank) {
            case 1: return 'A';
            case 11: return 'J';
            case 12: return 'Q';
            case 13: return 'K';
            default: return this.rank.toString();
        }
    }
    
    suitSymbol() {
        switch (this.suit) {
            case 0: return '♥';
            case 1: return '♠';
            case 2: return '♣';
            case 3: return '♦';
        }
    }
    
    flip() {
        this.faceUp = !this.faceUp;
        if (this.element) {
            this.element.className = `card ${this.color} ${this.faceUp ? '' : 'back'}`;
            this.element.innerHTML = '';
            if (this.faceUp) {
                const topRank = document.createElement('div');
                topRank.className = 'rank-top';
                topRank.innerHTML = this.rankSymbol() + '<span class="suit">' + this.suitSymbol() + '</span>';
                
                const center = document.createElement('div');
                center.className = 'center';
                center.innerHTML = this.suitSymbol();
                
                const bottomRank = document.createElement('div');
                bottomRank.className = 'rank-bottom';
                bottomRank.innerHTML = this.rankSymbol() + '<span class="suit">' + this.suitSymbol() + '</span>';
                
                this.element.appendChild(topRank);
                this.element.appendChild(center);
                this.element.appendChild(bottomRank);
            }
        }
    }
}

export default Card;