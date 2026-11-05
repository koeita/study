// すうじ つみき（たしざん・ひきざん・かけざん・わりざん 難易度＆バリエーション対応） メインスクリプト
(() => {
  const { Engine, World, Bodies, Body, Events } = Matter;

  // DOM要素
  const stageContainer = document.getElementById('stage-container');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const btnBackTitle = document.getElementById('btn-back-title');
  const btnSound = document.getElementById('btn-sound');
  const levelBadgeEl = document.getElementById('level-badge');
  const questionProgressEl = document.getElementById('question-progress');
  const eqPartAEl = document.getElementById('eq-part-a');
  const eqOpEl = document.getElementById('eq-op');
  const eqPartBEl = document.getElementById('eq-part-b');
  const eqPartCEl = document.getElementById('eq-part-c');
  const blackboardMessageEl = document.getElementById('blackboard-message');
  const choicesLabelEl = document.getElementById('choices-label');
  const choicesGridEl = document.getElementById('choices-grid');
  const choiceBtns = Array.from(choicesGridEl.querySelectorAll('.choice-btn'));

  const titleOverlay = document.getElementById('title-overlay');
  const resultOverlay = document.getElementById('result-overlay');
  const resultStampWrapEl = document.getElementById('result-stamp-wrap');
  const resultTitleEl = document.getElementById('result-title');
  const resultSubtitleEl = document.getElementById('result-subtitle');
  const reviewListEl = document.getElementById('review-list');
  const btnReplaySame = document.getElementById('btn-replay-same');
  const btnReplaySelect = document.getElementById('btn-replay-select');
  const courseBtns = Array.from(document.querySelectorAll('.course-btn'));
  const diffTabs = Array.from(document.querySelectorAll('.diff-tab'));

  const previewAdd = document.getElementById('preview-add');
  const previewSub = document.getElementById('preview-sub');
  const previewMul = document.getElementById('preview-mul');
  const previewDiv = document.getElementById('preview-div');

  // 配色パレット
  const COLORS = {
    bg: '#f9f6f0',
    navy: '#2c3e50',
    white: '#ffffff',
    trayWood: '#d4a373',
    trayDark: '#8b5a2b',
    trayRim: '#e6ccb2',
    hanamaruRed: '#e63946',
    blockPalette: [
      '#ffadad', // 1
      '#ffd6a5', // 2
      '#fdffb6', // 3
      '#caffbf', // 4
      '#a8e6cf', // 5
      '#a0c4ff', // 6
      '#ffc6ff', // 7
      '#f4a261', // 8
      '#88d49e', // 9
      '#ffcb77'  // 10
    ]
  };

  // 難易度表示ラベル
  const LEVEL_NAMES = {
    easy: 'かんたん',
    normal: 'ふつう',
    hard: 'むずかしい'
  };

  // ゲーム進行状態
  const TOTAL_QUESTIONS = 5;
  let currentLevel = 'easy'; // 'easy' | 'normal' | 'hard'
  let currentCourse = 'add'; // 'add' | 'sub' | 'mul' | 'div'
  let questionIndex = 0;
  let questions = [];
  let currentQ = null;
  let solvedHistory = []; // { text, isCorrect, correctAns, userPick }
  let isInputLocked = false;

  // ステージ寸法
  let stageWidth = 600;
  let stageHeight = 300;
  let trayY = 230;

  // Matter.js 物理オブジェクト
  let engine = null;
  let world = null;
  let trayBodies = [];
  let baseBlock = null;
  let fallingBlock = null;
  let transformedBlocks = [];
  let hasTriggeredCollision = false;

  // 演出エフェクト
  let confettiList = [];
  let shockwaves = [];
  let floatingTexts = [];
  let hanamaruStamp = null;

  // タイマー管理
  let activeTimers = [];
  function addTimer(fn, delay) {
    const id = setTimeout(() => {
      activeTimers = activeTimers.filter((t) => t !== id);
      fn();
    }, delay);
    activeTimers.push(id);
    return id;
  }

  function clearAllTimers() {
    activeTimers.forEach((id) => clearTimeout(id));
    activeTimers = [];
  }

  // 積み木の色
  function getBlockColor(num) {
    if (num <= 0) return '#e2e2e2';
    if (num === 10) return '#ffcb77';
    if (num > 10) return '#ffd166';
    return COLORS.blockPalette[(num - 1) % COLORS.blockPalette.length];
  }

  // 積み木のサイズ
  function getBlockDimensions(num) {
    const scale = Math.min(1.05, Math.max(0.78, Math.min(stageWidth / 640, stageHeight / 300)));
    const clamped = Math.max(1, Math.min(32, num));
    const w = Math.round((76 + clamped * 3.2) * scale);
    const h = Math.round((66 + clamped * 2.2) * scale);
    return { w, h };
  }

  // 難易度変更時のコースプレビュー表記更新
  function updateCoursePreviews() {
    if (currentLevel === 'easy') {
      previewAdd.textContent = '4 ＋ [ ？ ] ＝ 10';
      previewSub.textContent = '8 － [ ？ ] ＝ 5';
      previewMul.textContent = '2 × [ ？ ] ＝ 8';
      previewDiv.textContent = '6 ÷ [ ？ ] ＝ 3';
    } else if (currentLevel === 'normal') {
      previewAdd.textContent = '7 ＋ [ ？ ] ＝ 13';
      previewSub.textContent = '13 － [ ？ ] ＝ 8';
      previewMul.textContent = '4 × [ ？ ] ＝ 12';
      previewDiv.textContent = '15 ÷ [ ？ ] ＝ 5';
    } else {
      previewAdd.textContent = '14 ＋ [ ？ ] ＝ 21';
      previewSub.textContent = '18 － [ ？ ] ＝ 9';
      previewMul.textContent = '7 × [ ？ ] ＝ 56';
      previewDiv.textContent = '24 ÷ [ ？ ] ＝ 6';
    }
  }

  // 難易度・コースに応じた問題プール生成
  function generateQuestions(course, level) {
    const pool = [];

    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
      }
      return arr;
    };

    if (course === 'add') {
      if (level === 'easy') {
        for (let a = 1; a <= 9; a++) {
          pool.push({ type: 'add', op: '＋', first: a, second: 10 - a, result: 10 });
        }
        for (let res = 4; res <= 9; res++) {
          for (let a = 1; a < res; a++) {
            pool.push({ type: 'add', op: '＋', first: a, second: res - a, result: res });
          }
        }
      } else if (level === 'normal') {
        for (let a = 4; a <= 9; a++) {
          for (let b = 3; b <= 9; b++) {
            if (a + b >= 11 && a + b <= 18) {
              pool.push({ type: 'add', op: '＋', first: a, second: b, result: a + b });
            }
          }
        }
      } else {
        for (let a = 11; a <= 18; a++) {
          for (let b = 4; b <= 9; b++) {
            pool.push({ type: 'add', op: '＋', first: a, second: b, result: a + b });
          }
        }
      }
    } else if (course === 'sub') {
      if (level === 'easy') {
        for (let a = 4; a <= 10; a++) {
          for (let b = 1; b < a; b++) {
            pool.push({ type: 'sub', op: '－', first: a, second: b, result: a - b });
          }
        }
      } else if (level === 'normal') {
        for (let a = 11; a <= 16; a++) {
          for (let b = a - 9; b <= 9; b++) {
            const res = a - b;
            if (res >= 2 && res <= 9) {
              pool.push({ type: 'sub', op: '－', first: a, second: b, result: res });
            }
          }
        }
      } else {
        for (let a = 17; a <= 20; a++) {
          for (let b = 6; b <= 9; b++) {
            pool.push({ type: 'sub', op: '－', first: a, second: b, result: a - b });
          }
        }
      }
    } else if (course === 'mul') {
      if (level === 'easy') {
        [1, 2].forEach((a) => {
          for (let b = 1; b <= 9; b++) {
            pool.push({ type: 'mul', op: '×', first: a, second: b, result: a * b });
          }
        });
      } else if (level === 'normal') {
        [1, 2, 3, 4].forEach((a) => {
          for (let b = 1; b <= 9; b++) {
            pool.push({ type: 'mul', op: '×', first: a, second: b, result: a * b });
            if (a >= 3) {
              pool.push({ type: 'mul', op: '×', first: a, second: b, result: a * b });
            }
          }
        });
      } else {
        for (let a = 1; a <= 9; a++) {
          for (let b = 1; b <= 9; b++) {
            pool.push({ type: 'mul', op: '×', first: a, second: b, result: a * b });
          }
        }
      }
    } else if (course === 'div') {
      if (level === 'easy') {
        [4, 6, 8, 10, 12, 14, 16].forEach((a) => {
          pool.push({ type: 'div', op: '÷', first: a, second: 2, result: a / 2 });
        });
      } else if (level === 'normal') {
        [3, 4, 5].forEach((b) => {
          for (let res = 2; res <= 6; res++) {
            const a = b * res;
            pool.push({ type: 'div', op: '÷', first: a, second: b, result: res });
          }
        });
      } else {
        [6, 7, 8].forEach((b) => {
          for (let res = 2; res <= 5; res++) {
            const a = b * res;
            pool.push({ type: 'div', op: '÷', first: a, second: b, result: res });
          }
        });
      }
    }

    shuffle(pool);
    const selected = pool.slice(0, TOTAL_QUESTIONS);

    return selected.map((q, idx) => {
      const isBlankResult = idx === 1 || idx === 3;
      const pattern = isBlankResult ? 'blankResult' : 'blankMiddle';
      const answer = isBlankResult ? q.result : q.second;

      return {
        ...q,
        pattern,
        answer,
        choices: generateFourChoices(answer, q.type, level)
      };
    });
  }

  // 4択ボタン選択肢の生成
  function generateFourChoices(correctAnswer, qType, level) {
    const set = new Set([correctAnswer]);
    const offsets = [-1, 1, -2, 2, -3, 3, -4, 4];

    for (const off of offsets) {
      if (set.size >= 4) break;
      const cand = correctAnswer + off;
      if (cand >= 1 && cand <= 81) {
        set.add(cand);
      }
    }

    while (set.size < 4) {
      let maxRand = 12;
      if (qType === 'mul') {
        maxRand = level === 'hard' ? 81 : (level === 'normal' ? 36 : 18);
      } else if (level === 'hard') {
        maxRand = 28;
      }
      const r = Math.floor(Math.random() * maxRand) + 1;
      set.add(r);
    }

    return Array.from(set).sort((a, b) => a - b);
  }

  // Matter.js 初期化
  function initPhysics() {
    engine = Engine.create();
    world = engine.world;
    engine.gravity.y = 1.25;

    setupStageGeometry();
    Events.on(engine, 'collisionStart', onCollisionStart);
  }

  // ステージ構築
  function setupStageGeometry() {
    const rect = stageContainer.getBoundingClientRect();
    stageWidth = Math.max(280, Math.floor(rect.width));
    stageHeight = Math.max(180, Math.floor(rect.height));

    const dpr = window.devicePixelRatio || 1;
    canvas.width = stageWidth * dpr;
    canvas.height = stageHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    trayY = Math.round(stageHeight * 0.79);

    if (trayBodies.length > 0) {
      World.remove(world, trayBodies);
      trayBodies = [];
    }

    const trayWidth = Math.min(280, Math.round(stageWidth * 0.58));
    const trayThickness = 22;
    const centerX = stageWidth / 2;

    const trayBottom = Bodies.rectangle(
      centerX,
      trayY,
      trayWidth,
      trayThickness,
      {
        isStatic: true,
        restitution: 0.35,
        friction: 0.8,
        label: 'trayBottom',
        customW: trayWidth,
        customH: trayThickness
      }
    );

    const rimW = 24;
    const rimH = 44;
    const leftRim = Bodies.rectangle(
      centerX - trayWidth / 2 + 8,
      trayY - 16,
      rimW,
      rimH,
      {
        isStatic: true,
        angle: -0.25,
        restitution: 0.3,
        friction: 0.5,
        label: 'trayRim',
        customW: rimW,
        customH: rimH
      }
    );
    const rightRim = Bodies.rectangle(
      centerX + trayWidth / 2 - 8,
      trayY - 16,
      rimW,
      rimH,
      {
        isStatic: true,
        angle: 0.25,
        restitution: 0.3,
        friction: 0.5,
        label: 'trayRim',
        customW: rimW,
        customH: rimH
      }
    );

    trayBodies = [trayBottom, leftRim, rightRim];
    World.add(world, trayBodies);

    if (baseBlock && !fallingBlock && transformedBlocks.length === 0) {
      const { h } = getBlockDimensions(baseBlock.numberValue);
      Body.setPosition(baseBlock, {
        x: centerX,
        y: trayY - trayThickness / 2 - h / 2 - 2
      });
      Body.setVelocity(baseBlock, { x: 0, y: 0 });
      Body.setAngle(baseBlock, 0);
    }
  }

  // ブロック生成
  function createNumberBlock(x, y, num, isFalling = false) {
    const { w, h } = getBlockDimensions(num);
    const block = Bodies.rectangle(x, y, w, h, {
      chamfer: { radius: 14 },
      restitution: isFalling ? 0.42 : 0.25,
      friction: 0.6,
      frictionAir: 0.012,
      density: 0.002,
      label: 'numberBlock'
    });

    block.numberValue = num;
    block.customW = w;
    block.customH = h;
    block.popScale = isFalling ? 0.85 : 0.7;
    World.add(world, block);
    return block;
  }

  // 全ブロッククリア
  function clearBlocks() {
    if (baseBlock) World.remove(world, baseBlock);
    if (fallingBlock) World.remove(world, fallingBlock);
    transformedBlocks.forEach((b) => {
      if (b) World.remove(world, b);
    });
    baseBlock = null;
    fallingBlock = null;
    transformedBlocks = [];
    hasTriggeredCollision = false;
  }

  // トレイ上の初期ブロック配置
  function spawnBaseBlock(num) {
    clearBlocks();
    const { h } = getBlockDimensions(num);
    const centerX = stageWidth / 2;
    const startY = trayY - 11 - h / 2 - 4;
    baseBlock = createNumberBlock(centerX, startY, num, false);
  }

  // コース開始
  function startCourse(course, level) {
    clearAllTimers();
    currentCourse = course;
    currentLevel = level || currentLevel;
    questionIndex = 0;
    solvedHistory = [];
    questions = generateQuestions(currentCourse, currentLevel);

    titleOverlay.classList.add('is-hidden');
    resultOverlay.classList.add('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'true');

    levelBadgeEl.textContent = LEVEL_NAMES[currentLevel];
    setupStageGeometry();
    loadQuestion(0);
  }

  // 問題ロード
  function loadQuestion(idx) {
    clearAllTimers();
    questionIndex = idx;
    currentQ = questions[idx];
    isInputLocked = false;
    hanamaruStamp = null;

    questionProgressEl.textContent = `だい ${idx + 1} もん / ${TOTAL_QUESTIONS} もん`;
    eqOpEl.textContent = currentQ.op;

    if (currentQ.pattern === 'blankMiddle') {
      eqPartAEl.textContent = String(currentQ.first);
      eqPartAEl.className = 'eq-num';

      eqPartBEl.textContent = '？';
      eqPartBEl.className = 'eq-blank';

      eqPartCEl.textContent = String(currentQ.result);
      eqPartCEl.className = 'eq-num';

      blackboardMessageEl.textContent = `したの すうじを おして ${currentQ.result}に しよう！`;
      spawnBaseBlock(currentQ.first);
    } else {
      eqPartAEl.textContent = String(currentQ.first);
      eqPartAEl.className = 'eq-num';

      eqPartBEl.textContent = String(currentQ.second);
      eqPartBEl.className = 'eq-num';

      eqPartCEl.textContent = '？';
      eqPartCEl.className = 'eq-blank';

      blackboardMessageEl.textContent = `けいさんして こたえの すうじを おそう！`;
      spawnBaseBlock(currentQ.first);
    }

    blackboardMessageEl.className = 'blackboard-message';
    choicesLabelEl.textContent = 'どの すうじを いれる？ えらんで おしてね！';

    choiceBtns.forEach((btn, i) => {
      const val = currentQ.choices[i];
      btn.dataset.value = String(val);
      btn.disabled = false;
      btn.classList.remove('is-pressed');

      let dotsHtml = '<div class="btn-dots" aria-hidden="true">';
      const maxDotDisplay = Math.min(10, val);
      for (let d = 0; d < maxDotDisplay; d++) {
        dotsHtml += '<span class="btn-dot"></span>';
      }
      dotsHtml += '</div>';

      btn.innerHTML = `<span>${val}</span>${dotsHtml}`;
    });
  }

  // 4択ボタン選択
  function onChoiceSelected(pickedNum, btnElement) {
    if (isInputLocked || !currentQ) return;
    isInputLocked = true;

    window.se.playButton();

    choiceBtns.forEach((b) => {
      b.disabled = true;
    });
    if (btnElement) {
      btnElement.classList.add('is-pressed');
    }

    if (currentQ.pattern === 'blankMiddle') {
      eqPartBEl.textContent = String(pickedNum);
    } else {
      eqPartCEl.textContent = String(pickedNum);
    }

    const dropNum = currentQ.pattern === 'blankMiddle' ? pickedNum : currentQ.second;
    const { h } = getBlockDimensions(dropNum);
    const dropX = stageWidth / 2;
    const dropY = Math.max(28, h / 2 + 6);

    hasTriggeredCollision = false;
    fallingBlock = createNumberBlock(dropX, dropY, dropNum, true);
    fallingBlock.pickedNumber = pickedNum;
    Body.setVelocity(fallingBlock, { x: 0, y: 2.2 });
  }

  // 衝突検知
  function onCollisionStart(event) {
    if (hasTriggeredCollision || !fallingBlock || !baseBlock) return;

    const pairs = event.pairs;
    for (let i = 0; i < pairs.length; i++) {
      const { bodyA, bodyB } = pairs[i];
      const isPairMatch =
        (bodyA === fallingBlock && bodyB === baseBlock) ||
        (bodyB === fallingBlock && bodyA === baseBlock);

      if (isPairMatch) {
        hasTriggeredCollision = true;
        addTimer(() => {
          performOperation();
        }, 130);
        break;
      }
    }
  }

  // 物理演出
  function performOperation() {
    if (!baseBlock || !fallingBlock || !currentQ) return;

    const firstVal = baseBlock.numberValue;
    const pickedVal = fallingBlock.pickedNumber;
    const dropVal = fallingBlock.numberValue;
    const op = currentQ.type;

    let calcResult = 0;
    if (op === 'add') calcResult = firstVal + dropVal;
    else if (op === 'sub') calcResult = firstVal - dropVal;
    else if (op === 'mul') calcResult = firstVal * dropVal;
    else if (op === 'div') calcResult = Math.floor(firstVal / dropVal);

    const midX = stageWidth / 2;
    const midY = (baseBlock.position.y + fallingBlock.position.y) / 2;

    World.remove(world, baseBlock);
    World.remove(world, fallingBlock);
    baseBlock = null;
    fallingBlock = null;

    if (op === 'add') {
      const merged = createNumberBlock(midX, midY, calcResult, false);
      merged.popScale = 0.65;
      Body.setVelocity(merged, { x: 0, y: -3.2 });
      transformedBlocks = [merged];
      window.se.playMerge(calcResult);

      shockwaves.push({
        x: midX,
        y: midY,
        r: 25,
        maxR: 110,
        alpha: 1.0,
        color: pickedVal === currentQ.answer ? '#2a9d8f' : '#e76f51'
      });
    } else if (op === 'sub') {
      const remVal = Math.max(0, calcResult);
      const remainBlock = createNumberBlock(midX, midY, remVal, false);
      Body.setVelocity(remainBlock, { x: -1, y: -2 });

      const scrap = createNumberBlock(midX + 35, midY - 10, dropVal, false);
      scrap.popScale = 0.75;
      Body.setVelocity(scrap, { x: 4.8, y: -3.8 });
      Body.setAngularVelocity(scrap, 0.15);

      transformedBlocks = [remainBlock, scrap];
      window.se.playSubtract();

      shockwaves.push({
        x: midX,
        y: midY,
        r: 20,
        maxR: 90,
        alpha: 1.0,
        color: pickedVal === currentQ.answer ? '#2a9d8f' : '#a0c4ff'
      });
    } else if (op === 'mul') {
      const mulBlock = createNumberBlock(midX, midY, calcResult, false);
      mulBlock.popScale = 0.55;
      Body.setVelocity(mulBlock, { x: 0, y: -4.0 });
      transformedBlocks = [mulBlock];
      window.se.playMultiply();

      shockwaves.push({
        x: midX,
        y: midY,
        r: 30,
        maxR: 130,
        alpha: 1.0,
        color: pickedVal === currentQ.answer ? '#2a9d8f' : '#ffd166'
      });
    } else if (op === 'div') {
      const halfW = getBlockDimensions(calcResult).w;
      const leftPart = createNumberBlock(midX - halfW * 0.4, midY, calcResult, false);
      const rightPart = createNumberBlock(midX + halfW * 0.4, midY, calcResult, false);

      Body.setVelocity(leftPart, { x: -2.8, y: -3.0 });
      Body.setVelocity(rightPart, { x: 2.8, y: -3.0 });
      Body.setAngularVelocity(leftPart, -0.08);
      Body.setAngularVelocity(rightPart, 0.08);

      transformedBlocks = [leftPart, rightPart];
      window.se.playDivide();

      shockwaves.push({
        x: midX,
        y: midY,
        r: 20,
        maxR: 100,
        alpha: 1.0,
        color: pickedVal === currentQ.answer ? '#2a9d8f' : '#ffc6ff'
      });
    }

    if (pickedVal === currentQ.answer) {
      handleCorrectAnswer(pickedVal);
    } else {
      handleWrongAnswer(pickedVal, calcResult);
    }
  }

  // 正解処理
  function handleCorrectAnswer(pickedVal) {
    const blankEl = currentQ.pattern === 'blankMiddle' ? eqPartBEl : eqPartCEl;
    blankEl.className = 'eq-blank is-filled-correct';

    const fullEq = `${currentQ.first} ${currentQ.op} ${currentQ.second} ＝ ${currentQ.result}`;
    blackboardMessageEl.textContent = `${fullEq}　せいかい！`;
    blackboardMessageEl.className = 'blackboard-message is-correct';
    choicesLabelEl.textContent = 'やったね！ ぴったり へんしん できたよ！';

    solvedHistory.push({
      text: fullEq,
      isCorrect: true
    });

    window.se.playPinPon();
    spawnConfetti(stageWidth / 2, stageHeight * 0.45, 52);

    addTimer(() => {
      window.se.playHanamaru();
      hanamaruStamp = {
        x: stageWidth / 2,
        y: stageHeight * 0.44,
        scale: 2.2,
        targetScale: 1.0,
        alpha: 1.0
      };
    }, 180);

    // 1.5秒後に自動で次の問題へ
    addTimer(() => {
      if (questionIndex + 1 < TOTAL_QUESTIONS) {
        loadQuestion(questionIndex + 1);
      } else {
        showResultScreen();
      }
    }, 1500);
  }

  // 間違えたときの処理（正解を表示し、自動で次の問題へ進む仕様に変更）
  function handleWrongAnswer(pickedVal, calcResult) {
    const blankEl = currentQ.pattern === 'blankMiddle' ? eqPartBEl : eqPartCEl;
    blankEl.className = 'eq-blank is-filled-wrong';

    const fullEq = `${currentQ.first} ${currentQ.op} ${currentQ.second} ＝ ${currentQ.result}`;
    const wrongMsg = `ざんねん！ 正しい こたえは ${currentQ.answer} だよ`;

    blackboardMessageEl.textContent = wrongMsg;
    blackboardMessageEl.className = 'blackboard-message is-hint';
    choicesLabelEl.textContent = `せいかいは「${fullEq}」でした！`;

    solvedHistory.push({
      text: fullEq,
      isCorrect: false
    });

    window.se.playOshii();

    floatingTexts.push({
      x: stageWidth / 2,
      y: Math.max(46, stageHeight * 0.22),
      text: `こたえ：${currentQ.answer}`,
      color: '#e76f51',
      life: 1.0
    });

    // 1.8秒後に正解を確認したあと、次の問題へ自動で進む
    addTimer(() => {
      if (questionIndex + 1 < TOTAL_QUESTIONS) {
        loadQuestion(questionIndex + 1);
      } else {
        showResultScreen();
      }
    }, 1800);
  }

  // 結果発表画面（正解数に応じた点数評価：20点×正解数）
  function showResultScreen() {
    const correctCount = solvedHistory.filter((item) => item.isCorrect).length;
    const finalScore = correctCount * 20;

    // 音の再生
    if (finalScore === 100) {
      window.se.playFanfare();
    } else {
      window.se.playCheer();
    }

    // 点数に応じたタイトル・サブタイトル・スタンプの切り替え
    resultTitleEl.textContent = `${finalScore}てん！`;

    if (finalScore === 100) {
      resultTitleEl.textContent = '100てん まんてん！';
      resultSubtitleEl.textContent = `【${LEVEL_NAMES[currentLevel]}】ぜんぶ せいかい！ たいへん よくできました！`;
      renderStampSVG('hanamaru');
    } else if (finalScore >= 80) {
      resultSubtitleEl.textContent = `【${LEVEL_NAMES[currentLevel]}】おしい！ あとすこしで まんてんだね！`;
      renderStampSVG('maru');
    } else if (finalScore >= 60) {
      resultSubtitleEl.textContent = `【${LEVEL_NAMES[currentLevel]}】よく がんばったね！ つぎは もっと いけるよ！`;
      renderStampSVG('fight');
    } else {
      resultSubtitleEl.textContent = `【${LEVEL_NAMES[currentLevel]}】なんかいも あそんで つよくなろう！`;
      renderStampSVG('fight');
    }

    // ふりかえり一覧（丸・バツを色分け）
    reviewListEl.innerHTML = '';
    solvedHistory.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'review-item';

      const markClass = item.isCorrect ? 'is-correct' : 'is-wrong';
      const markText = item.isCorrect ? 'せいかい' : 'まちがい';

      li.innerHTML = `
        <span class="review-num-badge">だい ${idx + 1} もん</span>
        <span class="review-eq">${item.text}</span>
        <span class="review-mark ${markClass}">${markText}</span>
      `;
      reviewListEl.appendChild(li);
    });

    resultOverlay.classList.remove('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'false');
  }

  // 評価スタンプSVGの描画（花丸 / 丸 / ファイト）
  function renderStampSVG(type) {
    if (type === 'hanamaru') {
      resultStampWrapEl.innerHTML = `
        <svg viewBox="0 0 160 160" class="result-stamp-svg">
          <path
            d="M 80 12
               Q 96 4, 104 20
               Q 122 14, 124 32
               Q 142 32, 138 50
               Q 154 58, 144 74
               Q 156 90, 140 102
               Q 146 120, 128 124
               Q 126 142, 108 138
               Q 98 154, 80 144
               Q 62 154, 52 138
               Q 34 142, 32 124
               Q 14 120, 20 102
               Q 4 90, 16 74
               Q 6 58, 22 50
               Q 18 32, 36 32
               Q 38 14, 56 20
               Q 64 4, 80 12 Z"
            fill="#fff5f5"
            stroke="#e63946"
            stroke-width="6"
            stroke-linejoin="round"
          />
          <circle cx="80" cy="80" r="46" fill="none" stroke="#e63946" stroke-width="6" />
          <path
            d="M 54 78
               A 26 26 0 1 1 80 106
               A 16 16 0 1 1 96 80
               A 8 8 0 1 1 80 72"
            fill="none"
            stroke="#e63946"
            stroke-width="6"
            stroke-linecap="round"
          />
          <text x="80" y="88" text-anchor="middle" fill="#e63946" font-size="24" font-weight="800">
            100てん
          </text>
        </svg>
      `;
    } else if (type === 'maru') {
      resultStampWrapEl.innerHTML = `
        <svg viewBox="0 0 160 160" class="result-stamp-svg">
          <circle cx="80" cy="80" r="66" fill="#fff5f5" stroke="#e63946" stroke-width="8" />
          <circle cx="80" cy="80" r="48" fill="none" stroke="#e63946" stroke-width="5" />
          <text x="80" y="88" text-anchor="middle" fill="#e63946" font-size="26" font-weight="800">
            たいへんよく
          </text>
        </svg>
      `;
    } else {
      resultStampWrapEl.innerHTML = `
        <svg viewBox="0 0 160 160" class="result-stamp-svg">
          <circle cx="80" cy="80" r="66" fill="#f0f7ff" stroke="#457b9d" stroke-width="8" />
          <text x="80" y="76" text-anchor="middle" fill="#457b9d" font-size="24" font-weight="800">
            ファイト！
          </text>
          <text x="80" y="104" text-anchor="middle" fill="#457b9d" font-size="18" font-weight="800">
            もういっかい
          </text>
        </svg>
      `;
    }
  }

  // 紙吹雪
  function spawnConfetti(x, y, count) {
    const palette = [
      '#e63946',
      '#f4a261',
      '#ffcb77',
      '#2a9d8f',
      '#88d49e',
      '#a0c4ff',
      '#ffc6ff'
    ];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 3 + Math.random() * 7;
      confettiList.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.0,
        w: 10 + Math.random() * 6,
        h: 7 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        color: palette[i % palette.length],
        life: 1.0,
        decay: 0.012 + Math.random() * 0.008
      });
    }
  }

  // 角丸長方形
  function roundRect(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  // トレイ描画
  function drawWoodenTray() {
    ctx.save();
    for (const b of trayBodies) {
      const { x, y } = b.position;
      const w = b.customW;
      const h = b.customH;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(b.angle);

      ctx.fillStyle = COLORS.navy;
      roundRect(ctx, -w / 2, -h / 2 + 4, w, h, 8);
      ctx.fill();

      ctx.fillStyle = b.label === 'trayBottom' ? COLORS.trayWood : COLORS.trayRim;
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 3;
      roundRect(ctx, -w / 2, -h / 2, w, h, 8);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  // 積み木描画
  function drawNumberBlock(block) {
    if (!block) return;

    if (block.popScale < 1) {
      block.popScale = Math.min(1, block.popScale + 0.08);
    }

    const { x, y } = block.position;
    const w = block.customW * block.popScale;
    const h = block.customH * block.popScale;
    const num = block.numberValue;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(block.angle * 0.35);

    ctx.fillStyle = COLORS.navy;
    roundRect(ctx, -w / 2, -h / 2 + 5, w, h, 14);
    ctx.fill();

    ctx.fillStyle = getBlockColor(num);
    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 3.5;
    roundRect(ctx, -w / 2, -h / 2, w, h, 14);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-w / 2 + 14, -h / 2 + 6);
    ctx.lineTo(w / 2 - 14, -h / 2 + 6);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    const strNum = String(num);
    const fontScale = strNum.length >= 2 ? 0.38 : 0.44;
    const fontSize = Math.round(Math.min(w, h) * fontScale);
    ctx.font = `800 ${fontSize}px 'M PLUS Rounded 1c', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.navy;
    ctx.fillText(strNum, 0, -h * 0.18);

    // 積み木内部のクリッピング＆ドット描画
    ctx.save();
    roundRect(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 10);
    ctx.clip();
    drawBlockDots(ctx, num, w, h);
    ctx.restore();

    ctx.restore();
  }

  // 積み木内の●ドット描画（単色ネイビーで統一）
  function drawBlockDots(context, num, w, h) {
    if (num <= 0) return;

    const maxCols = num <= 10 ? 5 : 10;
    const rows = Math.ceil(num / maxCols);

    const availW = w * 0.82;
    const availH = h * 0.38;
    const centerY = h * 0.23;

    const maxDotRByW = availW / (maxCols * 2.5);
    const maxDotRByH = availH / (rows * 2.4);
    const dotRadius = Math.max(1.8, Math.min(4.5, Math.min(maxDotRByW, maxDotRByH)));

    const colGap = dotRadius * 2.5;
    const rowGap = dotRadius * 2.3;

    const totalHeight = (rows - 1) * rowGap;
    const startY = centerY - totalHeight / 2;

    // すべてダークネイビー一色で統一
    context.fillStyle = COLORS.navy;

    let remaining = num;
    for (let r = 0; r < rows; r++) {
      const countInRow = Math.min(maxCols, remaining);
      const rowWidth = (countInRow - 1) * colGap;
      const startX = -rowWidth / 2;
      const y = startY + r * rowGap;

      for (let c = 0; c < countInRow; c++) {
        const x = startX + c * colGap;
        context.beginPath();
        context.arc(x, y, dotRadius, 0, Math.PI * 2);
        context.fill();
      }
      remaining -= countInRow;
    }
  }

  // はなまる描画
  function drawCanvasHanamaru() {
    if (!hanamaruStamp) return;

    hanamaruStamp.scale += (hanamaruStamp.targetScale - hanamaruStamp.scale) * 0.25;

    const { x, y, scale } = hanamaruStamp;
    const baseR = Math.min(stageWidth, stageHeight) * 0.28;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(-0.1);

    const petals = 10;
    ctx.beginPath();
    for (let i = 0; i < petals; i++) {
      const a1 = (i / petals) * Math.PI * 2;
      const a2 = ((i + 0.5) / petals) * Math.PI * 2;
      const a3 = ((i + 1) / petals) * Math.PI * 2;
      const innerR = baseR * 0.78;
      const outerR = baseR * 1.12;

      const x1 = Math.cos(a1) * innerR;
      const y1 = Math.sin(a1) * innerR;
      const cx = Math.cos(a2) * outerR;
      const cy = Math.sin(a2) * outerR;
      const x2 = Math.cos(a3) * innerR;
      const y2 = Math.sin(a3) * innerR;

      if (i === 0) ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 245, 245, 0.92)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = COLORS.hanamaruRed;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, baseR * 0.68, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `800 ${Math.round(baseR * 0.36)}px 'M PLUS Rounded 1c', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.hanamaruRed;
    ctx.fillText('はなまる', 0, 2);

    ctx.restore();
  }

  // エフェクト描画
  function drawAndUpdateEffects() {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.r += (sw.maxR - sw.r) * 0.22;
      sw.alpha -= 0.06;
      if (sw.alpha <= 0) {
        shockwaves.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = confettiList.length - 1; i >= 0; i--) {
      const p = confettiList[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.vx *= 0.985;
      p.rot += p.vRot;
      p.life -= p.decay;

      if (p.life <= 0) {
        confettiList.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      ctx.fillStyle = p.color;
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 2;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 0.4;
      ft.life -= 0.018;
      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.life * 1.5));
      ctx.font = "800 20px 'M PLUS Rounded 1c', sans-serif";
      const padX = 14;
      const boxW = ctx.measureText(ft.text).width + padX * 2;
      const boxH = 36;

      ctx.fillStyle = COLORS.navy;
      roundRect(ctx, -boxW / 2, -boxH / 2 + 3, boxW, boxH, 10);
      ctx.fill();

      ctx.fillStyle = COLORS.white;
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 3;
      roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 1);
      ctx.restore();
    }

    drawCanvasHanamaru();
  }

  // メインループ
  let lastTime = performance.now();
  function gameLoop(now) {
    const delta = Math.min(24, now - lastTime);
    lastTime = now;

    Engine.update(engine, delta);

    if (fallingBlock && baseBlock && !hasTriggeredCollision) {
      const dy = Math.abs(fallingBlock.position.y - baseBlock.position.y);
      const combinedHalfH = (fallingBlock.customH + baseBlock.customH) / 2;
      if (dy <= combinedHalfH + 6) {
        hasTriggeredCollision = true;
        addTimer(() => {
          performOperation();
        }, 120);
      }
    }

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, stageWidth, stageHeight);

    ctx.fillStyle = 'rgba(44, 62, 80, 0.08)';
    const step = 32;
    for (let gx = step; gx < stageWidth; gx += step) {
      for (let gy = step; gy < stageHeight; gy += step) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawWoodenTray();

    if (baseBlock) drawNumberBlock(baseBlock);
    if (fallingBlock) drawNumberBlock(fallingBlock);
    transformedBlocks.forEach((b) => {
      if (b) drawNumberBlock(b);
    });

    drawAndUpdateEffects();

    requestAnimationFrame(gameLoop);
  }

  // イベントリスナー
  choiceBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.value);
      if (!Number.isNaN(val)) {
        onChoiceSelected(val, btn);
      }
    });
  });

  diffTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      window.se.playButton();
      diffTabs.forEach((t) => t.classList.remove('is-selected'));
      tab.classList.add('is-selected');
      currentLevel = tab.dataset.level || 'easy';
      updateCoursePreviews();
    });
  });

  courseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.se.playButton();
      const course = btn.dataset.course || 'add';
      startCourse(course, currentLevel);
    });
  });

  btnBackTitle.addEventListener('click', () => {
    window.se.playButton();
    clearAllTimers();
    titleOverlay.classList.remove('is-hidden');
  });

  btnReplaySame.addEventListener('click', () => {
    window.se.playButton();
    startCourse(currentCourse, currentLevel);
  });

  btnReplaySelect.addEventListener('click', () => {
    window.se.playButton();
    resultOverlay.classList.add('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'true');
    titleOverlay.classList.remove('is-hidden');
  });

  btnSound.addEventListener('click', () => {
    const enabled = window.se.toggle();
    btnSound.textContent = enabled ? 'おと あり' : 'おと なし';
    btnSound.setAttribute('aria-pressed', String(enabled));
    btnSound.classList.toggle('is-muted', !enabled);
  });

  window.addEventListener('resize', () => {
    setupStageGeometry();
  });

  // 初期起動
  initPhysics();
  updateCoursePreviews();
  questions = generateQuestions('add', 'easy');
  loadQuestion(0);
  requestAnimationFrame(gameLoop);
})();
