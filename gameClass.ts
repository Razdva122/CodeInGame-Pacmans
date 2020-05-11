type TVisualCell = 1 | 2 | 3 | 4 | 5 | 6 | ' ' | '*' | '#' | 'o' | 'X';

type TMap = Array<Array<TVisualCell>>;

type TPacType = 'ROCK' | 'PAPER' | 'SCISSORS';

interface ICoords {
  x: number,
  y: number,
};

interface IPac {
  id: number;
  isMine: boolean;
  type: TPacType;
  pos: ICoords;
  cd: number;
  speedLeft: number;
}

type TPelletValues = 1 | 10

interface IPellet {
  pos: ICoords;
  value: TPelletValues;
}

interface IPacTypes {
  my: { [key in TPacType]: TVisualCell };
  enemy: { [key in TPacType]: TVisualCell };
}

class Game {
  CONSTS_UNITS: { [key: string]: TVisualCell } = {
    unrevealed: ' ',
    empty: '*',
    wall: '#',
    onePoint: 'o',
    tenPoints: 'X',
  }

  PACS: IPacTypes = {
    my: {
      SCISSORS : 1,
      ROCK : 3,
      PAPER : 5,
    },
    enemy: {
      SCISSORS : 2,
      ROCK : 4,
      PAPER : 6,
    }
  };

  EAT: { [key in TPacType]: TVisualCell } = {
    SCISSORS: this.PACS.enemy.PAPER,
    ROCK: this.PACS.enemy.SCISSORS,
    PAPER: this.PACS.enemy.ROCK,
  };

  canMove: { [key in TVisualCell]?: true } = {
    [this.CONSTS_UNITS.unrevealed]: true,
    [this.CONSTS_UNITS.empty]: true,
  };

  givePoints: { [key in TVisualCell]?: true } = {
    [this.CONSTS_UNITS.unrevealed]: true,
    [this.CONSTS_UNITS.onePoint]: true,
    [this.CONSTS_UNITS.tenPoints]: true,
  };

  possibleMoves: ICoords[] = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

  map: TMap;
  memoryMap: TMap;
  width: number;
  height: number;
  hashMapTenPoints: { [key: string]: ICoords } = {};
  myPacs: IPac[] = [];
  pacsTargets: { [key: string]: true } = {};
  instructions: string[] = [];

  constructor (map: TMap, width: number, height: number) {
    this.map = map;
    this.memoryMap = map;
    this.width = width;
    this.height = height;
  }

  startNewTurn(): void {
    this.myPacs = [];
    this.instructions = [];
    this.pacsTargets = {};
    this.map = this.memoryMap.map((row) => [...row]);
    this.hashMapTenPoints = {};
  }

  makeCoordsValid(coords: ICoords): ICoords {
    const updatedCoords = { ...coords };
    if (updatedCoords.x < 0) {
      updatedCoords.x = this.width + updatedCoords.x;
    } else if (updatedCoords.x >= this.width) {
      updatedCoords.x = updatedCoords.x - this.width;
    }

    if (updatedCoords.y < 0) {
      updatedCoords.y = this.height + updatedCoords.x;
    } else if (updatedCoords.y >= this.height) {
      updatedCoords.y = updatedCoords.y - this.height;
    }

    return updatedCoords;
  }

  addElementToBoard(symbol: TVisualCell, coords: ICoords, toMemory?: boolean): void {
    if (toMemory) {
      this.memoryMap[coords.y][coords.x] = symbol;
    } else {
      this.map[coords.y][coords.x] = symbol;
    }
  }

  getInfoFromPacVision(pac: IPac): void {
    this.possibleMoves.forEach((move) => {
      let counter = 1;
      let positionForCheck: ICoords = this.makeCoordsValid({
        x: pac.pos.x + move.x,
        y: pac.pos.y + move.y,
      });
      interface IFlags {
        weCheckAllPos: boolean;
        weReachWall: boolean;
      }
      const flags: IFlags = {} as IFlags;
      Object.defineProperties(flags, {
        weCheckAllPos: { get: () => positionForCheck.x === pac.pos.x && positionForCheck.y === pac.pos.y },
        weReachWall: { get: () => this.getElementFromMap(positionForCheck) === this.CONSTS_UNITS.wall },
      });
      while (!(flags.weReachWall || flags.weCheckAllPos)) {
        if (this.getElementFromMap(positionForCheck) === this.CONSTS_UNITS.unrevealed) {
          this.addElementToBoard(this.CONSTS_UNITS.empty, positionForCheck);
          this.addElementToBoard(this.CONSTS_UNITS.empty, positionForCheck, true);
        }
        counter += 1;
        positionForCheck = this.makeCoordsValid({
          x: pac.pos.x + (move.x * counter),
          y: pac.pos.y + (move.y * counter),
        });
      }
    })
  }

  getElementFromMap(coords: ICoords): TVisualCell {
    return this.map[coords.y][coords.x];
  }

  addPacToBoard(pac: IPac): void {
    if (pac.isMine) {
      this.myPacs.push(pac);
    }
    const pacSymbol = this.PACS[pac.isMine ? 'my' : 'enemy'][pac.type];
    this.addElementToBoard(pacSymbol, pac.pos);
    this.addElementToBoard(this.CONSTS_UNITS.empty, pac.pos, true);
  }

  addPelletToBoard(pellet: IPellet): void {
    let pelletSymbol;
    if (pellet.value === 1) {
      pelletSymbol = this.CONSTS_UNITS.onePoint;
    } else {
      pelletSymbol = this.CONSTS_UNITS.tenPoints;
      this.generateHashMapForTenPoints(pellet.pos);
    }
    this.addElementToBoard(pelletSymbol, pellet.pos);
  }

  generateHashMapForTenPoints(coordsBonus: ICoords): void {
    const amountOfCellsTillTenPoints = 5;
    let prevLevel: ICoords[] = [coordsBonus];
    let nextLevel: ICoords[] = [];
    for (let i = 0; i < amountOfCellsTillTenPoints; i += 1) {
      prevLevel.forEach((coords) => {
        this.hashMapTenPoints[`${coords.x} ${coords.y}`] = coordsBonus;
        nextLevel.push(...this.createPossibleMovesFromPosition(coords));
      });
      nextLevel = nextLevel.map((cell) => this.makeCoordsValid(cell))
      .filter((cell) => {
        const isNotWall = this.getElementFromMap(cell) !== this.CONSTS_UNITS.wall;
        const weWasHere = this.hashMapTenPoints[`${cell.x} ${cell.y}`];
        return isNotWall && !weWasHere;
      });
      prevLevel = nextLevel;
      nextLevel = [];
    }
    prevLevel.forEach((coords) => {
      this.hashMapTenPoints[`${coords.x} ${coords.y}`] = coordsBonus;
    });
  }

  createPossibleMovesFromPosition(pos: ICoords): ICoords[] {
    return this.possibleMoves.map((move) => {
      return {
        x: move.x + pos.x,
        y: move.y + pos.y,
      }
    })
  }

  createPacTurn(pac: IPac): void {
    if (!pac.cd) {
      this.instructions.push(`SPEED ${pac.id}`);
      return;
    }
    const memory: {[key: string]: true} = {...this.pacsTargets};
    const closeTenPoints = this.hashMapTenPoints[`${pac.pos.x} ${pac.pos.y}`];
    if (closeTenPoints && !memory[`${closeTenPoints.x} ${closeTenPoints.y}`]) {
      this.pacsTargets[`${closeTenPoints.x} ${closeTenPoints.y}`] = true;
      this.instructions.push(`MOVE ${pac.id} ${closeTenPoints.x} ${closeTenPoints.y}`);
      return;
    }
    const stack: ICoords[] = this.createPossibleMovesFromPosition(pac.pos);
    while (stack.length) {
      const checkPos = this.makeCoordsValid(stack.splice(0, 1)[0]);
      if (memory[`${checkPos.x} ${checkPos.y}`]) {
        continue;
      }

      memory[`${checkPos.x} ${checkPos.y}`] = true;
      const element = this.getElementFromMap(checkPos);

      const givePointsForThisType = {
        ...this.givePoints,
        [this.EAT[pac.type]]: true,
      };
      const canMoveForThisType = {
        ...this.canMove,
        [this.EAT[pac.type]]: true,
      };

      if (givePointsForThisType[element]) {
        this.pacsTargets[`${checkPos.x} ${checkPos.y}`] = true;
        const secondTargets = this.createPossibleMovesFromPosition(checkPos).map((pos) => this.makeCoordsValid(pos));
        const secondTarget = secondTargets.find((target) => givePointsForThisType[this.getElementFromMap(target)])
        if (secondTarget) {
          this.instructions.push(`MOVE ${pac.id} ${secondTarget.x} ${secondTarget.y}`);
        } else {
          this.instructions.push(`MOVE ${pac.id} ${checkPos.x} ${checkPos.y}`);
        }
        return;
      } else if (canMoveForThisType[element]) {
        stack.push(...this.createPossibleMovesFromPosition(checkPos))
      }
    }
    this.instructions.push(`MOVE ${pac.id} ${pac.pos.x} ${pac.pos.y}`);
  }

  makeTurn(): void {
    this.myPacs.forEach((pac) => {
      this.getInfoFromPacVision(pac);
    });
    this.myPacs.forEach((pac) => {
      this.createPacTurn(pac);
    });
    // Debug
    console.error(this.map.map((row) => row.join('')));
    // Output
    console.log(this.instructions.join('|'));
  }
}

var inputs: string[] = readline().split(' ');
const mapInput: TMap = [];
const width: number = parseInt(inputs[0]); // size of the grid
const height: number = parseInt(inputs[1]); // top left corner is (x=0, y=0)
for (let i = 0; i < height; i++) {
  const row: string = readline(); // one line of the grid: space " " is floor, pound "#" is wall
  mapInput.push(row.split('') as TVisualCell[]);
}

const game = new Game(mapInput, width, height);

while (true) {
  game.startNewTurn();
  var inputs: string[] = readline().split(' ');
  const myScore: number = parseInt(inputs[0]);
  const opponentScore: number = parseInt(inputs[1]);
  const visiblePacCount: number = parseInt(readline()); // all your pacs and enemy pacs in sight
  for (let i = 0; i < visiblePacCount; i++) {
    var inputs: string[] = readline().split(' ');
    const pacId: number = parseInt(inputs[0]); // pac number (unique within a team)
    const mine: boolean = inputs[1] !== '0'; // true if this pac is yours
    const x: number = parseInt(inputs[2]); // position in the grid
    const y: number = parseInt(inputs[3]); // position in the grid
    const typeId: TPacType = inputs[4] as TPacType;
    const abilityCooldown: number = parseInt(inputs[6]);
    const speedTurnsLeft: number = parseInt(inputs[5]);
    game.addPacToBoard({
      id: pacId,
      isMine: mine,
      pos: {
        x,
        y,
      },
      type: typeId,
      cd: abilityCooldown,
      speedLeft: speedTurnsLeft,
    });
  }

  const visiblePelletCount: number = parseInt(readline()); // all pellets in sight
  for (let i = 0; i < visiblePelletCount; i++) {
    var inputs: string[] = readline().split(' ');
    const x: number = parseInt(inputs[0]);
    const y: number = parseInt(inputs[1]);
    const value: TPelletValues = parseInt(inputs[2]) as TPelletValues; // amount of points this pellet is worth
    game.addPelletToBoard({
      pos: {
        x, 
        y,
      },
      value,
    })
  }

  game.makeTurn();
}
