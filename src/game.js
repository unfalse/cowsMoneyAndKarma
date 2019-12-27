(function() {
  const ONE_GAME_TICK = 650;
  const KARMA_LEVELS = ["NOTHING", "BAD", "AVERAGE", "GOOD", "BUDDA"];
  const stats = {
    days: 0,
    cows: 0,
    roads: 0,
    expenses: 0,
    credits: 0,
    collectors: 0,
    pills: 0,
    debts_closed: 0,
    debts_failed: 0
  };

  const COW = "cow";
  const ROAD = "road";
  const COLLECTOR = "collector";
  const PILL = "pill";
  const CREDIT = "credit";
  const PLAYER = "player";
  const EXPENSES = "expenses";
  const MAXX = 13;
  const MAXY = 6;
  const CELLSIZE = 30;

  const ROADprice = 10;
  const COWreward = 25;
  const COLLECTORtakes = 30;
  const COLLECTORbites = 10;
  const PILLprice = 50;
  const PILLheals = 10;
  const CREDITdebt = 500;
  const CREDITpay = 125;
  const EXPENSEScost = 30;

  const genPlan = [
    [1, ROAD],
    [30, EXPENSES],
    [60, ROAD],
    [90, EXPENSES]
  ];
  let currentPhase = 0;
  let startingTimeForPhase = 0;
  const config = {
    move: false,
    dir: { x: 0, y: 0 }
  };
  let player = {};
  let gameObjects = [];
  let moneyChangeMultiplier = 1;
  let gameOverFlag = false;
  let player_stands_still = 0;
  let currentTickNumber = 0;
  let lastTickNumberPlayerMoved = 0;

  const cashEl = document.getElementById("cash");
  const debtEl = document.getElementById("debt");
  const payEl = document.getElementById("pay");
  const healthEl = document.getElementById("health");
  const dayEl = document.getElementById("day");
  const paydayEl = document.getElementById("payday");
  const reason = document.getElementById("reason");
  const startBtn = document.getElementById("start-button");
  const gameFieldEl = document.getElementById("game-field");
  const startWindow = document.getElementById("start-window");
  const gameWindow = document.getElementById("game-window");
  const resultsWindow = document.getElementById("results-window");
  const ackWindow = document.getElementById("acknowledgment-window");
  const backToStart = document.getElementsByClassName("back_to_start");
  const ackButton = document.getElementById("acknowledgment-button");
  const karmaEl = document.getElementById("stats_karma_level");

  let mainTimer = null;
  let playerTimer = null;
  let daysCounter = 1;
  let totalDaysCounter = 1;

  gameFieldEl.style.width = MAXX * CELLSIZE + "px";
  gameFieldEl.style.height = MAXY * CELLSIZE + "px";

  init();

  startBtn.onclick = function() {
    startWindow.style.display = "none";
    gameWindow.style.display = "block";
    gameLoop();
  };

  ackButton.onclick = function() {
    startWindow.style.display = "none";
    ackWindow.style.display = "block";
  };

  backToStart[0].onclick = function() {
    window.location.reload();
  };

  backToStart[1].onclick = function() {
    window.location.reload();
  };

  function gameLoop() {
    if (player.health <= 0) {
      gameOver();
    }
    if (
      stats.cows > 0 &&
      stats.debts_closed > 0 &&
      stats.debts_failed === 0 &&
      stats.credits === 0 &&
      player.debt === 0
    ) {
      gameOver();
    }
    if (player.cash > 0) {
      if (currentTickNumber - lastTickNumberPlayerMoved >= 6) {
        player.cash -= 10;
      }
      player.cash -= 1;
    }
    if (player.cash <= 0) {
      player.health -= 10;
    }
    if (player.cash <= player.monthlyPay || player.cash <= 0) {
      addObject(CREDIT, 1, 0);
    }
    if (player.health < 100) {
      addObject(PILL, 2, 0);
    }

    addPlannedObjects(ROAD);
    addPlannedObjects(EXPENSES);
    addObject(COW, 1, 0);

    showCashAndDebt();
    returnDebt();

    gotoNextPhase();

    daysCounter++;
    totalDaysCounter++;
    if (daysCounter === 31) {
      daysCounter = 1;
      removeObjects();
    }
    if (!gameOverFlag) {
      // TODO: decide what to do so player will not stay still
      mainTimer = setTimeout(gameLoop, ONE_GAME_TICK);
    }
    currentTickNumber++;
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

  function playerTick() {
    const newX = player.x + config.dir.x;
    const newY = player.y + config.dir.y;
    if (
      (newX !== player.x || newY !== player.y) &&
      newX >= 0 && newX < MAXX && newY >= 0 && newY <= MAXY - 1
    ) {
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
          stats.cows++;
          break;
        case ROAD:
          player.cash -= ROADprice;
          stats.roads++;
          break;
        case COLLECTOR:
          player.cash -= COLLECTORtakes;
          player.health -= COLLECTORbites;
          stats.collectors++;
          break;
        case PILL:
          player.cash -= PILLprice;
          stats.pills++;
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
          stats.credits++;
          break;
        case EXPENSES:
          player.cash -= EXPENSEScost;
          stats.expenses++;
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
      lastTickNumberPlayerMoved = currentTickNumber;
    }
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
    gameWindow.style.display = "none";
    resultsWindow.style.display = "block";
    stats.days = totalDaysCounter;
    showReason();
    showStats();
    showKarma();
  }

  function showReason() {
    let result = '';
    if (player.health <= 0 && player.debt > 0) {
      result = 'YOU DIED!';
    }
    if (player.health <= 0 && player.debt <= 0) {
      result = 'YOU DIED BUT REPAID ALL LOANS!';
    }
    if (player.health >= 0 && player.debt <= 0) {
      result = 'YOU REPAID ALL LOANS!';
    }
    reason.innerText = result;
  }

  function showStats() {
    Object.keys(stats).map(key => {
      var statsKey = document.getElementById(`stats_${key}`);
      statsKey.innerText =
        key.replace("_", " ").toUpperCase() + ": " + stats[key];
    });
  }

  function showKarma() {
    const conditions = [
      stats.cows === 0 && stats.debts_closed >= 0 && stats.roads === 0,
      stats.cows === 0 && (stats.roads > 0 || stats.expenses > 0),
      stats.cows > 0 && player.debt > 0 && stats.credits >= 0,
      stats.cows > 0 && player.debt === 0 && stats.credits > 0,
      stats.cows > 0 &&
        stats.debts_closed > 0 &&
        stats.debts_failed === 0 &&
        stats.credits === 0 &&
        player.debt === 0
    ];
    const desc = document.createElement("span");
    desc.innerText = "KARMA: ";
    karmaEl.appendChild(desc);

    const notInConditions = conditions.every(b => false);

    for (let cnt = 0; cnt < KARMA_LEVELS.length; cnt++) {
      const span = document.createElement("span");
      span.innerText = KARMA_LEVELS[cnt];
      if (!notInConditions) {
        span.style.color = conditions[cnt] ? "#fff" : "#000";
      } else {
        if (cnt === 0) {
          span.style.color = "#fff";
        }
      }
      span.style.marginLeft = "5px";
      span.style.marginRight = "5px";
      karmaEl.appendChild(span);
    }
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
      cash: 400,
      debt: 400,
      health: 100,
      monthlyPay: 100,
      screenObj: null
    };
    gameObjects = [];
    moneyChangeMultiplier = 1;
    gameOverFlag = false;
    document.addEventListener("keydown", keysHandler.bind(config));
    createPlayer();
    showCashAndDebt();
  }

  function returnDebt() {
    if (daysCounter === 30 && player.debt > 0) {
      if (player.cash < player.monthlyPay) {
        addCollectors();
        stats.debts_failed++;
      }
      if (player.cash >= player.monthlyPay) {
        player.cash -= player.monthlyPay;
        player.debt -= player.monthlyPay;
        if (player.debt > 0 && player.debt < player.monthlyPay) {
          player.debt = player.monthlyPay;
        }
        stats.debts_closed++;
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
    const howMany = Utils.getRandomInt(1, 15);
    for (var i = 0; i < howMany; i++) {
      createObj(COLLECTOR, true);
    }
  }

  function showCashAndDebt() {
    cashEl.innerText = "$" + player.cash;
    debtEl.innerText = "$" + player.debt;
    payEl.innerText = "$" + player.monthlyPay;
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
    if (type === EXPENSES) {
      addObject(type, 2);
    } else {
      if (type !== COW) {
        addObject(type, 4);
      }
    }
  }

  function keysHandler(event) {
    if (gameOverFlag) return;
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
    playerTick();
  }
})();