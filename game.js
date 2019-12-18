(function() {
  const COW = "cow";
  const ROAD = "road";
  const COLLECTOR = "collector";
  const PILL = "pill";
  const CREDIT = "credit";
  const PLAYER = "player";
  const EXPENSES = "expenses";
  const MAXX = 13;
  const MAXY = 6;
  const CELLSIZE = 80;

  const ROADprice = 10;
  const COWreward = 25;
  const COLLECTORtakes = 30;
  const COLLECTORbites = 10;
  const PILLprice = 50;
  const PILLheals = 10;
  const CREDITdebt = 500;
  const CREDITpay = 50;
  const EXPENSEScost = 30;

  // first 20 sec only cows
  // next 20 sec some roads
  // next 20 sec more roads
  // next 20 sec more cows
  // next 20 sec add pills
  // const genPlan = [
  //   [1, COW],
  //   [20, COW],
  //   [40, ROAD],
  //   [60, ROAD],
  //   [80, COW],
  //   [90, CREDIT],
  //   [100, PILL],
  //   [120, COW],
  //   [140, ROAD],
  //   [150, CREDIT],
  //   [160, ROAD],
  //   [190, COW],
  //   [200, CREDIT],
  //   [210, PILL]
  // ];
  const genPlan = [
    [1, ROAD],
    [30, EXPENSES],
    //    [60, PILL],
    [60, ROAD],
    //    [90, PILL],
    [90, EXPENSES]
    //    [120, PILL]
  ];
  let currentPhase = 0;
  let startingTimeForPhase = 0;
  const config = {
    move: false,
    dir: { x: 0, y: 0 }
  };
  let player = {
    cash: 1000,
    debt: 800,
    health: 100,
    monthlyPay: 100,
    screenObj: null
  };
  let gameObjects = [];
  let moneyChangeMultiplier = 1;
  let gameOverFlag = false;

  const rootEl = document.getElementById("root");
  const cashEl = document.getElementById("cash");
  const debtEl = document.getElementById("debt");
  const payEl = document.getElementById("pay");
  const healthEl = document.getElementById("health");
  const dayEl = document.getElementById("day");
  const paydayEl = document.getElementById("payday");
  const startBtn = document.getElementById("start-button");
  const gameFieldEl = document.getElementById("game-field");

  let mainTimer = null;
  let playerTimer = null;
  let daysCounter = 1;
  let totalDaysCounter = 1;

  gameFieldEl.style.width = MAXX * CELLSIZE + "px";
  gameFieldEl.style.height = MAXY * CELLSIZE + "px";

  init();

  startBtn.onclick = function() {
    startBtn.style.visibility = "hidden";
    mainTimer = setTimeout(gameLoop, 1000);
    // playerTimer = setInterval(playerLoop, 90);
  };

  function gameLoop() {
    if (player.health <= 0) {
      gameOver();
    }
    if (player.cash > 0) {
      player.cash -= 1;
    }
    if (player.cash <= 0) {
      player.health--;
    }
    if (player.cash <= 150 || player.cash <= 0) {
      addObject(CREDIT, 1, 0);
    }
    if (player.health < 100) {
      addObject(PILL, 2, 0);
    }

    // do things...
    // if (totalDaysCounter % 2 === 0) {
    // addPlannedObjects(COW);
    addPlannedObjects(ROAD);
    // addPlannedObjects(PILL);
    // addPlannedObjects(CREDIT);
    addPlannedObjects(EXPENSES);
    //}

    //if (totalDaysCounter % 2 === 0) {
    // TODO: every cow need 1 or 2 roads
    // or 1 expenses
    // player have roads and expenses storage
    // when he takes a cow he lose collected roads and expenses
    // exactly how many a cow needs !
    addObject(COW, 1, 0);
    //}

    showCashAndDebt();
    returnDebt();

    gotoNextPhase();

    daysCounter++;
    totalDaysCounter++;
    if (daysCounter === 31) {
      daysCounter = 1;
      removeObjects();
    }
    // every second is a day
    if (!gameOverFlag) {
      // TODO: decide what to do so player will not stay still
      mainTimer = setTimeout(gameLoop, 650);
    }
  }

  function removeObjects() {
    for (var i = 0; i < gameObjects.length; i++) {
      if (gameObjects[i].type !== COLLECTOR) {
        removeGameObject(gameObjects[i]);
      }
    }
    gameObjects = gameObjects.filter(go => go.type === COLLECTOR);
  }

  function gotoNextPhase() {
    if (currentPhase + 1 > genPlan.length - 1) {
      currentPhase = 0;
      startingTimeForPhase = totalDaysCounter;
      return;
    }
    if (
      totalDaysCounter ===
      genPlan[currentPhase + 1][0] + startingTimeForPhase
    ) {
      currentPhase++;
    }
  }

  function removeObject({ x, y }) {
    let objNumToRemove = -1;
    let objToRemove = null;
    for (var i = 0; i < gameObjects.length; i++) {
      if (gameObjects[i].x === x && gameObjects[i].y === y) {
        objNumToRemove = i;
        objToRemove = gameObjects[i];
        break;
      }
    }
    if (objNumToRemove >= 0) {
      removeGameObject(objToRemove);
      gameObjects.splice(objNumToRemove, 1);
    }
  }

  function removeGameObject(gameObject) {
    gameObject.div.parentNode.removeChild(gameObject.div);
  }

  function playerLoop() {
    // if (config.move) {
    const newX = player.x + config.dir.x;
    const newY = player.y + config.dir.y;
    if (newX >= 0 && newX < MAXX && newY >= 0 && newY <= MAXY - 1) {
      const objType = getObjectAtCoords({ x: newX, y: newY });
      if (!canMove(objType)) {
        return;
      }
      if (objType !== "") {
        removeObject({ x: newX, y: newY });
      }
      switch (objType) {
        case COW:
          player.cash += COWreward;
          break;
        case ROAD:
          player.cash -= ROADprice;
          break;
        case COLLECTOR:
          player.cash -= COLLECTORtakes;
          player.health -= COLLECTORbites;
          break;
        case PILL:
          player.cash -= PILLprice;
          if (player.health < 100) {
            player.health += PILLheals;
            if (player.health > 100) {
              player.health = 100;
            }
          }
          break;
        case CREDIT:
          player.cash += CREDITdebt;
          player.debt += CREDITdebt;
          player.monthlyPay += CREDITpay;
          break;
        case EXPENSES:
          player.cash -= EXPENSEScost;
        default:
          break;
      }
      player.cash -= 2;
      if (player.cash < 0) {
        player.cash = 0;
      }
      player.x = newX;
      player.y = newY;
      player.screenObj.div.style.left = player.x * CELLSIZE + "px";
      player.screenObj.div.style.top = player.y * CELLSIZE + "px";

      showCashAndDebt();
    }
    // }
  }

  function canMove(type) {
    let result = true;
    switch (type) {
      case ROAD:
        if (player.cash - ROADprice < 0) {
          result = false;
        }
        break;
      case PILL:
        if (player.cash - PILLprice < 0) {
          result = false;
        }
        break;
      case EXPENSES:
        if (player.cash - EXPENSEScost < 0) {
          result = false;
        }
        break;
      default:
        break;
    }
    return result;
  }

  function gameOver() {
    gameOverFlag = true;
    clearInterval(playerTimer);
    clearTimeout(mainTimer);
    startBtn.innerText = "GAME OVER. RESTART?";
    startBtn.style.visibility = "visible";
  }

  function ScreenObject(x, y, type, text = "") {
    return {
      type,
      x,
      y,
      div: addDivWithImg(x, y, type, text)
    };
  }

  function addDivWithImg(x, y, type, text = "") {
    const newDiv = document.createElement("div");
    newDiv.style.width = CELLSIZE;
    newDiv.style.height = CELLSIZE;
    newDiv.style.top = y * CELLSIZE;
    newDiv.style.left = x * CELLSIZE;
    newDiv.className = "game-object";
    newDiv.innerText = text;
    newDiv.parentElement = gameFieldEl;

    if (type === CREDIT) {
      newDiv.className += " credit";
    } else {
      newDiv.style.backgroundImage = `url(img/${type}.png)`;
      newDiv.style.backgroundSize = "contain";
      newDiv.style.backgroundRepeat = "no-repeat";
    }

    gameFieldEl.appendChild(newDiv);
    return newDiv;
  }

  function createPlayer() {
    player.x = 0;
    player.y = 2;
    player.screenObj = new ScreenObject(player.x, player.y, PLAYER);
  }

  function createObj(type, overwrite = false) {
    if (!overwrite && gameObjects.length === MAXX * MAXY - 1) return;
    let coords;
    if (overwrite) {
      do {
        coords = getNewPos();
      } while (player.x === coords.x && player.y === coords.y);
      removeObject(coords);
    } else {
      do {
        coords = getNewPos();
      } while (getObjectAtCoords(coords) !== "");
    }
    gameObjects.push(new ScreenObject(coords.x, coords.y, type));
  }

  function getObjectAtCoords({ x, y }) {
    let objName = "";
    if (player.x === x && player.y === y) {
      return PLAYER;
    }
    for (var i = 0; i < gameObjects.length; i++) {
      if (gameObjects[i].x === x && gameObjects[i].y === y) {
        objName = gameObjects[i].type;
        break;
      }
    }
    return objName;
  }

  function init() {
    currentPhase = 0;
    startingTimeForPhase = 0;
    player = {
      cash: 1000,
      debt: 800,
      health: 100,
      monthlyPay: 100
    };
    gameObjects = [];
    moneyChangeMultiplier = 1;
    gameOverFlag = false;
    // createGameField();
    document.addEventListener("keydown", keysHandler.bind(config));
    //document.addEventListener("keyup", keysHandler.bind(config));
    createPlayer();
    showCashAndDebt();
  }

  function returnDebt() {
    if (daysCounter === 30 && player.debt > 0) {
      if (player.cash < player.monthlyPay) {
        addCollectors();
      }
      if (player.cash > player.monthlyPay) {
        player.cash -= player.monthlyPay;
        player.debt -= player.monthlyPay;
      }
      if (player.debt < 0) {
        player.cash += -player.debt;
        player.debt = 0;
      }
      if (player.cash < 0) {
        player.cash = 0;
      }
    }
  }

  function addCollectors() {
    const howMany = Utils.getRandomInt(1, 25);
    for (var i = 0; i < howMany; i++) {
      createObj(COLLECTOR, true);
    }
  }

  function showCashAndDebt() {
    cashEl.innerText = player.cash;
    debtEl.innerText = player.debt;
    payEl.innerText = player.monthlyPay;
    healthEl.innerText = player.health;
    dayEl.innerText = totalDaysCounter;
    paydayEl.innerText = 30 - daysCounter;
  }

  function getNewPos() {
    return {
      x: Utils.getRandomInt(0, 12),
      y: Utils.getRandomInt(0, 5)
    };
  }

  function addObject(type, max, min = 1) {
    const howMany = Utils.getRandomInt(min, max);
    for (var i = 0; i < howMany; i++) {
      createObj(type);
    }
  }

  function addPlannedObjects(type) {
    if (genPlan[currentPhase][1] !== type) return;
    if (type !== COW) {
      addObject(type, 4);
    }
    // if (type === COW) {
    //     addObject(type, 2, 0);
    // } else {
    //     addObject(type, 6);
    // }
  }

  function keysHandler(event) {
    if (event.type == "keydown") {
      switch (event.keyCode) {
        case Utils.KEY_CODE.LEFT:
          this.dir = { x: -1, y: 0 };
          this.move = true;
          break;
        case Utils.KEY_CODE.UP:
          this.dir = { x: 0, y: -1 };
          this.move = true;
          break;
        case Utils.KEY_CODE.RIGHT:
          this.dir = { x: 1, y: 0 };
          this.move = true;
          break;
        case Utils.KEY_CODE.DOWN:
          this.dir = { x: 0, y: 1 };
          this.move = true;
          break;
        default:
      }
    }
    if (event.type == "keyup") {
      this.move = false;
    }
    playerLoop();
  }
})();
