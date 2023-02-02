// Global variables ----------------------------------------------------------------------
let testTileSet, testTileMap
let tileSize = 32
let tileMapRows = 24, tileMapCols = 24

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
  }), RotationType.R4)
  testTileSet.addTile(new Tile('I.png', {
    left: ConnectionType.Blank,
    down: ConnectionType.Pipe,
    right: ConnectionType.Blank,
    up: ConnectionType.Pipe
  }), RotationType.R2)
  testTileSet.addTile(new Tile('L.png', {
    left: ConnectionType.Pipe,
    down: ConnectionType.Pipe,
    right: ConnectionType.Blank,
    up: ConnectionType.Blank
  }), RotationType.R4)
  testTileSet.addTile(new Tile('O.png', {
      left:  ConnectionType.Pipe,
      down:  ConnectionType.Blank,
      right: ConnectionType.Blank,
      up:    ConnectionType.Blank
  }), RotationType.R4)
  testTileSet.addTile(new Tile('blank.png', {
    left: ConnectionType.Blank,
    down: ConnectionType.Blank,
    right: ConnectionType.Blank,
    up: ConnectionType.Blank
  }))
  testTileSet.addTile(new Tile('all.png', {
    left:  ConnectionType.Pipe,
    down:  ConnectionType.Pipe,
    right: ConnectionType.Pipe,
    up:    ConnectionType.Pipe
  }), RotationType.R1)
  testTileSet.addTile(new Tile('B.png', {
    left:  ConnectionType.Pipe,
    down:  ConnectionType.Pipe,
    right: ConnectionType.Pipe,
    up:    ConnectionType.Pipe
  }), RotationType.R2)
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

  createButton("Play").mousePressed(() => loop())
  createButton("Step").mousePressed(() => redraw())
  createButton("Stop").mousePressed(() => noLoop())
  createButton("Reset").mousePressed(() => testTileMap.initializeTileMap())
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
  constructor(sprite, connection) {
    this.spriteFilename = sprite
    this.sprite = loadImage('tiles/' + this.spriteFilename)
    this.connectionConfig = connection
    this.rotation = 0
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

  addTile(tile, rotation = RotationType.R1) {
    rotation.forEach(angleIndex => {
      let newTile = tile.clone()
      newTile.setRotation(angleIndex)
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

    this.tileArray = new Array(rows * cols)
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
        let tile = this.tileArray[i + j * this.cols].tileSprite
        if (tile != undefined) {
          tile.draw(i * tileSize, j * tileSize, tileSize)
        }
      }
    }
  }

  initializeTileMap() {
    this.clearTileMap()
    let randomGridIndex = Math.floor(Math.random() * this.tileArray.length)
    this.collapseTile(randomGridIndex)
  }

  collapseTile(indexTile) {
    let options = this.tileArray[indexTile].options
    let validIndex = this.tileArray[indexTile].options.reduce((filtered, flag, index) => {
      if (flag) {
        filtered.push(index)
      }
      return filtered
    }, [])
    let selectedIndex = validIndex[Math.floor(Math.random() * validIndex.length)]

    this.tileArray[indexTile].tileSprite = this.tileSet.getTile(selectedIndex)
    this.tileArray[indexTile].entropy = 0
    this.tileArray[indexTile].options = []

    this.updateEntropy(indexTile)
  }

  updateTiles() {
    // Get the uncollapsed tiles and abort if theres none left
    let uncollapsedTiles = this.tileArray.filter(t => t.entropy > 0)
    if (uncollapsedTiles.length == 0) return
    // Get the tiles with lowest entropy
    let lowestEntropy = uncollapsedTiles.reduce((a, b) => a.entropy < b.entropy ? a : b).entropy
    let lowestEntropyTiles = this.tileArray.filter(t => t.entropy == lowestEntropy)
    // Randomly select a tile and collapse it
    let indexSelected = Math.floor(Math.random() * lowestEntropyTiles.length)
    let indexTile = lowestEntropyTiles[indexSelected].index
    // this.collapseTile(selectedIndex)
    this.collapseTile(indexTile)
  }

  updateEntropy(indexTile) {
    let indexNeighbour
    // Left
    if (indexTile % this.cols != 0) {
      indexNeighbour = indexTile - 1
      this.updateTileEntropy(indexNeighbour, 'right', this.tileArray[indexTile].tileSprite.connectionConfig.left)
    }
    // Down
    if (Math.trunc(indexTile / this.cols) != this.rows - 1) {
      indexNeighbour = indexTile + this.cols
      this.updateTileEntropy(indexNeighbour, 'up', this.tileArray[indexTile].tileSprite.connectionConfig.down)
    }
    // Right
    if ((indexTile + 1) % this.cols != 0) {
      indexNeighbour = indexTile + 1
      this.updateTileEntropy(indexNeighbour, 'left', this.tileArray[indexTile].tileSprite.connectionConfig.right)
    }
    // Up
    if (Math.trunc(indexTile / this.cols) != 0) {
      indexNeighbour = indexTile - this.cols
      this.updateTileEntropy(indexNeighbour, 'down', this.tileArray[indexTile].tileSprite.connectionConfig.up)
    }
  }

  updateTileEntropy(indexTile, direction, connection) {
    this.tileArray[indexTile].options.forEach((valid, index) => {
      if (valid) {
        if (this.tileSet.tileArray[index].connectionConfig[direction] != connection) {
          this.tileArray[indexTile].options[index] = false
        }
      }
    })
    this.tileArray[indexTile].entropy = this.tileArray[indexTile].options.reduce((total, element) => total += element, 0)
  }

  clearTileMap() {
    for (let i = 0; i < this.tileArray.length; i++) {
      this.tileArray[i] = {
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
        text(this.tileArray[i + j * this.cols].entropy, (i + 0.5) * tileSize, (j + 0.5) * tileSize)
        fill('lime')
        text(i + j * this.cols, (i + 0.5) * tileSize, (j + 0.5) * tileSize + 10)
      }
    }
  }

  _setupRandom() {
    for (let i = 0; i < this.tileArray.length; i++) {
      let randomIndex = Math.floor(Math.random() * this.tileSet.length)
      this.tileArray[i].tileSprite = this.tileSet.getTile(randomIndex)
    }
  }
}