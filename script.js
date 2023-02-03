// Global variables ----------------------------------------------------------------------
let testTileSet, testTileMap
let tileSize = 16
let tileMapRows = 64, tileMapCols = 64

let canvasBackgroundColor = '#fff0ff'
let canvasWidth = tileSize * tileMapCols, canvasHeight = tileSize * tileMapRows

const ConnectionType = {
  Blank: 0,
  Pipe: 1
}

const RotationType = {
  R1: [0], // No rotation. Eg. 0
  R2: [0, 1], // One variant rotation. Eg. I
  R4: [0, 1, 2, 3], // Three variant rotations. Eg. T, L
}

let debugRotate = 0

// Setup ---------------------------------------------------------------------------------
function preload() {
  testTileSet = new TileSet(tileSize)
  testTileSet.addTile(new Tile('T.png', {
    left: ConnectionType.Pipe,
    down: ConnectionType.Pipe,
    right: ConnectionType.Blank,
    up: ConnectionType.Pipe
  }), RotationType.R4, 1)
  testTileSet.addTile(new Tile('I.png', {
    left: ConnectionType.Blank,
    down: ConnectionType.Pipe,
    right: ConnectionType.Blank,
    up: ConnectionType.Pipe
  }), RotationType.R2, 0)
  testTileSet.addTile(new Tile('L.png', {
    left: ConnectionType.Pipe,
    down: ConnectionType.Pipe,
    right: ConnectionType.Blank,
    up: ConnectionType.Blank
  }), RotationType.R4, 0)
  testTileSet.addTile(new Tile('O.png', {
    left: ConnectionType.Pipe,
    down: ConnectionType.Blank,
    right: ConnectionType.Blank,
    up: ConnectionType.Blank
  }), RotationType.R4, 0)
  testTileSet.addTile(new Tile('blank.png', {
    left: ConnectionType.Blank,
    down: ConnectionType.Blank,
    right: ConnectionType.Blank,
    up: ConnectionType.Blank
  }), RotationType.R1, 10)
  testTileSet.addTile(new Tile('all.png', {
    left: ConnectionType.Pipe,
    down: ConnectionType.Pipe,
    right: ConnectionType.Pipe,
    up: ConnectionType.Pipe
  }), RotationType.R1, 0)
  testTileSet.addTile(new Tile('B.png', {
    left: ConnectionType.Pipe,
    down: ConnectionType.Pipe,
    right: ConnectionType.Pipe,
    up: ConnectionType.Pipe
  }), RotationType.R2, 0)
}

// Setup ---------------------------------------------------------------------------------
function setup() {
  let canvasElement = createCanvas(canvasWidth, canvasHeight);
  canvasElement.parent('#main-div')
  canvasElement.class('d-block mx-auto')
  background(canvasBackgroundColor);

  testTileMap = new TileMap(tileMapRows, tileMapCols, testTileSet)
  testTileMap.initializeTileMap()
  noLoop()

  createButton("Play").parent('#main-div').mousePressed(() => loop())
  createButton("Step").parent('#main-div').mousePressed(() => redraw())
  createButton("Stop").parent('#main-div').mousePressed(() => noLoop())
  createButton("Reset").parent('#main-div').mousePressed(() => testTileMap.initializeTileMap())
}

// Draw ----------------------------------------------------------------------------------
function draw() {
  background(canvasBackgroundColor);

  // testTileMap.drawGrid()
  testTileMap.drawTiles()
  // testTileMap._drawEntropy()

  testTileMap.updateTiles()
}

// Tile Class ----------------------------------------------------------------------------
class Tile {
  constructor(sprite, connection, weight) {
    this.spriteFilename = sprite
    this.sprite = loadImage('tiles/' + this.spriteFilename)
    this.connectionConfig = connection
    this.rotation = 0
    this.weight = weight
  }

  setRotation(rotationIndex) {
    if (rotationIndex == 0) return
    // All rotations are 90° CW
    this.rotation = rotationIndex * HALF_PI

    let connectionValues = Object.values(this.connectionConfig)
    for (let i = 0; i < rotationIndex; i++) {
      connectionValues.push(connectionValues.shift())
    }

    let newConfig = Object.entries(this.connectionConfig)
    newConfig.forEach((entry, index) => {
      entry[1] = connectionValues[index]
    })
    this.connectionConfig = Object.fromEntries(newConfig)
  }

  setWeight(weight) {
    this.weight = weight
  }

  clone() {
    return new Tile(this.spriteFilename, this.connectionConfig)
  }

  draw(x, y, size) {
    let drawSize = size ? size : this.sprite.width
    push()
    imageMode(CENTER)
    translate(x + 0.5 * drawSize, y + 0.5 * drawSize)
    rotate(this.rotation)
    image(this.sprite, 0, 0, drawSize, drawSize)
    pop()
  }
}

// TileSet Class -------------------------------------------------------------------------
class TileSet {
  constructor(size, tiles) {
    this.tileSize = size
    this.tileArray = tiles ? tiles : []
    this.length = this.tileArray.length
  }

  addTile(tile, rotation = RotationType.R1, weight = 1) {
    rotation.forEach(angleIndex => {
      let newTile = tile.clone()
      newTile.setRotation(angleIndex)
      newTile.setWeight(weight)
      this.tileArray.push(newTile)
    })
    this.length = this.tileArray.length
  }

  getTile(n) {
    return this.tileArray[n]
  }

  _drawAllTiles() {
    this.tileArray.forEach((s, i) => {
      s.draw(this.tileSize * i, 0, this.tileSize)
    })
  }

  _drawTestTile(n, x, y) {
    this.tileArray[n].draw(x, y, this.tileSize)
  }
}

// TileMap Class -------------------------------------------------------------------------
class TileMap {
  constructor(rows, cols, tileSet) {
    this.rows = rows
    this.cols = cols
    this.tileSet = tileSet

    this.tileMapArray = new Array(rows * cols)
    this.clearTileMap()
  }

  drawGrid() {
    stroke('lightgrey')
    strokeWeight(1)
    fill('skyblue')
    let tileSize = this.tileSet.tileSize
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        square(i * tileSize, j * tileSize, tileSize)
      }
    }
  }

  drawTiles() {
    let tileSize = this.tileSet.tileSize
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        let tile = this.tileMapArray[i + j * this.cols].tileSprite
        if (tile != undefined) {
          tile.draw(i * tileSize, j * tileSize, tileSize)
        }
      }
    }
  }

  initializeTileMap() {
    this.clearTileMap()
    let randomGridIndex = randomNumber(this.tileMapArray.length)
    this.collapseTile(randomGridIndex)
  }

  collapseTile(indexTile) {
    let validTiles = this.tileMapArray[indexTile].options.reduce((filtered, flag, index) => {
      if (flag) {
        filtered.push(this.tileSet.tileArray[index])
      }
      return filtered
    }, [])
    let selectedTileIndex = this.randomTileChoice(validTiles)
    
    this.tileMapArray[indexTile].tileSprite = validTiles[selectedTileIndex]
    this.tileMapArray[indexTile].entropy = 0
    this.tileMapArray[indexTile].options = []

    this.updateEntropy(indexTile)
  }

  updateTiles() {
    // Get the uncollapsed tiles and abort if theres none left
    let uncollapsedTiles = this.tileMapArray.filter(t => t.entropy > 0)
    if (uncollapsedTiles.length == 0) return

    // Get the tiles with lowest entropy
    let lowestEntropy = uncollapsedTiles.reduce((a, b) => a.entropy < b.entropy ? a : b).entropy
    let lowestEntropyTiles = this.tileMapArray.filter(t => t.entropy == lowestEntropy)
    
    // Randomly select a tile and collapse it
    let indexSelected = randomNumber(lowestEntropyTiles.length)
    let indexTile = lowestEntropyTiles[indexSelected].index
    this.collapseTile(indexTile)
  }

  randomTileChoice(choices) {
    let weights = choices.map(tile => tile.weight)
    let choiceIndex = randomChoice(weights)
    return choiceIndex
  }

  updateEntropy(indexTile) {
    let indexNeighbour
    // Left
    if (indexTile % this.cols != 0) {
      indexNeighbour = indexTile - 1
      this.updateTileEntropy(indexNeighbour, 'right', this.tileMapArray[indexTile].tileSprite.connectionConfig.left)
    }

    // Down
    if (Math.trunc(indexTile / this.cols) != this.rows - 1) {
      indexNeighbour = indexTile + this.cols
      this.updateTileEntropy(indexNeighbour, 'up', this.tileMapArray[indexTile].tileSprite.connectionConfig.down)
    }

    // Right
    if ((indexTile + 1) % this.cols != 0) {
      indexNeighbour = indexTile + 1
      this.updateTileEntropy(indexNeighbour, 'left', this.tileMapArray[indexTile].tileSprite.connectionConfig.right)
    }

    // Up
    if (Math.trunc(indexTile / this.cols) != 0) {
      indexNeighbour = indexTile - this.cols
      this.updateTileEntropy(indexNeighbour, 'down', this.tileMapArray[indexTile].tileSprite.connectionConfig.up)
    }
  }

  updateTileEntropy(indexTile, direction, connection) {
    this.tileMapArray[indexTile].options.forEach((valid, index) => {
      if (valid) {
        if (this.tileSet.tileArray[index].connectionConfig[direction] != connection) {
          this.tileMapArray[indexTile].options[index] = false
        }
      }
    })
    this.tileMapArray[indexTile].entropy = this.tileMapArray[indexTile].options.reduce((total, element) => total += element, 0)
  }

  clearTileMap() {
    for (let i = 0; i < this.tileMapArray.length; i++) {
      this.tileMapArray[i] = {
        tileSprite: undefined,
        entropy: this.tileSet.length,
        options: new Array(this.tileSet.length).fill(true),
        index: i
      }
    }
  }

  // Debugging functions
  _drawAllTiles() {
    this.tileSet._drawAllTiles()
  }

  _drawEntropy() {
    noStroke()
    textAlign(CENTER, CENTER)
    let tileSize = this.tileSet.tileSize
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        fill('yellow')
        text(this.tileMapArray[i + j * this.cols].entropy, (i + 0.5) * tileSize, (j + 0.5) * tileSize)
        fill('lime')
        text(i + j * this.cols, (i + 0.5) * tileSize, (j + 0.5) * tileSize + 10)
      }
    }
  }

  _setupRandom() {
    for (let i = 0; i < this.tileMapArray.length; i++) {
      let randomIndex = randomNumber(this.tileSet.length)
      this.tileMapArray[i].tileSprite = this.tileSet.getTile(randomIndex)
    }
  }
}

// Aux functions -------------------------------------------------------------------------
function randomNumber(maxNumber) {
  return Math.floor(Math.random() * maxNumber)
}

function randomChoice(weights) {
  let cumulativeProbability = weights.map((sum = 0, n => sum += n))
  let total = cumulativeProbability.slice(-1)
  let treshold = Math.random() * total

  for (let i = 0; i < cumulativeProbability.length; i++) {
    if (cumulativeProbability[i] > treshold) {
      return i
    }
  }
}