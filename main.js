// すうじ つみき（たしざん・ひきざん・かけざん・わりざん あそび） メインスクリプト
(() => {
  const { Engine, World, Bodies, Body, Events } = Matter;

  // DOM要素
  const stageContainer = document.getElementById('stage-container');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const btnBackTitle = document.getElementById('btn-back-title');
  const btnSound = document.getElementById('btn-sound');
  const questionProgressEl = document.getElementById('question-progress');
  const eqFirstEl = document.getElementById('eq-first');
  const eqOpEl = document.getElementById('eq-op');
  const eqBlankEl = document.getElementById('eq-blank');
  const eqTargetEl = document.getElementById('eq-target');
  const blackboardMessageEl = document.getElementById('blackboard-message');
  const choicesLabelEl = document.getElementById('choices-label');
  const choicesGridEl = document.getElementById('choices-grid');
  const choiceBtns = Array.from(choicesGridEl.querySelectorAll('.choice-btn'));

  const titleOverlay = document.getElementById('title-overlay');
  const resultOverlay = document.getElementById('result-overlay');
  const reviewListEl = document.getElementById('review-list');
  const btnReplaySame = document.getElementById('btn-replay-same');
  const btnReplaySelect = document.getElementById('btn-replay-select');
  const courseBtns = Array.from(document.querySelectorAll('.course-btn'));

  // 配色パレット（黒板＆積み木トーン、グラデーション・ネオン不使用）
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

  // ゲーム進行状態
  const TOTAL_QUESTIONS = 5;
  let currentCourse = 'make10'; // 'make10' | 'add10' | 'carry' | 'sub' | 'mul' | 'div'
  let questionIndex = 0;
  let questions = [];
  let currentQ = null; // { type, op, first, answer, target, choices }
  let solvedHistory = [];
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
  let transformedBlocks = []; // 変化後・破片・分裂後のブロック群
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

  // 数字に応じた積み木の色
  function getBlockColor(num) {
    if (num <= 0) return '#e2e2e2';
    if (num === 10) return '#ffcb77';
    if (num > 10) return '#ffd166';
    return COLORS.blockPalette[(num - 1) % COLORS.blockPalette.length];
  }

  // 数字に応じた積み木のサイズ（幅・高さ）
  function getBlockDimensions(num) {
    const scale = Math.min(1.05, Math.max(0.78, Math.min(stageWidth / 640, stageHeight / 300)));
    const clamped = Math.max(1, Math.min(25, num));
    const w = Math.round((74 + clamped * 3.8) * scale);
    const h = Math.round((64 + clamped * 2.5) * scale);
    return { w, h };
  }

  // コースに応じた5問を生成
  function generateQuestions(course) {
    const pool = [];

    if (course === 'make10') {
      // 10をつくろう： a ＋ [ ? ] ＝ 10
      for (let a = 1; a <= 9; a++) {
        pool.push({ type: 'add', op: '＋', first: a, answer: 10 - a, target: 10 });
      }
    } else if (course === 'add10') {
      // たしざん（10まで）： a ＋ [ ? ] ＝ target (5〜10)
      for (let target = 4; target <= 10; target++) {
        for (let a = 1; a < target; a++) {
          pool.push({ type: 'add', op: '＋', first: a, answer: target - a, target });
        }
      }
    } else if (course === 'carry') {
      // くりあがりの たしざん： a ＋ [ ? ] ＝ target (11〜18)
      for (let a = 3; a <= 9; a++) {
        for (let b = 2; b <= 9; b++) {
          if (a + b >= 11 && a + b <= 18) {
            pool.push({ type: 'add', op: '＋', first: a, answer: b, target: a + b });
          }
        }
      }
    } else if (course === 'sub') {
      // ひきざん： a － [ ? ] ＝ target (a: 4〜10, target: 1〜a-1)
      for (let a = 4; a <= 10; a++) {
        for (let target = 1; target < a; target++) {
          pool.push({ type: 'sub', op: '－', first: a, answer: a - target, target });
        }
      }
    } else if (course === 'mul') {
      // かけざん（九九のきほん）： a × [ ? ] ＝ target (2〜5の段)
      for (let a = 2; a <= 5; a++) {
        for (let b = 2; b <= 5; b++) {
          pool.push({ type: 'mul', op: '×', first: a, answer: b, target: a * b });
        }
      }
    } else if (course === 'div') {
      // わりざん（等分）： a ÷ [ ? ] ＝ target (割り切れる問題、answer: 2〜4)
      const targets = [2, 3, 4, 5];
      const answers = [2, 3, 4];
      targets.forEach((tg) => {
        answers.forEach((ans) => {
          const a = tg * ans;
          if (a <= 20) {
            pool.push({ type: 'div', op: '÷', first: a, answer: ans, target: tg });
          }
        });
      });
    }

    // シャッフル
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }

    const selected = pool.slice(0, TOTAL_QUESTIONS);
    return selected.map((q) => ({
      ...q,
      choices: generateFourChoices(q.answer, q.type)
    }));
  }

  // 4択ボタンの選択肢生成（正解を含む4つの数字）
  function generateFourChoices(correctAnswer, qType) {
    const set = new Set([correctAnswer]);
    const offsets = [-1, 1, -2, 2, -3, 3];
    for (const off of offsets) {
      if (set.size >= 4) break;
      const cand = correctAnswer + off;
      if (cand >= 1 && cand <= 10) {
        set.add(cand);
      }
    }
    while (set.size < 4) {
      const maxR = qType === 'mul' || qType === 'div' ? 6 : 9;
      const r = Math.floor(Math.random() * maxR) + 1;
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

  // ステージとトレイの構築
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

    // すでに配置されているブロックがあれば位置調整
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

  // すうじ積み木ボディの生成
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

  // ステージ上の全ブロックをクリア
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

  // トレイの上に最初の数字のブロックを配置
  function spawnBaseBlock(num) {
    clearBlocks();
    const { h } = getBlockDimensions(num);
    const centerX = stageWidth / 2;
    const startY = trayY - 11 - h / 2 - 4;
    baseBlock = createNumberBlock(centerX, startY, num, false);
  }

  // コース開始
  function startCourse(course) {
    clearAllTimers();
    currentCourse = course;
    questionIndex = 0;
    solvedHistory = [];
    questions = generateQuestions(course);

    titleOverlay.classList.add('is-hidden');
    resultOverlay.classList.add('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'true');

    setupStageGeometry();
    loadQuestion(0);
  }

  // 問題読み込み
  function loadQuestion(idx) {
    clearAllTimers();
    questionIndex = idx;
    currentQ = questions[idx];
    isInputLocked = false;
    hanamaruStamp = null;

    // 1. 黒板表示更新
    questionProgressEl.textContent = `だい ${idx + 1} もん / ${TOTAL_QUESTIONS} もん`;
    eqFirstEl.textContent = String(currentQ.first);
    eqOpEl.textContent = currentQ.op;
    eqBlankEl.textContent = '？';
    eqBlankEl.className = 'eq-blank';
    eqTargetEl.textContent = String(currentQ.target);

    let opText = 'たしざん';
    if (currentQ.type === 'sub') opText = 'ひきざん';
    else if (currentQ.type === 'mul') opText = 'かけざん';
    else if (currentQ.type === 'div') opText = 'わりざん';

    blackboardMessageEl.textContent = `したの すうじを おして ${currentQ.target}に しよう！`;
    blackboardMessageEl.className = 'blackboard-message';
    choicesLabelEl.textContent = 'どの すうじを いれる？ えらんで おしてね！';

    // 2. 下部4択ボタン更新
    choiceBtns.forEach((btn, i) => {
      const val = currentQ.choices[i];
      btn.dataset.value = String(val);
      btn.disabled = false;
      btn.classList.remove('is-pressed');

      let dotsHtml = '<div class="btn-dots" aria-hidden="true">';
      for (let d = 0; d < val; d++) {
        dotsHtml += '<span class="btn-dot"></span>';
      }
      dotsHtml += '</div>';

      btn.innerHTML = `<span>${val}</span>${dotsHtml}`;
    });

    // 3. トレイ上に最初のブロックをセット
    spawnBaseBlock(currentQ.first);
  }

  // 4択ボタン選択時の処理
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

    eqBlankEl.textContent = String(pickedNum);

    const { h } = getBlockDimensions(pickedNum);
    const dropX = stageWidth / 2;
    const dropY = Math.max(28, h / 2 + 6);

    hasTriggeredCollision = false;
    fallingBlock = createNumberBlock(dropX, dropY, pickedNum, true);
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

  // 演算（足し算・引き算・掛け算・割り算）の物理演出実行
  function performOperation() {
    if (!baseBlock || !fallingBlock || !currentQ) return;

    const firstVal = baseBlock.numberValue;
    const pickedVal = fallingBlock.numberValue;
    const op = currentQ.type;

    let resultVal = 0;
    if (op === 'add') resultVal = firstVal + pickedVal;
    else if (op === 'sub') resultVal = firstVal - pickedVal;
    else if (op === 'mul') resultVal = firstVal * pickedVal;
    else if (op === 'div') resultVal = Math.floor(firstVal / pickedVal);

    const midX = stageWidth / 2;
    const midY = (baseBlock.position.y + fallingBlock.position.y) / 2;

    World.remove(world, baseBlock);
    World.remove(world, fallingBlock);
    baseBlock = null;
    fallingBlock = null;

    if (op === 'add') {
      // 【たし算】合体して1つの大きなブロックに
      const merged = createNumberBlock(midX, midY, resultVal, false);
      merged.popScale = 0.65;
      Body.setVelocity(merged, { x: 0, y: -3.2 });
      transformedBlocks = [merged];

      window.se.playMerge(resultVal);

      shockwaves.push({
        x: midX,
        y: midY,
        r: 25,
        maxR: 110,
        alpha: 1.0,
        color: resultVal === currentQ.target ? '#2a9d8f' : '#e76f51'
      });
    } else if (op === 'sub') {
      // 【ひきざん】削り取り演出：引いた分（pickedVal）が右にポロリと落ちて、残りがトレイに残る
      const remVal = Math.max(0, resultVal);
      const remainBlock = createNumberBlock(midX, midY, remVal, false);
      Body.setVelocity(remainBlock, { x: -1, y: -2 });

      // 削り取られた破片ブロック（右へ弾け飛ぶ）
      const scrap = createNumberBlock(midX + 35, midY - 10, pickedVal, false);
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
        color: resultVal === currentQ.target ? '#2a9d8f' : '#a0c4ff'
      });
    } else if (op === 'mul') {
      // 【かけざん】増殖・変形演出：倍増して特大ブロックに変化
      const mulBlock = createNumberBlock(midX, midY, resultVal, false);
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
        color: resultVal === currentQ.target ? '#2a9d8f' : '#ffd166'
      });
    } else if (op === 'div') {
      // 【わりざん】等分・真っ二つ演出：パカッと左右に割れ、片方が答えとして残る
      const halfW = getBlockDimensions(resultVal).w;
      const leftPart = createNumberBlock(midX - halfW * 0.4, midY, resultVal, false);
      const rightPart = createNumberBlock(midX + halfW * 0.4, midY, resultVal, false);

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
        color: resultVal === currentQ.target ? '#2a9d8f' : '#ffc6ff'
      });
    }

    // 正解・おしい判定
    if (resultVal === currentQ.target) {
      handleCorrectAnswer(firstVal, pickedVal, resultVal);
    } else {
      handleWrongAnswer(firstVal, pickedVal, resultVal);
    }
  }

  // 正解時の処理
  function handleCorrectAnswer(firstVal, pickedVal, resultVal) {
    eqBlankEl.className = 'eq-blank is-filled-correct';
    blackboardMessageEl.textContent = `${firstVal} ${currentQ.op} ${pickedVal} ＝ ${resultVal}　せいかい！`;
    blackboardMessageEl.className = 'blackboard-message is-correct';
    choicesLabelEl.textContent = 'やったね！ ぴったり へんしん できたよ！';

    solvedHistory.push({
      first: firstVal,
      op: currentQ.op,
      answer: pickedVal,
      target: resultVal
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

    addTimer(() => {
      if (questionIndex + 1 < TOTAL_QUESTIONS) {
        loadQuestion(questionIndex + 1);
      } else {
        showResultScreen();
      }
    }, 1500);
  }

  // 間違えたとき（おしい！のヒント提示）
  function handleWrongAnswer(firstVal, pickedVal, resultVal) {
    const targetVal = currentQ.target;
    const op = currentQ.type;
    eqBlankEl.className = 'eq-blank is-filled-wrong';

    let hintText = '';
    if (op === 'add') {
      if (resultVal < targetVal) {
        hintText = `おしい！ ${firstVal} ＋ ${pickedVal} は ${resultVal} だね（あと ${targetVal - resultVal} たりないよ！）`;
      } else {
        hintText = `おしい！ ${firstVal} ＋ ${pickedVal} は ${resultVal} になっちゃった！（${resultVal - targetVal} おおきいね）`;
      }
    } else if (op === 'sub') {
      hintText = `おしい！ ${firstVal} － ${pickedVal} は ${resultVal} だね（めざすのは ${targetVal} だよ！）`;
    } else if (op === 'mul') {
      hintText = `おしい！ ${firstVal} × ${pickedVal} は ${resultVal} だね（めざすのは ${targetVal} だよ！）`;
    } else if (op === 'div') {
      hintText = `おしい！ ${firstVal} ÷ ${pickedVal} は ${resultVal} だね（めざすのは ${targetVal} だよ！）`;
    }

    blackboardMessageEl.textContent = hintText;
    blackboardMessageEl.className = 'blackboard-message is-hint';
    choicesLabelEl.textContent = 'もういちど すうじを えらんで みよう！';

    window.se.playOshii();

    floatingTexts.push({
      x: stageWidth / 2,
      y: Math.max(46, stageHeight * 0.22),
      text: `${firstVal} ${currentQ.op} ${pickedVal} ＝ ${resultVal}`,
      color: '#e76f51',
      life: 1.0
    });

    // 1秒後に元の最初のブロックに戻す
    addTimer(() => {
      window.se.playResetPop();

      transformedBlocks.forEach((b) => {
        if (b) {
          shockwaves.push({
            x: b.position.x,
            y: b.position.y,
            r: 18,
            maxR: 65,
            alpha: 0.8,
            color: COLORS.navy
          });
        }
      });

      spawnBaseBlock(firstVal);
      eqBlankEl.textContent = '？';
      eqBlankEl.className = 'eq-blank';

      choiceBtns.forEach((b) => {
        b.disabled = false;
        b.classList.remove('is-pressed');
      });
      isInputLocked = false;
    }, 1100);
  }

  // 100てん満点画面
  function showResultScreen() {
    window.se.playFanfare();

    reviewListEl.innerHTML = '';
    solvedHistory.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'review-item';
      li.innerHTML = `
        <span class="review-num-badge">だい ${idx + 1} もん</span>
        <span class="review-eq">${item.first} ${item.op} ${item.answer} ＝ ${item.target}</span>
        <span class="review-mark">せいかい</span>
      `;
      reviewListEl.appendChild(li);
    });

    resultOverlay.classList.remove('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'false');
  }

  // 紙吹雪パーティクル
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

  // 角丸長方形パス
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

  // 木のトレイ描画
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

  // すうじ積み木描画
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

    const fontSize = Math.round(Math.min(w, h) * 0.46);
    ctx.font = `800 ${fontSize}px 'M PLUS Rounded 1c', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.navy;
    ctx.fillText(String(num), 0, -h * 0.16);

    drawBlockDots(ctx, num, w, h);

    ctx.restore();
  }

  // 積み木内の●ドット描画
  function drawBlockDots(context, num, w, h) {
    if (num <= 0) return;
    const maxCols = 5;
    const rows = Math.ceil(num / maxCols);
    const dotRadius = Math.max(2.8, Math.min(5.0, Math.min(w, h) * 0.055));
    const colGap = dotRadius * 2.75;
    const rowGap = dotRadius * 2.45;
    const startY = h * 0.15 - ((rows - 1) * rowGap) * 0.25;

    let remaining = num;
    for (let r = 0; r < rows; r++) {
      const countInRow = Math.min(maxCols, remaining);
      const rowWidth = (countInRow - 1) * colGap;
      const startX = -rowWidth / 2;
      const y = startY + r * rowGap;

      for (let c = 0; c < countInRow; c++) {
        const x = startX + c * colGap;
        const dotIndex = r * maxCols + c;
        context.beginPath();
        context.arc(x, y, dotRadius, 0, Math.PI * 2);
        context.fillStyle = dotIndex >= 10 ? COLORS.hanamaruRed : COLORS.navy;
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
    // 1. 波紋
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

    // 2. 紙吹雪
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

    // 3. 吹き出しテキスト
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

    // 4. はなまる
    drawCanvasHanamaru();
  }

  // メインループ
  let lastTime = performance.now();
  function gameLoop(now) {
    const delta = Math.min(24, now - lastTime);
    lastTime = now;

    Engine.update(engine, delta);

    // フォールバック衝突判定
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

  courseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.se.playButton();
      const course = btn.dataset.course || 'make10';
      startCourse(course);
    });
  });

  btnBackTitle.addEventListener('click', () => {
    window.se.playButton();
    clearAllTimers();
    titleOverlay.classList.remove('is-hidden');
  });

  btnReplaySame.addEventListener('click', () => {
    window.se.playButton();
    startCourse(currentCourse);
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
  questions = generateQuestions('make10');
  loadQuestion(0);
  requestAnimationFrame(gameLoop);
})();
