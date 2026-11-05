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

  // ボタンを押したときの「ポコン！」
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

  // たし算：合体音
  playMerge(sumValue = 10) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

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

  // ひきざん：削り取り音
  playSubtract() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(620, t);
    osc1.frequency.exponentialRampToValueAtTime(280, t + 0.07);
    gain1.gain.setValueAtTime(0.28, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.08);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(340, t + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(480, t + 0.15);
    gain2.gain.setValueAtTime(0.22, t + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t + 0.06);
    osc2.stop(t + 0.16);
  }

  // かけざん：倍増音
  playMultiply() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [330, 440, 550, 660];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + idx * 0.045;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.1, st + 0.06);

      gain.gain.setValueAtTime(0.22, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(st);
      osc.stop(st + 0.07);
    });
  }

  // わりざん：等分割り音
  playDivide() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(480, t);
    osc1.frequency.exponentialRampToValueAtTime(140, t + 0.06);
    gain1.gain.setValueAtTime(0.22, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.07);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(520, t + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(660, t + 0.16);
    gain2.gain.setValueAtTime(0.2, t + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t + 0.04);
    osc2.stop(t + 0.18);
  }

  // 正解「ピンポン！」
  playPinPon() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { freq: 659.25, start: 0.0, dur: 0.22 },
      { freq: 523.25, start: 0.18, dur: 0.42 }
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

  // 花丸スタンプ「ポンッ！」
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

  // 不正解・おしい時の優しい木琴音（怖くない、残念な音）
  playOshii() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [
      { freq: 440, start: 0.0, dur: 0.16 }, // A4
      { freq: 349.23, start: 0.15, dur: 0.35 } // F4
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

  // 100点満点ファンファーレ
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

  // 60〜80点クリア時の前向きなジングル
  playCheer() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const melody = [
      { freq: 523.25, delay: 0.0, duration: 0.14 },
      { freq: 659.25, delay: 0.12, duration: 0.14 },
      { freq: 783.99, delay: 0.24, duration: 0.35 }
    ];

    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + note.delay;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + note.duration);
    });
  }
}

window.se = new SoundEffects();
