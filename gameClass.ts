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
  pacsTargets: { [key: string]: true } = {};
  instructions: string[] = [];

  constructor (map: TMap, width: number, height: number) {
    this.map = map;
    this.memoryMap = map;
    this.width = width;
    this.height = height;
  }

  startNewTurn(): void {
    this.instructions = [];
    this.pacsTargets = {};
    this.map = this.memoryMap.map((row) => [...row]);
  }

  makeCoordsValid(coords: ICoords): ICoords {
    const updatedCoords = { ...coords };
    

    return updatedCoords;
  }

  addPacToBoard(pac: IPac): void {

  }

  addPelletToBoard(pellet: IPellet): void {

  }

  makeTurn(): void {
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
  mapInput.push(row.split(''));
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
    const typeId: TPac = inputs[4] as TPac;
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