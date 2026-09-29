/**
 * Apple Fitness Rings Volcanic Sparks & High-Speed Vortex Particle Physics Engine
 * Generates massive spark eruptions upon ring closure and continuous ember streams
 * trailing behind high-speed rotating ring heads.
 */

export interface RingSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glowColor: string;
  alpha: number;
  decay: number;
  streakLength: number;
  gravity: number;
  ringType: 'move' | 'exercise' | 'stand' | 'core';
}

export class RingsSparksManager {
  private sparks: RingSpark[] = [];

  // Apple Fitness signature vibrant neon palette with hot white/gold accents
  private palette = {
    move: {
      sparks: ['#ff1453', '#ff375f', '#ff5277', '#ff859e', '#ffd1dc', '#ff9f0a', '#ffffff'],
      glow: '#ff1453',
    },
    exercise: {
      sparks: ['#a6ff00', '#30d158', '#52e078', '#b5ff4d', '#e5ff99', '#ffd60a', '#ffffff'],
      glow: '#30d158',
    },
    stand: {
      sparks: ['#00f0ff', '#0a84ff', '#5ac8fa', '#80e5ff', '#d0f5ff', '#bf5af2', '#ffffff'],
      glow: '#00f0ff',
    },
    core: {
      sparks: ['#ffffff', '#fff3b0', '#ffd700', '#ffe066', '#ffffff'],
      glow: '#ffffff',
    },
  };

  /**
   * Massive Volcanic Spark Eruption triggered when all rings close
   * @param cx Center X
   * @param cy Center Y
   * @param radii Radii of Move, Exercise, Stand rings
   * @param density Total spark count (e.g. 500-900)
   */
  public triggerVolcanicEruption(
    cx: number,
    cy: number,
    radii: { move: number; exercise: number; stand: number },
    density: number = 650
  ) {
    const ringConfigs: Array<{ type: 'move' | 'exercise' | 'stand'; radius: number; ratio: number }> = [
      { type: 'move', radius: radii.move, ratio: 0.4 },
      { type: 'exercise', radius: radii.exercise, ratio: 0.35 },
      { type: 'stand', radius: radii.stand, ratio: 0.25 },
    ];

    // 1. Concentric Ring Eruptions along entire ring perimeters
    ringConfigs.forEach(({ type, radius, ratio }) => {
      const ringCount = Math.round(density * ratio);
      const colors = this.palette[type].sparks;
      const glow = this.palette[type].glow;

      for (let i = 0; i < ringCount; i++) {
        // Distribute around ring with slight radial jitter
        const angle = Math.random() * Math.PI * 2;
        const dist = radius + (Math.random() - 0.5) * 8;
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist;

        // Blast outward radially with random dispersion fan
        const dispersion = (Math.random() - 0.5) * 0.9;
        const blastAngle = angle + dispersion;
        const speed = 2.0 + Math.random() * 5.8;

        this.sparks.push({
          x: sx,
          y: sy,
          vx: Math.cos(blastAngle) * speed,
          vy: Math.sin(blastAngle) * speed,
          size: 1.5 + Math.random() * 2.8,
          color: colors[Math.floor(Math.random() * colors.length)],
          glowColor: glow,
          alpha: 1.0,
          decay: 0.009 + Math.random() * 0.016,
          streakLength: 4 + Math.random() * 8,
          gravity: 0.035 + Math.random() * 0.04,
          ringType: type,
        });
      }
    });

    // 2. High-Energy 12 O'Clock Crown Jet (Convergence point of all 3 rings)
    const crownCount = Math.round(density * 0.2);
    const coreColors = this.palette.core.sparks;
    for (let i = 0; i < crownCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4; // Shoots upward fan
      const speed = 3.5 + Math.random() * 7.5;
      const r = radii.stand + Math.random() * (radii.move - radii.stand);

      this.sparks.push({
        x: cx + (Math.random() - 0.5) * 12,
        y: cy - r + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.8 + Math.random() * 3.2,
        color: coreColors[Math.floor(Math.random() * coreColors.length)],
        glowColor: '#ffffff',
        alpha: 1.0,
        decay: 0.008 + Math.random() * 0.014,
        streakLength: 6 + Math.random() * 10,
        gravity: 0.045,
        ringType: 'core',
      });
    }
  }

  /**
   * Continuous Spark Stream emitted by a spinning ring head cap
   * @param type Ring identifier
   * @param capX Current X coordinate of ring end cap
   * @param capY Current Y coordinate of ring end cap
   * @param tangentAngle Direction tangent to ring rotation
   * @param count Particles to emit per frame
   * @param spinDirection 1 for clockwise, -1 for counter-clockwise
   */
  public emitSpinningSparks(
    type: 'move' | 'exercise' | 'stand',
    capX: number,
    capY: number,
    tangentAngle: number,
    count: number = 3,
    spinDirection: number = 1
  ) {
    const colors = this.palette[type].sparks;
    const glow = this.palette[type].glow;

    for (let i = 0; i < count; i++) {
      // Spray backwards/tangent from the rotating cap with fan spread
      const sprayAngle = tangentAngle + Math.PI + (Math.random() - 0.5) * 0.8 * spinDirection;
      const speed = 1.8 + Math.random() * 4.2;

      this.sparks.push({
        x: capX + (Math.random() - 0.5) * 4,
        y: capY + (Math.random() - 0.5) * 4,
        vx: Math.cos(sprayAngle) * speed,
        vy: Math.sin(sprayAngle) * speed,
        size: 1.2 + Math.random() * 2.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        glowColor: glow,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.025,
        streakLength: 3 + Math.random() * 6,
        gravity: 0.03,
        ringType: type,
      });
    }
  }

  /**
   * Physics step
   * @param dt delta time in seconds
   */
  public update(dt: number) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;

      // Air resistance
      s.vx *= 0.96;
      s.vy *= 0.96;

      // Gravity
      s.vy += s.gravity;

      // Alpha decay
      s.alpha -= s.decay * (dt * 60);

      if (s.alpha <= 0) {
        this.sparks.splice(i, 1);
      }
    }
  }

  /**
   * Render glowing sparks with additive bloom and motion streak tails
   */
  public render(ctx: CanvasRenderingContext2D) {
    if (this.sparks.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i];
      if (s.alpha <= 0) continue;

      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));

      // Motion blur streak tail
      const tailX = s.x - s.vx * s.streakLength * 0.35;
      const tailY = s.y - s.vy * s.streakLength * 0.35;

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Incandescent white spark head
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = s.glowColor;
      ctx.shadowBlur = 6;
      ctx.fill();
    }

    ctx.restore();
  }

  public get count(): number {
    return this.sparks.length;
  }

  public clear() {
    this.sparks = [];
  }
}
