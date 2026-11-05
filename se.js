// Web Audio API による効果音ジェネレーター（外部音声ファイル不使用）
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.init();
      this.playButton();
    }
    return this.enabled;
  }

  // ボタンを押したときの「ポコン！」という気持ちいい音
  playButton() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.13);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // 積み木同士がぶつかって合体するときの「ガチャン！」という明るく小気味よい音
  playMerge(sumValue = 10) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. 積み木がぶつかる「カチン・ガチャン」というアタック音
    const impactOsc = this.ctx.createOscillator();
    const impactGain = this.ctx.createGain();
    impactOsc.type = 'triangle';
    impactOsc.frequency.setValueAtTime(220, t);
    impactOsc.frequency.exponentialRampToValueAtTime(110, t + 0.07);
    impactGain.gain.setValueAtTime(0.32, t);
    impactGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    impactOsc.connect(impactGain);
    impactGain.connect(this.ctx.destination);
    impactOsc.start(t);
    impactOsc.stop(t + 0.08);

    // 2. 合体してきらめく倍音チャイム
    const baseFreq = 380 + Math.min(20, sumValue) * 16;
    const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + 0.03 + i * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  // 正解の「ピンポン！」というチャイム音
  playPinPon() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { freq: 659.25, start: 0.0, dur: 0.22 }, // E5（ピン）
      { freq: 523.25, start: 0.18, dur: 0.42 } // C5（ポン）
    ];

    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const s = t + n.start;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, s);

      gain.gain.setValueAtTime(0.001, s);
      gain.gain.linearRampToValueAtTime(0.3, s + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, s + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(s);
      osc.stop(s + n.dur);
    });
  }

  // 花丸が押されるときの「ポンッ！」というスタンプ音
  playHanamaru() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.09);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 「おしい！」のときの優しく温かい木琴風の音（怖くない音）
  playOshii() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { freq: 440, start: 0.0, dur: 0.15 },
      { freq: 392, start: 0.14, dur: 0.24 }
    ];

    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const s = t + n.start;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, s);

      gain.gain.setValueAtTime(0.22, s);
      gain.gain.exponentialRampToValueAtTime(0.001, s + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(s);
      osc.stop(s + n.dur);
    });
  }

  // 元のブロックに「ポンッ！」と戻るときの軽い音
  playResetPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.09);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 5問クリア（100てんまんてん）時の華やかなファンファーレ
  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const melody = [
      { freq: 523.25, delay: 0.0, duration: 0.13 },
      { freq: 659.25, delay: 0.11, duration: 0.13 },
      { freq: 783.99, delay: 0.22, duration: 0.15 },
      { freq: 1046.5, delay: 0.35, duration: 0.55 },
      { freq: 659.25, delay: 0.35, duration: 0.55 },
      { freq: 783.99, delay: 0.35, duration: 0.55 }
    ];

    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + note.delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.24, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + note.duration);
    });
  }
}

window.se = new SoundEffects();
