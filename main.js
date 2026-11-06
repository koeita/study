// すうじ つみき（ステージ制 ＆ A:限定つみき20種・B:3つ星評価・C:きせかえ5種 対応）
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
  const equationRowEl = document.getElementById('equation-row');
  const eqPartAEl = document.getElementById('eq-part-a');
  const eqOpEl = document.getElementById('eq-op');
  const eqPartBEl = document.getElementById('eq-part-b');
  const eqPartCEl = document.getElementById('eq-part-c');
  const blackboardMessageEl = document.getElementById('blackboard-message');
  const choicesLabelEl = document.getElementById('choices-label');
  const choicesGridEl = document.getElementById('choices-grid');
  const choiceBtns = Array.from(choicesGridEl.querySelectorAll('.choice-btn'));
  const sandboxControlsEl = document.getElementById('sandbox-controls');
  const sandboxToySelectorEl = document.getElementById('sandbox-toy-selector');
  const btnSandboxClear = document.getElementById('btn-sandbox-clear');

  const titleOverlay = document.getElementById('title-overlay');
  const resultOverlay = document.getElementById('result-overlay');
  const zukanOverlay = document.getElementById('zukan-overlay');
  const skinOverlay = document.getElementById('skin-overlay');

  const titleStarSvgEl = document.getElementById('title-star-svg');
  const totalStarsCountEl = document.getElementById('total-stars-count');
  const zukanBadgeCountEl = document.getElementById('zukan-badge-count');
  const skinBadgeCountEl = document.getElementById('skin-badge-count');

  const btnOpenZukan = document.getElementById('btn-open-zukan');
  const btnCloseZukan = document.getElementById('btn-close-zukan');
  const btnOpenSkin = document.getElementById('btn-open-skin');
  const btnCloseSkin = document.getElementById('btn-close-skin');
  const btnOpenSandbox = document.getElementById('btn-open-sandbox');

  const courseTabs = Array.from(document.querySelectorAll('.course-tab'));
  const countTabs = Array.from(document.querySelectorAll('.count-tab'));
  const stageListContainerEl = document.getElementById('stage-list-container');

  const zukanGridEl = document.getElementById('zukan-grid');
  const zukanTotalCollectedEl = document.getElementById('zukan-total-collected');
  const skinListEl = document.getElementById('skin-list');

  const rewardBannerEl = document.getElementById('reward-banner');
  const rewardBannerBadgeEl = document.getElementById('reward-banner-badge');
  const rewardIconBoxEl = document.getElementById('reward-icon-box');
  const rewardNameEl = document.getElementById('reward-name');
  const rewardSubtextEl = document.getElementById('reward-subtext');

  const skinUnlockBannerEl = document.getElementById('skin-unlock-banner');
  const skinUnlockNameEl = document.getElementById('skin-unlock-name');

  const resultStampWrapEl = document.getElementById('result-stamp-wrap');
  const resultStarsRowEl = document.getElementById('result-stars-row');
  const resultTitleEl = document.getElementById('result-title');
  const resultSubtitleEl = document.getElementById('result-subtitle');
  const reviewHeadingEl = document.getElementById('review-heading');
  const reviewListEl = document.getElementById('review-list');

  const btnNextStage = document.getElementById('btn-next-stage');
  const btnReplaySame = document.getElementById('btn-replay-same');
  const btnReplaySelect = document.getElementById('btn-replay-select');

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

  const COURSE_NAMES = {
    add: 'たしざん',
    sub: 'ひきざん',
    mul: 'かけざん',
    div: 'わりざん'
  };

  // =========================================
  // ステージ＆限定ご褒美つみき定義（全4コース×5ステージ＝20ステージ × 3段階＝全60種）
  // =========================================
  const STAGE_CATALOG = [
    // たしざんコース（どうぶつファミリー）
    {
      id: 'add_1', course: 'add', stageNum: 1,
      title: '5までの たしざん', example: '2 ＋ [ ？ ] ＝ 5',
      toys: {
        3: { id: 'chick_baby', name: 'ピヨピヨ', color: '#fff3b0', shape: 'chick', tier: 3 },
        5: { id: 'chick', name: 'ひよこ', color: '#ffe066', shape: 'chick', tier: 5 },
        10: { id: 'chick_king', name: 'キングひよこ', color: '#ffd166', shape: 'chick', tier: 10 }
      }
    },
    {
      id: 'add_2', course: 'add', stageNum: 2,
      title: '10を つくろう', example: '4 ＋ [ ？ ] ＝ 10',
      toys: {
        3: { id: 'rabbit_baby', name: 'こさぎ', color: '#ffe5ec', shape: 'rabbit', tier: 3 },
        5: { id: 'rabbit', name: 'うさぎ', color: '#ffc6ff', shape: 'rabbit', tier: 5 },
        10: { id: 'rabbit_moon', name: 'つきうさぎ', color: '#e0aaff', shape: 'rabbit', tier: 10 }
      }
    },
    {
      id: 'add_3', course: 'add', stageNum: 3,
      title: '10までの たしざん', example: '3 ＋ 5 ＝ [ ？ ]',
      toys: {
        3: { id: 'dog_baby', name: 'こいぬ', color: '#ffe8d6', shape: 'dog', tier: 3 },
        5: { id: 'dog', name: 'わんこ', color: '#ffd6a5', shape: 'dog', tier: 5 },
        10: { id: 'dog_hero', name: 'ヒーローわんこ', color: '#f4a261', shape: 'dog', tier: 10 }
      }
    },
    {
      id: 'add_4', course: 'add', stageNum: 4,
      title: 'くりあがりの たしざん', example: '7 ＋ [ ？ ] ＝ 13',
      toys: {
        3: { id: 'bear_baby', name: 'こぐま', color: '#e6ccb2', shape: 'bear', tier: 3 },
        5: { id: 'bear', name: 'くまさん', color: '#d4a373', shape: 'bear', tier: 5 },
        10: { id: 'bear_king', name: 'シロクマキング', color: '#ede0d4', shape: 'bear', tier: 10 }
      }
    },
    {
      id: 'add_5', course: 'add', stageNum: 5,
      title: 'たしざん マスター', example: '14 ＋ [ ？ ] ＝ 21',
      toys: {
        3: { id: 'lion_baby', name: 'こライオン', color: '#ffcb77', shape: 'lion', tier: 3 },
        5: { id: 'lion', name: 'ライオン', color: '#f4a261', shape: 'lion', tier: 5 },
        10: { id: 'lion_king', name: 'キングライオン', color: '#e76f51', shape: 'lion', tier: 10 }
      }
    },

    // ひきざんコース（おやつ・フルーツファミリー）
    {
      id: 'sub_1', course: 'sub', stageNum: 1,
      title: '5までの ひきざん', example: '5 － [ ？ ] ＝ 2',
      toys: {
        3: { id: 'apple_green', name: 'あおりんご', color: '#caffbf', shape: 'apple', tier: 3 },
        5: { id: 'apple', name: 'りんご', color: '#ff758f', shape: 'apple', tier: 5 },
        10: { id: 'apple_gold', name: 'きんのりんご', color: '#ffd166', shape: 'apple', tier: 10 }
      }
    },
    {
      id: 'sub_2', course: 'sub', stageNum: 2,
      title: '10からの ひきざん', example: '10 － [ ？ ] ＝ 6',
      toys: {
        3: { id: 'banana_mini', name: 'ミニバナナ', color: '#fdffb6', shape: 'banana', tier: 3 },
        5: { id: 'banana', name: 'バナナ', color: '#ffe066', shape: 'banana', tier: 5 },
        10: { id: 'banana_choco', name: 'チョコバナナ', color: '#d4a373', shape: 'banana', tier: 10 }
      }
    },
    {
      id: 'sub_3', course: 'sub', stageNum: 3,
      title: '10までの ひきざん', example: '8 － 3 ＝ [ ？ ]',
      toys: {
        3: { id: 'donut_mini', name: 'ミニドーナツ', color: '#e6ccb2', shape: 'donut', tier: 3 },
        5: { id: 'donut', name: 'ドーナツ', color: '#ddb892', shape: 'donut', tier: 5 },
        10: { id: 'donut_berry', name: 'いちごドーナツ', color: '#ffc6ff', shape: 'donut', tier: 10 }
      }
    },
    {
      id: 'sub_4', course: 'sub', stageNum: 4,
      title: 'くりさがりの ひきざん', example: '13 － [ ？ ] ＝ 8',
      toys: {
        3: { id: 'icecream_mini', name: 'ミニソフト', color: '#d8f3dc', shape: 'icecream', tier: 3 },
        5: { id: 'icecream', name: 'ダブルアイス', color: '#a8e6cf', shape: 'icecream', tier: 5 },
        10: { id: 'icecream_parfait', name: 'パフェアイス', color: '#ffb5a7', shape: 'icecream', tier: 10 }
      }
    },
    {
      id: 'sub_5', course: 'sub', stageNum: 5,
      title: 'ひきざん マスター', example: '18 － [ ？ ] ＝ 9',
      toys: {
        3: { id: 'cake_cup', name: 'カップケーキ', color: '#ffd6a5', shape: 'cake', tier: 3 },
        5: { id: 'cake', name: 'ショートケーキ', color: '#ffadad', shape: 'cake', tier: 5 },
        10: { id: 'cake_party', name: 'パーティケーキ', color: '#ffc6ff', shape: 'cake', tier: 10 }
      }
    },

    // かけざんコース（のりものファミリー）
    {
      id: 'mul_1', course: 'mul', stageNum: 1,
      title: '1・2の だん', example: '2 × [ ？ ] ＝ 8',
      toys: {
        3: { id: 'car_mini', name: 'ミニカー', color: '#bde0fe', shape: 'car', tier: 3 },
        5: { id: 'car', name: 'くるま', color: '#a0c4ff', shape: 'car', tier: 5 },
        10: { id: 'car_super', name: 'スーパーカー', color: '#ff758f', shape: 'car', tier: 10 }
      }
    },
    {
      id: 'mul_2', course: 'mul', stageNum: 2,
      title: '3・4の だん', example: '4 × [ ？ ] ＝ 12',
      toys: {
        3: { id: 'bus_mini', name: 'ちいさなバス', color: '#ffeaa7', shape: 'bus', tier: 3 },
        5: { id: 'bus', name: 'バス', color: '#ffd166', shape: 'bus', tier: 5 },
        10: { id: 'bus_double', name: '２かいだてバス', color: '#e76f51', shape: 'bus', tier: 10 }
      }
    },
    {
      id: 'mul_3', course: 'mul', stageNum: 3,
      title: '5・6の だん', example: '6 × 5 ＝ [ ？ ]',
      toys: {
        3: { id: 'train_steam', name: 'きしゃ', color: '#c7f9cc', shape: 'train', tier: 3 },
        5: { id: 'train', name: 'でんしゃ', color: '#88d49e', shape: 'train', tier: 5 },
        10: { id: 'train_bullet', name: 'しんかんせん', color: '#a0c4ff', shape: 'train', tier: 10 }
      }
    },
    {
      id: 'mul_4', course: 'mul', stageNum: 4,
      title: '7・8・9の だん', example: '8 × [ ？ ] ＝ 56',
      toys: {
        3: { id: 'plane_prop', name: 'プロペラき', color: '#d8f3dc', shape: 'plane', tier: 3 },
        5: { id: 'plane', name: 'ひこうき', color: '#caffbf', shape: 'plane', tier: 5 },
        10: { id: 'plane_jet', name: 'ジェットき', color: '#90e0ef', shape: 'plane', tier: 10 }
      }
    },
    {
      id: 'mul_5', course: 'mul', stageNum: 5,
      title: 'かけざん マスター', example: '7 × 9 ＝ [ ？ ]',
      toys: {
        3: { id: 'rocket_mini', name: 'ちびロケット', color: '#fdffb6', shape: 'rocket', tier: 3 },
        5: { id: 'rocket', name: 'ロケット', color: '#ffd166', shape: 'rocket', tier: 5 },
        10: { id: 'rocket_shuttle', name: 'スペースシャトル', color: '#f8f9fa', shape: 'rocket', tier: 10 }
      }
    },

    // わりざんコース（たからもの・ファンタジーファミリー）
    {
      id: 'div_1', course: 'div', stageNum: 1,
      title: '2で わる わりざん', example: '6 ÷ [ ？ ] ＝ 3',
      toys: {
        3: { id: 'flower_bud', name: 'つぼみ', color: '#ffd6a5', shape: 'flower', tier: 3 },
        5: { id: 'flower', name: 'おはな', color: '#ffc6ff', shape: 'flower', tier: 5 },
        10: { id: 'flower_rainbow', name: 'にじのはな', color: '#a0c4ff', shape: 'flower', tier: 10 }
      }
    },
    {
      id: 'div_2', course: 'div', stageNum: 2,
      title: '3・4で わる わりざん', example: '12 ÷ [ ？ ] ＝ 4',
      toys: {
        3: { id: 'gem_sapphire', name: 'サファイア', color: '#90e0ef', shape: 'gem', tier: 3 },
        5: { id: 'gem', name: 'エメラルド', color: '#80ed99', shape: 'gem', tier: 5 },
        10: { id: 'gem_diamond', name: 'ダイヤ', color: '#e0aaff', shape: 'gem', tier: 10 }
      }
    },
    {
      id: 'div_3', course: 'div', stageNum: 3,
      title: '5・6で わる わりざん', example: '18 ÷ 6 ＝ [ ？ ]',
      toys: {
        3: { id: 'star_silver', name: 'ぎんのほし', color: '#dee2e6', shape: 'star', tier: 3 },
        5: { id: 'star', name: 'きんのほし', color: '#f4d06f', shape: 'star', tier: 5 },
        10: { id: 'star_shooting', name: 'ながれぼし', color: '#ffcb77', shape: 'star', tier: 10 }
      }
    },
    {
      id: 'div_4', course: 'div', stageNum: 4,
      title: '7・8・9で わる わりざん', example: '24 ÷ [ ？ ] ＝ 3',
      toys: {
        3: { id: 'castle_house', name: 'こがたのおうち', color: '#ffe5d9', shape: 'castle', tier: 3 },
        5: { id: 'castle', name: 'おしろ', color: '#e6ccb2', shape: 'castle', tier: 5 },
        10: { id: 'castle_sky', name: 'きょだいじょう', color: '#b7b7a4', shape: 'castle', tier: 10 }
      }
    },
    {
      id: 'div_5', course: 'div', stageNum: 5,
      title: 'わりざん マスター', example: '36 ÷ [ ？ ] ＝ 6',
      toys: {
        3: { id: 'crown_silver', name: 'ぎんのかんむり', color: '#e9ecef', shape: 'crown', tier: 3 },
        5: { id: 'crown', name: 'きんのかんむり', color: '#f4a261', shape: 'crown', tier: 5 },
        10: { id: 'crown_king', name: 'おうさまかんむり', color: '#ffd700', shape: 'crown', tier: 10 }
      }
    }
  ];

  // おもちゃカタログ（全60種：全20ステージ × 3段階）
  const QUESTION_COUNTS = [3, 5, 10];
  const TOY_CATALOG = [];
  STAGE_CATALOG.forEach((st) => {
    QUESTION_COUNTS.forEach((cnt) => {
      const toy = st.toys[cnt];
      if (toy) {
        TOY_CATALOG.push({
          ...toy,
          count: cnt,
          stageId: st.id,
          stageRef: st,
          stageLabel: `${COURSE_NAMES[st.course]} ステージ${st.stageNum}`,
          condLabel: `${cnt}もんクリア`
        });
      }
    });
  });

  // =========================================
  // 案C：すうじ積み木 きせかえスキン定義（全5種）
  // =========================================
  function isStageClearedAnyCount(sd, stageId) {
    return [3, 5, 10].some((c) => (sd.stageStars[`${stageId}_${c}`] || 0) >= 1) || (sd.stageStars[stageId] || 0) >= 1;
  }

  const SKIN_CATALOG = [
    {
      id: 'standard',
      name: 'カラフル つみき',
      condText: 'はじめから つかえるよ',
      previewBg: '#ffcb77',
      previewText: '#2c3e50',
      checkUnlock: () => true
    },
    {
      id: 'gold',
      name: 'きんぴか ゴールド',
      condText: 'たしざん ステージ5 クリア または ほし 15こ',
      previewBg: '#ffd700',
      previewText: '#5c3c00',
      checkUnlock: (sd, stars) => isStageClearedAnyCount(sd, 'add_5') || stars >= 15
    },
    {
      id: 'sweets',
      name: 'おやつ スイーツ',
      condText: 'ひきざん ステージ5 クリア または ほし 30こ',
      previewBg: '#ffadad',
      previewText: '#5a2a27',
      checkUnlock: (sd, stars) => isStageClearedAnyCount(sd, 'sub_5') || stars >= 30
    },
    {
      id: 'night',
      name: 'きらきら ほしぞら',
      condText: 'かけざん ステージ5 クリア または ほし 50こ',
      previewBg: '#1d3557',
      previewText: '#ffe066',
      checkUnlock: (sd, stars) => isStageClearedAnyCount(sd, 'mul_5') || stars >= 50
    },
    {
      id: 'rainbow',
      name: 'にじいろ マスター',
      condText: 'わりざん ステージ5 クリア または ほし 80こ',
      previewBg: '#a8e6cf',
      previewText: '#2c3e50',
      checkUnlock: (sd, stars) => isStageClearedAnyCount(sd, 'div_5') || stars >= 80
    }
  ];

  // =========================================
  // セーブデータ管理（localStorage）
  // =========================================
  const SAVE_KEY = 'suuji_tsumiki_save_v2';
  let saveData = {
    stageStars: {},        // { 'add_1_3': 3, 'add_1_5': 2, 'add_1_10': 3, ... }
    unlockedToys: [],      // ['chick_baby', 'chick', ...]
    unlockedSkins: ['standard'],
    currentSkin: 'standard',
    totalClears: 0
  };

  function getTotalStars() {
    return Object.values(saveData.stageStars).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  function loadSaveData() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (json) {
        const loaded = JSON.parse(json);
        if (loaded && typeof loaded === 'object') {
          saveData = { ...saveData, ...loaded };
        }
      }
    } catch (e) {
      console.warn('saveData load failed', e);
    }

    if (!saveData.stageStars || typeof saveData.stageStars !== 'object') {
      saveData.stageStars = {};
    }

    // 旧データ（キーが 'add_1' 等）を 'add_1_5' にマイグレーション
    Object.keys(saveData.stageStars).forEach((key) => {
      if (/^[a-z]+_\d+$/.test(key)) {
        const val = saveData.stageStars[key];
        const newKey = `${key}_5`;
        if (saveData.stageStars[newKey] === undefined) {
          saveData.stageStars[newKey] = val;
        }
        delete saveData.stageStars[key];
      }
    });

    if (!Array.isArray(saveData.unlockedToys)) {
      saveData.unlockedToys = [];
    }
    if (!Array.isArray(saveData.unlockedSkins) || saveData.unlockedSkins.length === 0) {
      saveData.unlockedSkins = ['standard'];
    }
    if (!saveData.currentSkin) {
      saveData.currentSkin = 'standard';
    }

    // すでに各問題数をクリア済みのものがあれば該当おもちゃも同期
    STAGE_CATALOG.forEach((st) => {
      [3, 5, 10].forEach((cnt) => {
        const stars = saveData.stageStars[`${st.id}_${cnt}`] || 0;
        const toy = st.toys[cnt];
        if (stars >= 1 && toy && !saveData.unlockedToys.includes(toy.id)) {
          saveData.unlockedToys.push(toy.id);
        }
      });
    });

    // スキン解放チェック
    checkAndUnlockSkins();
  }

  function checkAndUnlockSkins() {
    const stars = getTotalStars();
    const newlyUnlocked = [];
    SKIN_CATALOG.forEach((skin) => {
      if (!saveData.unlockedSkins.includes(skin.id) && skin.checkUnlock(saveData, stars)) {
        saveData.unlockedSkins.push(skin.id);
        newlyUnlocked.push(skin);
      }
    });
    return newlyUnlocked;
  }

  function saveGameData() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('saveGameData failed', e);
    }
    refreshAllTitleUI();
  }

  // ステージが解放されているか判定（ステージ1は常時解放、ステージ2以降は前ステージのいずれかの問題数で星>=1で解放）
  function isStageUnlocked(stageObj) {
    if (stageObj.stageNum === 1) return true;
    const prevId = `${stageObj.course}_${stageObj.stageNum - 1}`;
    return [3, 5, 10].some((c) => (saveData.stageStars[`${prevId}_${c}`] || 0) >= 1);
  }

  // ゲーム進行状態
  let totalQuestions = 5;
  let selectedCourseTab = 'add';
  let currentStageObj = STAGE_CATALOG[0];
  let isSandboxMode = false;
  let questionIndex = 0;
  let questions = [];
  let currentQ = null;
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
  let transformedBlocks = [];
  let sandboxBodies = [];
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

  // 積み木の色（標準パステル）
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

  // =========================================
  // SVG生成ヘルパー（星＆20種のおもちゃアイコン）
  // =========================================
  function generateStarSVG(isFilled, className = 'stage-star-svg') {
    const fill = isFilled ? '#ffd166' : '#dcdcdc';
    const stroke = '#2c3e50';
    return `
      <svg viewBox="0 0 36 36" class="${className}">
        <polygon
          points="18,3 22.5,12.5 33,14 25.2,21.2 27.2,31.5 18,26.4 8.8,31.5 10.8,21.2 3,14 13.5,12.5"
          fill="${fill}"
          stroke="${stroke}"
          stroke-width="2.6"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }

  function generateToySVG(toy, isUnlocked) {
    const color = isUnlocked ? toy.color : '#b8b8b8';
    const stroke = COLORS.navy;
    const subWhite = isUnlocked ? '#ffffff' : '#d0d0d0';
    const accentRed = isUnlocked ? '#ff758f' : '#a0a0a0';
    const goldColor = isUnlocked ? '#ffd166' : '#cccccc';
    const s = toy.shape;
    const tier = toy.tier || 5;

    // 10問クリア用の王冠・スター・オーラ装飾パーツ
    const crownDecoration = tier === 10 ? `
      <polygon points="30,4 25,12 35,12" fill="${goldColor}" stroke="${stroke}" stroke-width="1.8" />
      <polygon points="21,7 23,13 18,13" fill="${goldColor}" stroke="${stroke}" stroke-width="1.6" />
      <polygon points="39,7 42,13 37,13" fill="${goldColor}" stroke="${stroke}" stroke-width="1.6" />
      <circle cx="30" cy="5" r="1.5" fill="${accentRed}" />
    ` : '';

    const babyRibbon = tier === 3 ? `
      <polygon points="20,16 26,20 20,24" fill="${accentRed}" stroke="${stroke}" stroke-width="1.5" />
      <polygon points="40,16 34,20 40,24" fill="${accentRed}" stroke="${stroke}" stroke-width="1.5" />
      <circle cx="30" cy="20" r="2.2" fill="${accentRed}" stroke="${stroke}" stroke-width="1.5" />
    ` : '';

    if (s === 'chick') {
      const scaleR = tier === 3 ? 15 : (tier === 10 ? 21 : 18);
      const cy = tier === 3 ? 36 : 33;
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <circle cx="30" cy="${cy}" r="${scaleR}" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="${30 - scaleR * 0.4}" cy="${cy - 3}" r="2.6" fill="${stroke}"/>
        <circle cx="${30 + scaleR * 0.4}" cy="${cy - 3}" r="2.6" fill="${stroke}"/>
        <polygon points="30,${cy} ${30 - 5},${cy + 5} ${30 + 5},${cy + 5}" fill="${accentRed}" stroke="${stroke}" stroke-width="2"/>
        ${tier === 10 ? `<path d="M 12 34 Q 18 28 20 34" stroke="${stroke}" stroke-width="2.5" fill="none" />
          <path d="M 48 34 Q 42 28 40 34" stroke="${stroke}" stroke-width="2.5" fill="none" />` : ''}
      </svg>`;
    } else if (s === 'rabbit') {
      const earH = tier === 3 ? 8 : (tier === 10 ? 14 : 11);
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <ellipse cx="22" cy="${20 - earH * 0.4}" rx="5" ry="${earH}" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <ellipse cx="38" cy="${20 - earH * 0.4}" rx="5" ry="${earH}" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <rect x="14" y="24" width="32" height="26" rx="12" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="24" cy="34" r="2.8" fill="${stroke}"/>
        <circle cx="36" cy="34" r="2.8" fill="${stroke}"/>
        <circle cx="30" cy="40" r="2.5" fill="${accentRed}"/>
        ${tier === 10 ? `<polygon points="30,12 32,16 36,17 33,20 34,24 30,22 26,24 27,20 24,17 28,16" fill="${goldColor}" stroke="${stroke}" stroke-width="1.5" />` : ''}
      </svg>`;
    } else if (s === 'dog') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <rect x="12" y="18" width="36" height="30" rx="8" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="15" cy="20" r="7" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="45" cy="20" r="7" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="23" cy="31" r="3" fill="${stroke}"/>
        <circle cx="37" cy="31" r="3" fill="${stroke}"/>
        <ellipse cx="30" cy="39" rx="4.5" ry="3" fill="${stroke}"/>
        ${tier === 3 ? `<circle cx="30" cy="18" r="3" fill="${accentRed}" />` : ''}
        ${tier === 10 ? `<polygon points="30,22 34,26 30,30 26,26" fill="${accentRed}" stroke="${stroke}" stroke-width="1.5" />` : ''}
      </svg>`;
    } else if (s === 'bear') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <circle cx="16" cy="18" r="7" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="44" cy="18" r="7" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <rect x="12" y="19" width="36" height="30" rx="12" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <ellipse cx="30" cy="38" rx="8" ry="6" fill="${subWhite}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="23" cy="29" r="2.8" fill="${stroke}"/>
        <circle cx="37" cy="29" r="2.8" fill="${stroke}"/>
        <circle cx="30" cy="36" r="2.8" fill="${stroke}"/>
      </svg>`;
    } else if (s === 'lion') {
      const maneR = tier === 3 ? 18 : (tier === 10 ? 24 : 21);
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <circle cx="30" cy="33" r="${maneR}" fill="${accentRed}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="30" cy="33" r="14" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="24" cy="30" r="2.5" fill="${stroke}"/>
        <circle cx="36" cy="30" r="2.5" fill="${stroke}"/>
        <polygon points="30,35 27,39 33,39" fill="${stroke}"/>
      </svg>`;
    } else if (s === 'apple') {
      const leafColor = isUnlocked ? '#88d49e' : '#bbbbbb';
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <rect x="28" y="10" width="4" height="10" rx="2" fill="${stroke}"/>
        <ellipse cx="35" cy="12" rx="5" ry="3" fill="${leafColor}" stroke="${stroke}" stroke-width="1.8" />
        <circle cx="24" cy="35" r="14" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="36" cy="35" r="14" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        ${tier === 10 ? `<circle cx="30" cy="35" r="4" fill="${subWhite}" opacity="0.8" />` : ''}
      </svg>`;
    } else if (s === 'banana') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <path d="M 16 44 Q 36 48 46 18 Q 36 32 16 34 Z" fill="${color}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        ${tier === 10 ? `<path d="M 16 44 Q 24 46 30 36 L 24 33 Z" fill="#6f4e37" stroke="${stroke}" stroke-width="2" />` : ''}
      </svg>`;
    } else if (s === 'donut') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <circle cx="30" cy="33" r="18" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="30" cy="33" r="6.5" fill="${subWhite}" stroke="${stroke}" stroke-width="3"/>
        ${tier === 10 ? `
          <circle cx="24" cy="24" r="2" fill="${accentRed}" />
          <circle cx="36" cy="24" r="2" fill="${goldColor}" />
          <circle cx="38" cy="36" r="2" fill="#88d49e" />
          <circle cx="22" cy="36" r="2" fill="#a0c4ff" />
        ` : ''}
      </svg>`;
    } else if (s === 'icecream') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <polygon points="20,32 40,32 30,54" fill="#f4a261" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="30" cy="26" r="13" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        ${tier >= 5 ? `<circle cx="30" cy="18" r="4" fill="${accentRed}" stroke="${stroke}" stroke-width="2"/>` : ''}
        ${tier === 10 ? `<circle cx="23" cy="26" r="6" fill="#ffd6a5" stroke="${stroke}" stroke-width="2"/>` : ''}
      </svg>`;
    } else if (s === 'cake') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <rect x="12" y="28" width="36" height="22" rx="4" fill="${subWhite}" stroke="${stroke}" stroke-width="3"/>
        <rect x="12" y="28" width="36" height="8" rx="3" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="30" cy="20" r="6" fill="${accentRed}" stroke="${stroke}" stroke-width="3"/>
        ${tier === 10 ? `<circle cx="20" cy="22" r="4" fill="${goldColor}" stroke="${stroke}" stroke-width="2"/>
          <circle cx="40" cy="22" r="4" fill="${goldColor}" stroke="${stroke}" stroke-width="2"/>` : ''}
      </svg>`;
    } else if (s === 'car') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <rect x="10" y="27" width="40" height="15" rx="4" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <rect x="18" y="17" width="24" height="12" rx="4" fill="${subWhite}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="19" cy="44" r="5.5" fill="${stroke}"/>
        <circle cx="41" cy="44" r="5.5" fill="${stroke}"/>
        ${tier === 10 ? `<polygon points="46,24 53,27 46,30" fill="${goldColor}" stroke="${stroke}" stroke-width="1.8" />` : ''}
      </svg>`;
    } else if (s === 'bus') {
      const busH = tier === 10 ? 32 : 25;
      const busY = tier === 10 ? 11 : 17;
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <rect x="10" y="${busY}" width="40" height="${busH}" rx="5" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <rect x="15" y="${busY + 5}" width="12" height="8" rx="2" fill="${subWhite}" stroke="${stroke}" stroke-width="2"/>
        <rect x="33" y="${busY + 5}" width="12" height="8" rx="2" fill="${subWhite}" stroke="${stroke}" stroke-width="2"/>
        ${tier === 10 ? `
          <rect x="15" y="${busY + 16}" width="12" height="8" rx="2" fill="${subWhite}" stroke="${stroke}" stroke-width="2"/>
          <rect x="33" y="${busY + 16}" width="12" height="8" rx="2" fill="${subWhite}" stroke="${stroke}" stroke-width="2"/>
        ` : ''}
        <circle cx="19" cy="45" r="5" fill="${stroke}"/>
        <circle cx="41" cy="45" r="5" fill="${stroke}"/>
      </svg>`;
    } else if (s === 'train') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <rect x="13" y="14" width="34" height="30" rx="${tier === 10 ? 12 : 5}" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <rect x="19" y="19" width="22" height="10" rx="2" fill="${subWhite}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="22" cy="36" r="3" fill="${subWhite}" stroke="${stroke}" stroke-width="2"/>
        <circle cx="38" cy="36" r="3" fill="${subWhite}" stroke="${stroke}" stroke-width="2"/>
        <line x1="16" y1="48" x2="44" y2="48" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>
      </svg>`;
    } else if (s === 'plane') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <polygon points="30,11 38,46 22,46" fill="${subWhite}" stroke="${stroke}" stroke-width="3"/>
        <polygon points="8,29 52,29 52,36 8,36" fill="${color}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        ${tier === 10 ? `<polygon points="26,16 34,16 30,8" fill="${accentRed}" stroke="${stroke}" stroke-width="2"/>` : ''}
      </svg>`;
    } else if (s === 'rocket') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <path d="M 30 10 Q 42 25 40 44 L 20 44 Q 18 25 30 10 Z" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <polygon points="16,36 10,48 20,44" fill="${accentRed}" stroke="${stroke}" stroke-width="3"/>
        <polygon points="44,36 50,48 40,44" fill="${accentRed}" stroke="${stroke}" stroke-width="3"/>
        <circle cx="30" cy="27" r="5" fill="${subWhite}" stroke="${stroke}" stroke-width="2.5"/>
      </svg>`;
    } else if (s === 'flower') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <circle cx="30" cy="18" r="8" fill="${color}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="30" cy="42" r="8" fill="${color}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="18" cy="30" r="8" fill="${color}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="42" cy="30" r="8" fill="${color}" stroke="${stroke}" stroke-width="2.5"/>
        <circle cx="30" cy="30" r="7.5" fill="${goldColor}" stroke="${stroke}" stroke-width="2.5"/>
      </svg>`;
    } else if (s === 'gem') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <polygon points="20,16 40,16 50,27 30,48 10,27" fill="${color}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        <line x1="10" y1="27" x2="50" y2="27" stroke="${stroke}" stroke-width="2.5"/>
        ${tier === 10 ? `<line x1="20" y1="16" x2="30" y2="48" stroke="${stroke}" stroke-width="2" />
          <line x1="40" y1="16" x2="30" y2="48" stroke="${stroke}" stroke-width="2" />` : ''}
      </svg>`;
    } else if (s === 'star') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <polygon points="30,9 36,22 51,24 40,34 43,49 30,41 17,49 20,34 9,24 24,22" fill="${color}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        ${tier === 10 ? `<circle cx="30" cy="30" r="5" fill="${subWhite}" opacity="0.8" />` : ''}
      </svg>`;
    } else if (s === 'castle') {
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        ${crownDecoration}
        <rect x="14" y="25" width="32" height="23" fill="${color}" stroke="${stroke}" stroke-width="3"/>
        <polygon points="12,25 22,13 32,25" fill="${accentRed}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="28,25 38,13 48,25" fill="${accentRed}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        <rect x="25" y="34" width="10" height="14" rx="4" fill="${subWhite}" stroke="${stroke}" stroke-width="2.5"/>
      </svg>`;
    } else {
      // crown
      return `<svg viewBox="0 0 60 60" width="100%" height="100%">
        <polygon points="10,44 12,21 24,32 30,15 36,32 48,21 50,44" fill="${color}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="30" cy="36" r="3.5" fill="${accentRed}" stroke="${stroke}" stroke-width="2"/>
        ${tier === 10 ? `
          <circle cx="13" cy="21" r="2.5" fill="${goldColor}" stroke="${stroke}" stroke-width="1.5" />
          <circle cx="30" cy="15" r="2.5" fill="${goldColor}" stroke="${stroke}" stroke-width="1.5" />
          <circle cx="47" cy="21" r="2.5" fill="${goldColor}" stroke="${stroke}" stroke-width="1.5" />
        ` : ''}
      </svg>`;
    }
  }

  // =========================================
  // タイトル画面・ステージリスト・図鑑・きせかえUI更新
  // =========================================
  function refreshAllTitleUI() {
    checkAndUnlockSkins();
    const totalStars = getTotalStars();
    titleStarSvgEl.innerHTML = generateStarSVG(true, 'stage-star-svg');
    totalStarsCountEl.textContent = String(totalStars);
    zukanBadgeCountEl.textContent = String(saveData.unlockedToys.length);
    skinBadgeCountEl.textContent = String(saveData.unlockedSkins.length);

    renderStageList();
    updateZukanUI();
    updateSkinUI();
    updateSandboxToySelector();
  }

  let currentZukanFilter = 'all';

  function renderStageList() {
    stageListContainerEl.innerHTML = '';
    const stages = STAGE_CATALOG.filter((s) => s.course === selectedCourseTab);

    stages.forEach((st) => {
      const unlocked = isStageUnlocked(st);
      const currentStarKey = `${st.id}_${totalQuestions}`;
      const stars = saveData.stageStars[currentStarKey] || 0;
      const currentToy = st.toys[totalQuestions] || st.toys[5];
      const hasToy = saveData.unlockedToys.includes(currentToy.id);

      const row = document.createElement('div');
      row.className = `stage-row-card ${unlocked ? '' : 'is-locked'}`;

      let starsHtml = '';
      for (let i = 1; i <= 3; i++) {
        starsHtml += generateStarSVG(i <= stars, 'stage-star-svg');
      }

      const toySvg = generateToySVG(currentToy, hasToy);
      const rewardStatusText = hasToy ? 'ゲットずみ！' : `${totalQuestions}もんで ゲット！`;
      const rewardStatusClass = hasToy ? 'stage-reward-tag is-got' : 'stage-reward-tag';
      const rewardToyName = hasToy ? currentToy.name : `「${currentToy.name}」`;

      const countsBadgesHtml = [3, 5, 10].map((cnt) => {
        const cStars = saveData.stageStars[`${st.id}_${cnt}`] || 0;
        const isCur = cnt === totalQuestions;
        const starsStr = '★'.repeat(cStars) + '☆'.repeat(3 - cStars);
        return `<span class="count-star-badge ${isCur ? 'is-current' : ''}">${cnt}もん: ${starsStr}</span>`;
      }).join('');

      row.innerHTML = `
        <div class="stage-left-info">
          <div class="stage-top-line">
            <span class="stage-num-badge">ステージ ${st.stageNum}</span>
            <span class="stage-title-text">${st.title}</span>
          </div>
          <div class="stage-sub-line">
            <div class="stage-stars-box" aria-label="${totalQuestions}もん ほし ${stars}こ">${starsHtml}</div>
            <span class="stage-example-text">${st.example}</span>
          </div>
          <div class="stage-counts-stars-row">
            ${countsBadgesHtml}
          </div>
        </div>

        <div class="stage-reward-preview">
          <div class="stage-reward-icon">${toySvg}</div>
          <div class="stage-reward-info">
            <span class="${rewardStatusClass}">${rewardStatusText}</span>
            <span class="stage-reward-name">${rewardToyName}</span>
          </div>
        </div>

        <button class="stage-play-btn" type="button" ${unlocked ? '' : 'disabled'}>
          <span>${unlocked ? 'あそぶ！' : 'カギ'}</span>
        </button>
      `;

      const playBtn = row.querySelector('.stage-play-btn');
      if (unlocked) {
        playBtn.addEventListener('click', () => {
          window.se.playButton();
          startStage(st, totalQuestions);
        });
      }

      stageListContainerEl.appendChild(row);
    });
  }

  function updateZukanUI() {
    const unlockedCount = saveData.unlockedToys.length;
    zukanTotalCollectedEl.textContent = String(unlockedCount);

    const filteredToys = currentZukanFilter === 'all'
      ? TOY_CATALOG
      : TOY_CATALOG.filter((t) => String(t.count) === currentZukanFilter);

    zukanGridEl.innerHTML = '';
    filteredToys.forEach((toy) => {
      const isUnlocked = saveData.unlockedToys.includes(toy.id);
      const card = document.createElement('div');
      card.className = `zukan-item ${isUnlocked ? '' : 'is-locked'}`;

      const iconSvg = generateToySVG(toy, isUnlocked);
      card.innerHTML = `
        <div class="zukan-icon-wrap">${iconSvg}</div>
        <span class="zukan-item-name">${isUnlocked ? toy.name : '？？？'}</span>
        <span class="zukan-item-stage">${toy.stageLabel}</span>
        <span class="count-star-badge" style="font-size: 0.68rem; margin-top: 2px;">${toy.condLabel}</span>
      `;
      zukanGridEl.appendChild(card);
    });
  }

  function updateSkinUI() {
    skinListEl.innerHTML = '';
    SKIN_CATALOG.forEach((skin) => {
      const isUnlocked = saveData.unlockedSkins.includes(skin.id);
      const isEquipped = saveData.currentSkin === skin.id;

      const row = document.createElement('div');
      row.className = `skin-row-card ${isEquipped ? 'is-active' : ''} ${isUnlocked ? '' : 'is-locked'}`;

      const btnLabel = !isUnlocked ? 'まだ ひらいてないよ' : (isEquipped ? 'つかいちゅう' : 'これに する！');

      row.innerHTML = `
        <div class="skin-preview-box" style="background-color: ${skin.previewBg}; color: ${skin.previewText};">
          10
        </div>
        <div class="skin-info">
          <span class="skin-name">${skin.name}</span>
          <span class="skin-cond">${skin.condText}</span>
        </div>
        <button class="skin-select-btn ${isEquipped ? 'is-equipped' : ''}" type="button" ${isUnlocked ? '' : 'disabled'}>
          ${btnLabel}
        </button>
      `;

      const btn = row.querySelector('.skin-select-btn');
      if (isUnlocked && !isEquipped) {
        btn.addEventListener('click', () => {
          window.se.playButton();
          saveData.currentSkin = skin.id;
          saveGameData();
        });
      }

      skinListEl.appendChild(row);
    });
  }

  function updateSandboxToySelector() {
    sandboxToySelectorEl.innerHTML = '';
    saveData.unlockedToys.forEach((toyId) => {
      const toy = TOY_CATALOG.find((t) => t.id === toyId);
      if (!toy) return;
      const btn = document.createElement('button');
      btn.className = 'toy-drop-btn';
      btn.type = 'button';
      btn.innerHTML = `<span>${toy.name}</span>`;
      btn.addEventListener('click', () => {
        window.se.playButton();
        dropToyInSandbox(toy);
      });
      sandboxToySelectorEl.appendChild(btn);
    });

    [1, 2, 3, 5, 10].forEach((n) => {
      const btn = document.createElement('button');
      btn.className = 'toy-drop-btn';
      btn.type = 'button';
      btn.innerHTML = `<span>[ ${n} ]</span>`;
      btn.addEventListener('click', () => {
        window.se.playButton();
        dropNumberInSandbox(n);
      });
      sandboxToySelectorEl.appendChild(btn);
    });
  }

  // =========================================
  // ステージ別 問題生成ロジック
  // =========================================
  function generateQuestionsForStage(stageObj, count) {
    const pool = [];
    const { course, stageNum } = stageObj;

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
      if (stageNum === 1) {
        // 5までのたしざん
        for (let res = 2; res <= 5; res++) {
          for (let a = 1; a < res; a++) {
            pool.push({ type: 'add', op: '＋', first: a, second: res - a, result: res });
          }
        }
      } else if (stageNum === 2) {
        // 10をつくるたしざん
        for (let a = 1; a <= 9; a++) {
          pool.push({ type: 'add', op: '＋', first: a, second: 10 - a, result: 10 });
        }
      } else if (stageNum === 3) {
        // 6〜10までのたしざん
        for (let res = 6; res <= 10; res++) {
          for (let a = 1; a < res; a++) {
            pool.push({ type: 'add', op: '＋', first: a, second: res - a, result: res });
          }
        }
      } else if (stageNum === 4) {
        // くりあがりのたしざん (11〜18)
        for (let a = 4; a <= 9; a++) {
          for (let b = 4; b <= 9; b++) {
            if (a + b >= 11 && a + b <= 18) {
              pool.push({ type: 'add', op: '＋', first: a, second: b, result: a + b });
            }
          }
        }
      } else {
        // たしざんマスター (11〜18 + 3〜9)
        for (let a = 11; a <= 17; a++) {
          for (let b = 3; b <= 8; b++) {
            pool.push({ type: 'add', op: '＋', first: a, second: b, result: a + b });
          }
        }
      }
    } else if (course === 'sub') {
      if (stageNum === 1) {
        // 5までのひきざん
        for (let a = 2; a <= 5; a++) {
          for (let b = 1; b < a; b++) {
            pool.push({ type: 'sub', op: '－', first: a, second: b, result: a - b });
          }
        }
      } else if (stageNum === 2) {
        // 10からのひきざん
        for (let b = 1; b <= 9; b++) {
          pool.push({ type: 'sub', op: '－', first: 10, second: b, result: 10 - b });
        }
      } else if (stageNum === 3) {
        // 6〜10のひきざん
        for (let a = 6; a <= 10; a++) {
          for (let b = 1; b < a; b++) {
            pool.push({ type: 'sub', op: '－', first: a, second: b, result: a - b });
          }
        }
      } else if (stageNum === 4) {
        // くりさがりのひきざん (11〜16)
        for (let a = 11; a <= 16; a++) {
          for (let b = a - 9; b <= 9; b++) {
            const res = a - b;
            if (res >= 2 && res <= 9) {
              pool.push({ type: 'sub', op: '－', first: a, second: b, result: res });
            }
          }
        }
      } else {
        // ひきざんマスター (15〜20)
        for (let a = 15; a <= 20; a++) {
          for (let b = 5; b <= 9; b++) {
            pool.push({ type: 'sub', op: '－', first: a, second: b, result: a - b });
          }
        }
      }
    } else if (course === 'mul') {
      const danMap = {
        1: [1, 2],
        2: [3, 4],
        3: [5, 6],
        4: [7, 8, 9],
        5: [2, 3, 4, 5, 6, 7, 8, 9]
      };
      const dans = danMap[stageNum] || [1, 2];
      dans.forEach((a) => {
        for (let b = 1; b <= 9; b++) {
          pool.push({ type: 'mul', op: '×', first: a, second: b, result: a * b });
        }
      });
    } else if (course === 'div') {
      const divMap = {
        1: [2],
        2: [3, 4],
        3: [5, 6],
        4: [7, 8, 9],
        5: [2, 3, 4, 5, 6, 7, 8, 9]
      };
      const divisors = divMap[stageNum] || [2];
      divisors.forEach((b) => {
        for (let res = 2; res <= 6; res++) {
          pool.push({ type: 'div', op: '÷', first: b * res, second: b, result: res });
        }
      });
    }

    // プールが少ない場合は繰り返して補充
    while (pool.length < count) {
      pool.push(...pool);
    }

    shuffle(pool);
    const selected = pool.slice(0, count);

    return selected.map((q, idx) => {
      const isBlankResult = idx % 2 === 1;
      const pattern = isBlankResult ? 'blankResult' : 'blankMiddle';
      const answer = isBlankResult ? q.result : q.second;

      return {
        ...q,
        pattern,
        answer,
        choices: generateFourChoices(answer, q.type, stageNum)
      };
    });
  }

  function generateFourChoices(correctAnswer, qType, stageNum) {
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
      const maxRand = qType === 'mul' ? (stageNum >= 4 ? 81 : 36) : 25;
      const r = Math.floor(Math.random() * maxRand) + 1;
      set.add(r);
    }

    return Array.from(set).sort((a, b) => a - b);
  }

  // =========================================
  // Matter.js 物理エンジン初期化・ステージ制御
  // =========================================
  function initPhysics() {
    engine = Engine.create();
    world = engine.world;
    engine.gravity.y = 1.25;

    setupStageGeometry();
    Events.on(engine, 'collisionStart', onCollisionStart);
  }

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
  }

  function createNumberBlock(x, y, num, isFalling = false) {
    const { w, h } = getBlockDimensions(num);
    const body = Bodies.rectangle(x, y, w, h, {
      chamfer: { radius: 12 },
      restitution: isFalling ? 0.2 : 0.45,
      friction: 0.6,
      frictionAir: 0.015,
      density: 0.002,
      label: isFalling ? 'fallingBlock' : 'numberBlock'
    });
    body.numberValue = num;
    body.customW = w;
    body.customH = h;
    body.popScale = 1.0;

    World.add(world, body);
    return body;
  }

  function clearBlocks() {
    if (baseBlock) {
      World.remove(world, baseBlock);
      baseBlock = null;
    }
    if (fallingBlock) {
      World.remove(world, fallingBlock);
      fallingBlock = null;
    }
    if (transformedBlocks.length > 0) {
      World.remove(world, transformedBlocks);
      transformedBlocks = [];
    }
    if (sandboxBodies.length > 0) {
      World.remove(world, sandboxBodies);
      sandboxBodies = [];
    }
  }

  function spawnBaseBlock(num) {
    clearBlocks();
    const { h } = getBlockDimensions(num);
    const centerX = stageWidth / 2;
    const spawnY = trayY - 11 - h / 2 - 4;
    baseBlock = createNumberBlock(centerX, spawnY, num, false);
  }

  // ステージ開始
  function startStage(stageObj, count) {
    isSandboxMode = false;
    clearAllTimers();
    currentStageObj = stageObj;
    totalQuestions = count || totalQuestions;
    questionIndex = 0;
    solvedHistory = [];
    questions = generateQuestionsForStage(currentStageObj, totalQuestions);

    titleOverlay.classList.add('is-hidden');
    titleOverlay.setAttribute('aria-hidden', 'true');
    resultOverlay.classList.add('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'true');
    zukanOverlay.classList.add('is-hidden');
    zukanOverlay.setAttribute('aria-hidden', 'true');
    skinOverlay.classList.add('is-hidden');
    skinOverlay.setAttribute('aria-hidden', 'true');

    equationRowEl.classList.remove('is-hidden');
    choicesGridEl.classList.remove('is-hidden');
    sandboxControlsEl.classList.add('is-hidden');

    levelBadgeEl.textContent = `ステージ ${currentStageObj.stageNum}`;
    levelBadgeEl.style.display = 'inline-block';
    setupStageGeometry();
    loadQuestion(0);
  }

  // つみき広場（自由モード）の開始
  function startSandboxMode() {
    isSandboxMode = true;
    clearAllTimers();
    clearBlocks();

    titleOverlay.classList.add('is-hidden');
    titleOverlay.setAttribute('aria-hidden', 'true');
    resultOverlay.classList.add('is-hidden');
    zukanOverlay.classList.add('is-hidden');
    skinOverlay.classList.add('is-hidden');

    equationRowEl.classList.add('is-hidden');
    choicesGridEl.classList.add('is-hidden');
    sandboxControlsEl.classList.remove('is-hidden');

    levelBadgeEl.textContent = 'ひろば';
    questionProgressEl.textContent = 'じゆう あそび';
    blackboardMessageEl.textContent = 'あつめた つみきを ポンポン おとして つみあげよう！';
    blackboardMessageEl.className = 'blackboard-message';
    choicesLabelEl.textContent = 'したの つみきを えらんで おしてね！';

    setupStageGeometry();
  }

  function dropToyInSandbox(toy) {
    const size = 56;
    const dropX = stageWidth / 2 + (Math.random() - 0.5) * 80;
    const dropY = 32;

    const block = Bodies.rectangle(dropX, dropY, size, size, {
      chamfer: { radius: 10 },
      restitution: 0.35,
      friction: 0.7,
      density: 0.002,
      label: 'toyBlock'
    });
    block.toyData = toy;
    block.customW = size;
    block.customH = size;

    Body.setVelocity(block, { x: (Math.random() - 0.5) * 1.5, y: 1.5 });
    World.add(world, block);
    sandboxBodies.push(block);

    if (sandboxBodies.length > 15) {
      const old = sandboxBodies.shift();
      World.remove(world, old);
    }
  }

  function dropNumberInSandbox(num) {
    const { w, h } = getBlockDimensions(num);
    const dropX = stageWidth / 2 + (Math.random() - 0.5) * 80;
    const dropY = 32;

    const block = Bodies.rectangle(dropX, dropY, w, h, {
      chamfer: { radius: 12 },
      restitution: 0.35,
      friction: 0.7,
      density: 0.002,
      label: 'numberBlock'
    });
    block.numberValue = num;
    block.customW = w;
    block.customH = h;
    block.popScale = 0.8;

    Body.setVelocity(block, { x: (Math.random() - 0.5) * 1.5, y: 1.5 });
    World.add(world, block);
    sandboxBodies.push(block);

    if (sandboxBodies.length > 15) {
      const old = sandboxBodies.shift();
      World.remove(world, old);
    }
  }

  // 問題ロード
  function loadQuestion(idx) {
    clearAllTimers();
    questionIndex = idx;
    currentQ = questions[idx];
    isInputLocked = false;
    hanamaruStamp = null;

    questionProgressEl.textContent = `だい${idx + 1}もん / ${totalQuestions}もん`;
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

  function onChoiceSelected(pickedNum, btnElement) {
    if (isInputLocked || !currentQ || isSandboxMode) return;
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

  function onCollisionStart(event) {
    if (isSandboxMode) return;
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
        x: midX, y: midY, r: 25, maxR: 110, alpha: 1.0,
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
        x: midX, y: midY, r: 20, maxR: 90, alpha: 1.0,
        color: pickedVal === currentQ.answer ? '#2a9d8f' : '#a0c4ff'
      });
    } else if (op === 'mul') {
      const mulBlock = createNumberBlock(midX, midY, calcResult, false);
      mulBlock.popScale = 0.55;
      Body.setVelocity(mulBlock, { x: 0, y: -4.0 });
      transformedBlocks = [mulBlock];
      window.se.playMultiply();

      shockwaves.push({
        x: midX, y: midY, r: 30, maxR: 130, alpha: 1.0,
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
        x: midX, y: midY, r: 20, maxR: 100, alpha: 1.0,
        color: pickedVal === currentQ.answer ? '#2a9d8f' : '#ffc6ff'
      });
    }

    if (pickedVal === currentQ.answer) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  }

  function handleCorrectAnswer() {
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

    addTimer(() => {
      if (questionIndex + 1 < totalQuestions) {
        loadQuestion(questionIndex + 1);
      } else {
        showResultScreen();
      }
    }, 1500);
  }

  function handleWrongAnswer() {
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

    addTimer(() => {
      if (questionIndex + 1 < totalQuestions) {
        loadQuestion(questionIndex + 1);
      } else {
        showResultScreen();
      }
    }, 1800);
  }

  // =========================================
  // 結果発表画面（A:限定つみき・B:星3つ・C:きせかえ解放）
  // =========================================
  function showResultScreen() {
    const correctCount = solvedHistory.filter((item) => item.isCorrect).length;
    const finalScore = Math.round((correctCount / totalQuestions) * 100);

    // 獲得した星（最後まで解けば最低★1、60点以上★2、100点★3）
    let earnedStars = 1;
    if (finalScore === 100) earnedStars = 3;
    else if (finalScore >= 60) earnedStars = 2;

    const currentCountKey = `${currentStageObj.id}_${totalQuestions}`;
    const prevStars = saveData.stageStars[currentCountKey] || 0;
    if (earnedStars > prevStars) {
      saveData.stageStars[currentCountKey] = earnedStars;
    }

    // ステージ＆問題数固有おもちゃの解放（初クリア時）
    const stageToy = currentStageObj.toys[totalQuestions] || currentStageObj.toys[5];
    const isFirstToyGet = !saveData.unlockedToys.includes(stageToy.id);
    if (isFirstToyGet) {
      saveData.unlockedToys.push(stageToy.id);
    }

    saveData.totalClears++;

    // スキン解放チェック
    const newlyUnlockedSkins = checkAndUnlockSkins();
    saveGameData();

    if (finalScore === 100) {
      window.se.playFanfare();
    } else {
      window.se.playCheer();
    }

    // 星3つ表示
    let resultStarsHtml = '';
    for (let i = 1; i <= 3; i++) {
      resultStarsHtml += generateStarSVG(i <= earnedStars, 'result-star-big');
    }
    resultStarsRowEl.innerHTML = resultStarsHtml;

    resultTitleEl.textContent = finalScore === 100 ? '100てん まんてん！' : `${finalScore}てん！`;

    const stLabel = `${COURSE_NAMES[currentStageObj.course]} ステージ${currentStageObj.stageNum}（${totalQuestions}もん）`;
    if (finalScore === 100) {
      resultSubtitleEl.textContent = `【${stLabel}】ほし3つ パーフェクト！ すごいね！`;
      renderStampSVG('hanamaru');
    } else if (finalScore >= 60) {
      resultSubtitleEl.textContent = `【${stLabel}】ステージ クリア！ つぎは まんてんを めざそう！`;
      renderStampSVG('maru');
    } else {
      resultSubtitleEl.textContent = `【${stLabel}】さいごまで がんばったね！`;
      renderStampSVG('fight');
    }

    // ステージクリア報酬バナー表示（毎回表示し、初回は強調）
    rewardBannerEl.classList.remove('is-hidden');
    rewardBannerBadgeEl.textContent = isFirstToyGet
      ? `【${totalQuestions}もんクリア】ごほうび ゲット！`
      : `【${totalQuestions}もん】ごほうび つみき`;
    rewardNameEl.textContent = `「${stageToy.name}」の つみき`;
    rewardSubtextEl.textContent = isFirstToyGet
      ? 'ずかんと つみきひろばに ついか されたよ！'
      : 'つみきひろばで あそべるよ！';
    rewardIconBoxEl.innerHTML = generateToySVG(stageToy, true);

    if (isFirstToyGet || newlyUnlockedSkins.length > 0) {
      addTimer(() => {
        window.se.playGetToy();
      }, 480);
    }

    // 新きせかえ解放バナー
    if (newlyUnlockedSkins.length > 0) {
      skinUnlockBannerEl.classList.remove('is-hidden');
      skinUnlockNameEl.textContent = `「${newlyUnlockedSkins[0].name}」`;
    } else {
      skinUnlockBannerEl.classList.add('is-hidden');
    }

    // 「つぎのステージへすすむ」ボタン表示判定
    const nextStageNum = currentStageObj.stageNum + 1;
    const nextStageObj = STAGE_CATALOG.find(
      (s) => s.course === currentStageObj.course && s.stageNum === nextStageNum
    );
    if (nextStageObj) {
      btnNextStage.classList.remove('is-hidden');
      btnNextStage.textContent = `つぎの ステージ ${nextStageNum} へ すすむ！`;
    } else {
      btnNextStage.classList.add('is-hidden');
    }

    reviewHeadingEl.textContent = `といた ${totalQuestions}もんの ふりかえり（${correctCount}もん せいかい）`;
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

  function renderStampSVG(type) {
    if (type === 'hanamaru') {
      resultStampWrapEl.innerHTML = `
        <svg viewBox="0 0 160 160" class="result-stamp-svg">
          <path
            d="M 80 12 Q 96 4, 104 20 Q 122 14, 124 32 Q 142 32, 138 50 Q 154 58, 144 74 Q 156 90, 140 102 Q 146 120, 128 124 Q 126 142, 108 138 Q 98 154, 80 144 Q 62 154, 52 138 Q 34 142, 32 124 Q 14 120, 20 102 Q 4 90, 16 74 Q 6 58, 22 50 Q 18 32, 36 32 Q 38 14, 56 20 Q 64 4, 80 12 Z"
            fill="#fff5f5" stroke="#e63946" stroke-width="6" stroke-linejoin="round"
          />
          <circle cx="80" cy="80" r="46" fill="none" stroke="#e63946" stroke-width="6" />
          <text x="80" y="88" text-anchor="middle" fill="#e63946" font-size="24" font-weight="800">100てん</text>
        </svg>
      `;
    } else if (type === 'maru') {
      resultStampWrapEl.innerHTML = `
        <svg viewBox="0 0 160 160" class="result-stamp-svg">
          <circle cx="80" cy="80" r="66" fill="#fff5f5" stroke="#e63946" stroke-width="8" />
          <circle cx="80" cy="80" r="48" fill="none" stroke="#e63946" stroke-width="5" />
          <text x="80" y="88" text-anchor="middle" fill="#e63946" font-size="24" font-weight="800">クリア！</text>
        </svg>
      `;
    } else {
      resultStampWrapEl.innerHTML = `
        <svg viewBox="0 0 160 160" class="result-stamp-svg">
          <circle cx="80" cy="80" r="66" fill="#f0f7ff" stroke="#457b9d" stroke-width="8" />
          <text x="80" y="76" text-anchor="middle" fill="#457b9d" font-size="24" font-weight="800">クリア！</text>
          <text x="80" y="104" text-anchor="middle" fill="#457b9d" font-size="18" font-weight="800">ナイス</text>
        </svg>
      `;
    }
  }

  function spawnConfetti(x, y, count) {
    const palette = ['#e63946', '#f4a261', '#ffcb77', '#2a9d8f', '#88d49e', '#a0c4ff', '#ffc6ff'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 3 + Math.random() * 7;
      confettiList.push({
        x, y,
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

  function drawToyBlock(block) {
    if (!block || !block.toyData) return;
    const { x, y } = block.position;
    const w = block.customW;
    const h = block.customH;
    const toy = block.toyData;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(block.angle);

    ctx.fillStyle = COLORS.navy;
    roundRect(ctx, -w / 2, -h / 2 + 4, w, h, 12);
    ctx.fill();

    ctx.fillStyle = toy.color;
    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 3.5;
    roundRect(ctx, -w / 2, -h / 2, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = "800 13px 'M PLUS Rounded 1c', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.navy;
    ctx.fillText(toy.name, 0, 0);

    ctx.restore();
  }

  // =========================================
  // 案C対応：きせかえスキン別 すうじ積み木描画
  // =========================================
  function drawNumberBlock(block) {
    if (!block) return;

    if (block.popScale < 1) {
      block.popScale = Math.min(1, block.popScale + 0.08);
    }

    const { x, y } = block.position;
    const w = block.customW * block.popScale;
    const h = block.customH * block.popScale;
    const num = block.numberValue;
    const skin = saveData.currentSkin || 'standard';

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(block.angle * 0.35);

    // 立体影
    ctx.fillStyle = COLORS.navy;
    roundRect(ctx, -w / 2, -h / 2 + 5, w, h, 14);
    ctx.fill();

    let textAndDotColor = COLORS.navy;

    if (skin === 'gold') {
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 3.5;
      roundRect(ctx, -w / 2, -h / 2, w, h, 14);
      ctx.fill();
      ctx.stroke();

      // 内枠のきらめきライン
      ctx.strokeStyle = '#fff9db';
      ctx.lineWidth = 2.5;
      roundRect(ctx, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 10);
      ctx.stroke();
      textAndDotColor = '#5c3c00';
    } else if (skin === 'sweets') {
      const sweetsPalette = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#ffc6ff'];
      ctx.fillStyle = sweetsPalette[(num - 1) % sweetsPalette.length];
      ctx.strokeStyle = '#5a2a27';
      ctx.lineWidth = 3.5;
      roundRect(ctx, -w / 2, -h / 2, w, h, 14);
      ctx.fill();
      ctx.stroke();

      // 上部のホワイトチョコ飾り
      ctx.save();
      roundRect(ctx, -w / 2, -h / 2, w, h, 14);
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w / 2, -h / 2, w, 12);
      ctx.restore();
      ctx.strokeStyle = '#5a2a27';
      ctx.lineWidth = 3.5;
      roundRect(ctx, -w / 2, -h / 2, w, h, 14);
      ctx.stroke();
      textAndDotColor = '#5a2a27';
    } else if (skin === 'night') {
      ctx.fillStyle = '#1d3557';
      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 3.5;
      roundRect(ctx, -w / 2, -h / 2, w, h, 14);
      ctx.fill();
      ctx.stroke();

      // 夜空の小さな星ドット飾り
      ctx.fillStyle = 'rgba(255, 224, 102, 0.5)';
      ctx.beginPath();
      ctx.arc(-w * 0.34, -h * 0.32, 2.5, 0, Math.PI * 2);
      ctx.arc(w * 0.34, -h * 0.28, 2, 0, Math.PI * 2);
      ctx.fill();
      textAndDotColor = '#ffe066';
    } else if (skin === 'rainbow') {
      ctx.save();
      roundRect(ctx, -w / 2, -h / 2, w, h, 14);
      ctx.clip();
      const stripes = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#a0c4ff'];
      const sh = h / stripes.length;
      stripes.forEach((sc, idx) => {
        ctx.fillStyle = sc;
        ctx.fillRect(-w / 2, -h / 2 + idx * sh, w, sh + 1);
      });
      ctx.restore();

      ctx.strokeStyle = COLORS.navy;
      ctx.lineWidth = 3.5;
      roundRect(ctx, -w / 2, -h / 2, w, h, 14);
      ctx.stroke();
      textAndDotColor = COLORS.navy;
    } else {
      // standard
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
    }

    const strNum = String(num);
    const fontScale = strNum.length >= 2 ? 0.38 : 0.44;
    const fontSize = Math.round(Math.min(w, h) * fontScale);
    ctx.font = `800 ${fontSize}px 'M PLUS Rounded 1c', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textAndDotColor;
    ctx.fillText(strNum, 0, -h * 0.18);

    ctx.save();
    roundRect(ctx, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 10);
    ctx.clip();
    drawBlockDots(ctx, num, w, h, textAndDotColor);
    ctx.restore();

    ctx.restore();
  }

  function drawBlockDots(context, num, w, h, dotColor = COLORS.navy) {
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

    context.fillStyle = dotColor;

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

  let lastTime = performance.now();
  function gameLoop(now) {
    const delta = Math.min(24, now - lastTime);
    lastTime = now;

    Engine.update(engine, delta);

    if (!isSandboxMode && fallingBlock && baseBlock && !hasTriggeredCollision) {
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

    sandboxBodies.forEach((b) => {
      if (b.label === 'toyBlock') {
        drawToyBlock(b);
      } else {
        drawNumberBlock(b);
      }
    });

    drawAndUpdateEffects();

    requestAnimationFrame(gameLoop);
  }

  // =========================================
  // イベントリスナー登録
  // =========================================
  choiceBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.value);
      if (!Number.isNaN(val)) {
        onChoiceSelected(val, btn);
      }
    });
  });

  courseTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      window.se.playButton();
      courseTabs.forEach((t) => t.classList.remove('is-selected'));
      tab.classList.add('is-selected');
      selectedCourseTab = tab.dataset.course || 'add';
      renderStageList();
    });
  });

  countTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      window.se.playButton();
      countTabs.forEach((t) => t.classList.remove('is-selected'));
      tab.classList.add('is-selected');
      totalQuestions = Number(tab.dataset.count) || 5;
      renderStageList();
    });
  });

  // 図鑑フィルタータブ
  const zukanFilterBtns = Array.from(document.querySelectorAll('.zukan-filter-btn'));
  zukanFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      window.se.playButton();
      zukanFilterBtns.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      currentZukanFilter = btn.dataset.filter || 'all';
      updateZukanUI();
    });
  });

  // 図鑑モーダル開閉
  function openZukan() {
    window.se.playButton();
    updateZukanUI();
    titleOverlay.classList.add('is-hidden');
    titleOverlay.setAttribute('aria-hidden', 'true');
    zukanOverlay.classList.remove('is-hidden');
    zukanOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeZukan() {
    window.se.playButton();
    zukanOverlay.classList.add('is-hidden');
    zukanOverlay.setAttribute('aria-hidden', 'true');
    titleOverlay.classList.remove('is-hidden');
    titleOverlay.setAttribute('aria-hidden', 'false');
    refreshAllTitleUI();
  }

  // きせかえモーダル開閉
  function openSkin() {
    window.se.playButton();
    updateSkinUI();
    titleOverlay.classList.add('is-hidden');
    titleOverlay.setAttribute('aria-hidden', 'true');
    skinOverlay.classList.remove('is-hidden');
    skinOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeSkin() {
    window.se.playButton();
    skinOverlay.classList.add('is-hidden');
    skinOverlay.setAttribute('aria-hidden', 'true');
    titleOverlay.classList.remove('is-hidden');
    titleOverlay.setAttribute('aria-hidden', 'false');
    refreshAllTitleUI();
  }

  btnOpenZukan.addEventListener('click', openZukan);
  btnCloseZukan.addEventListener('click', closeZukan);
  btnOpenSkin.addEventListener('click', openSkin);
  btnCloseSkin.addEventListener('click', closeSkin);

  btnOpenSandbox.addEventListener('click', () => {
    window.se.playButton();
    startSandboxMode();
  });

  btnSandboxClear.addEventListener('click', () => {
    window.se.playButton();
    clearBlocks();
  });

  btnBackTitle.addEventListener('click', () => {
    window.se.playButton();
    clearAllTimers();
    clearBlocks();
    isSandboxMode = false;
    equationRowEl.classList.remove('is-hidden');
    choicesGridEl.classList.remove('is-hidden');
    sandboxControlsEl.classList.add('is-hidden');
    titleOverlay.classList.remove('is-hidden');
    titleOverlay.setAttribute('aria-hidden', 'false');
    zukanOverlay.classList.add('is-hidden');
    skinOverlay.classList.add('is-hidden');
    resultOverlay.classList.add('is-hidden');
    refreshAllTitleUI();
  });

  btnNextStage.addEventListener('click', () => {
    window.se.playButton();
    const nextStageNum = currentStageObj.stageNum + 1;
    const nextStageObj = STAGE_CATALOG.find(
      (s) => s.course === currentStageObj.course && s.stageNum === nextStageNum
    );
    if (nextStageObj) {
      startStage(nextStageObj, totalQuestions);
    }
  });

  btnReplaySame.addEventListener('click', () => {
    window.se.playButton();
    startStage(currentStageObj, totalQuestions);
  });

  btnReplaySelect.addEventListener('click', () => {
    window.se.playButton();
    resultOverlay.classList.add('is-hidden');
    resultOverlay.setAttribute('aria-hidden', 'true');
    titleOverlay.classList.remove('is-hidden');
    titleOverlay.setAttribute('aria-hidden', 'false');
    refreshAllTitleUI();
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
  loadSaveData();
  initPhysics();
  refreshAllTitleUI();
  questions = generateQuestionsForStage(STAGE_CATALOG[0], totalQuestions);
  loadQuestion(0);
  requestAnimationFrame(gameLoop);
})();
