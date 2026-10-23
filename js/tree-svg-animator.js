/**
 * EduPath AI - TreeSVGAnimator (High-Impact Biological Responsive Engine)
 * Synchronizes Figure 4.3 SVG in real-time with sliders:
 * 1. Physical root scaling & energetic glowing (roots grow deep or wither)
 * 2. Fruit sizing via #fruit-template (fruits grow from small buds to heavy ripe apples)
 * 3. Branch sagging under heavy fruit weight
 * 4. Real-time SVG percentage labels
 * 5. Dynamic nutrient flow velocity
 * 6. Tree tilt & tremor stability physics
 */
'use strict';

if (typeof window.sanitize === 'undefined') {
  window.sanitize = (html) => html;
}

class TreeSVGAnimator {
  constructor(svgContainerId = 'tree-svg-container') {
    this.container = document.getElementById(svgContainerId);
    if (!this.container) return;

    this.svg = this.container.querySelector('svg');
    if (!this.svg) return;

    this.state = {
      rootInterest: 0,
      rootAbility: 0,
      rootPersonality: 0,
      rootValues: 0,
      fruitExpectation: 0
    };

    this.isUnstable = false;
    this.stabilityRatio = 1.0;
    this.gsapAvailable = typeof window.gsap !== 'undefined';

    this.initElements();
    this.setupInteractivity();
    this.startAnimations();
    this.applyStateChanges(); // Initial render with full effects
  }

  initElements() {
    // Root elements with their anchor centers
    this.roots = {
      interest: { el: this.svg.querySelector('#root-interest'), origin: '382px 605px', glow: '#3b82f6' },
      ability: { el: this.svg.querySelector('#root-ability'), origin: '390px 612px', glow: '#10b981' },
      personality: { el: this.svg.querySelector('#root-personality'), origin: '400px 615px', glow: '#f59e0b' },
      values: { el: this.svg.querySelector('#root-values'), origin: '408px 599px', glow: '#a855f7' }
    };

    // Templates & Groups
    this.fruitTemplate = this.svg.querySelector('#fruit-template');
    this.treeTrunk = this.svg.querySelector('#tree-trunk');
    this.mainTrunk = this.svg.querySelector('#main-trunk');
    this.ribbon = this.svg.querySelector('#golden-ribbon');
    this.nutrientArrows = this.svg.querySelectorAll('.nutrient-arrow');
    this.branches = this.svg.querySelectorAll('.branch');
    this.leaves = this.svg.querySelectorAll('.leaf');
    this.fruits = this.svg.querySelectorAll('.fruit');

    // SVG Labels
    this.labels = {
      interest: this.svg.querySelector('#label-interest'),
      ability: this.svg.querySelector('#label-ability'),
      personality: this.svg.querySelector('#label-personality'),
      values: this.svg.querySelector('#label-values')
    };

    this.fruitLabels = this.svg.querySelectorAll('.fruit-label');
  }

  setupInteractivity() {
    // Fruit hover effects
    this.fruits.forEach((fruit) => {
      fruit.style.cursor = 'pointer';
      const labelText = fruit.getAttribute('data-label');

      fruit.addEventListener('mouseenter', () => {
        fruit.style.filter = 'drop-shadow(0 0 10px #f97316)';
        this.highlightCorrespondingLabel(labelText, true);
        if (window.app && window.app.playBeep) window.app.playBeep(880, 'sine', 0.05);
      });

      fruit.addEventListener('mouseleave', () => {
        fruit.style.filter = 'none';
        this.highlightCorrespondingLabel(labelText, false);
      });
    });

    // Root hover effects
    Object.keys(this.roots).forEach((key) => {
      const rootObj = this.roots[key];
      if (!rootObj || !rootObj.el) return;
      rootObj.el.style.cursor = 'pointer';

      rootObj.el.addEventListener('mouseenter', () => {
        rootObj.el.style.filter = `drop-shadow(0 0 12px ${rootObj.glow})`;
        if (window.app && window.app.playBeep) window.app.playBeep(440, 'sine', 0.05);
      });

      rootObj.el.addEventListener('mouseleave', () => {
        this.applyRootVisual(key, this.state['root' + key.charAt(0).toUpperCase() + key.slice(1)]);
      });
    });
  }

  highlightCorrespondingLabel(labelName, isHighlighted) {
    if (!labelName) return;
    this.fruitLabels.forEach((label) => {
      if (label.textContent.includes(labelName.split(' ')[0])) {
        label.style.fill = isHighlighted ? '#059669' : '#30302e';
        label.style.fontWeight = isHighlighted ? 'bold' : 'normal';
      }
    });
  }

  startAnimations() {
    if (this.gsapAvailable && window.gsap) {
      const gsap = window.gsap;

      // 1. Golden Ribbon Shimmer
      if (this.ribbon) {
        gsap.to(this.ribbon, {
          filter: 'drop-shadow(0 0 8px rgba(226, 196, 83, 0.9))',
          repeat: -1,
          yoyo: true,
          duration: 1.8,
          ease: 'sine.inOut'
        });
      }

      // 2. Branches Wind Sway
      this.branches.forEach((branch, i) => {
        gsap.to(branch, {
          rotation: (i % 2 === 0 ? 1.4 : -1.4),
          transformOrigin: 'bottom center',
          repeat: -1,
          yoyo: true,
          duration: 3.0 + (i * 0.35),
          ease: 'sine.inOut'
        });
      });

      // 3. Leaves fluttering
      this.leaves.forEach((leaf, idx) => {
        gsap.to(leaf, {
          rotation: `+=${idx % 2 === 0 ? 3.5 : -3.5}`,
          transformOrigin: 'center center',
          repeat: -1,
          yoyo: true,
          duration: 1.6 + (idx % 4) * 0.25,
          ease: 'sine.inOut'
        });
      });

      // 4. Fruit Pendulum Swing
      this.fruits.forEach((fruit, idx) => {
        gsap.to(fruit, {
          rotation: idx % 2 === 0 ? 3.5 : -3.5,
          transformOrigin: 'top center',
          repeat: -1,
          yoyo: true,
          duration: 2.2 + (idx % 3) * 0.3,
          ease: 'sine.inOut'
        });
      });
    }
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    return this.applyStateChanges();
  }

  applyStateChanges() {
    // 1. Update Fruit Size across ALL 14 fruits simultaneously via #fruit-template
    if (this.fruitTemplate) {
      const fruitPct = this.state.fruitExpectation;
      // Scale from 0.35x (dormant budding fruits at 0%) to 1.4x (giant heavy ripe apples)
      const fruitScale = fruitPct === 0 ? 0.35 : (0.45 + (fruitPct / 100) * 0.95);
      this.fruitTemplate.setAttribute('transform', `scale(${fruitScale.toFixed(3)})`);
    }

    // 2. Update Roots (Scale, Thickness, Glow and Opacity)
    this.applyRootVisual('interest', this.state.rootInterest);
    this.applyRootVisual('ability', this.state.rootAbility);
    this.applyRootVisual('personality', this.state.rootPersonality);
    this.applyRootVisual('values', this.state.rootValues);

    // 3. Update Labels inside SVG with Live Percentages
    if (this.labels.interest) {
      this.labels.interest.textContent = `Sở thích (${this.state.rootInterest}%)`;
    }
    if (this.labels.ability) {
      this.labels.ability.textContent = `Khả năng (${this.state.rootAbility}%)`;
    }
    if (this.labels.personality) {
      this.labels.personality.textContent = `Cá tính (${this.state.rootPersonality}%)`;
    }
    if (this.labels.values) {
      this.labels.values.innerHTML = window.sanitize(`<tspan x="634">Giá trị</tspan><tspan x="634" dy="30">nghề (${this.state.rootValues}%)</tspan>`);
    }

    // 4. Branch Sagging under heavy fruits
    if (this.treeTrunk) {
      const fruitWeight = this.state.fruitExpectation;
      const sagOffset = Math.max(0, (fruitWeight - 50) * 0.12); // sags down slightly if fruits are heavy
      this.branches.forEach((b) => {
        b.style.transform = `translateY(${sagOffset}px)`;
        b.style.transition = 'transform 0.4s ease';
      });
    }

    // 5. Nutrient Flow Velocity (Faster when roots are vigorous)
    const avgRoots = (this.state.rootInterest + this.state.rootAbility + this.state.rootPersonality + this.state.rootValues) / 4;
    const flowDuration = Math.max(0.4, 2.5 - (avgRoots / 100) * 1.8); // 0.7s at 100%, 2.5s at 10%
    this.nutrientArrows.forEach((arrow) => {
      arrow.style.animationDuration = `${flowDuration.toFixed(2)}s`;
      arrow.style.opacity = (avgRoots === 0 ? 0 : (0.3 + (avgRoots / 100) * 0.7)).toString();
      arrow.style.strokeWidth = `${2 + (avgRoots / 100) * 4}px`;
    });

    const canopyElements = [
      this.svg.querySelector('#tree-trunk'),
      this.svg.querySelector('#tree-leaves'),
      this.svg.querySelector('#tree-fruits')
    ];

    // Clean Initial State: All Sliders 0% (Uncalibrated)
    if (avgRoots === 0 && this.state.fruitExpectation === 0) {
      canopyElements.forEach((el) => {
        if (el) {
          el.style.transformOrigin = '400px 590px';
          el.style.transform = 'rotate(0deg)';
          el.style.transition = 'transform 0.5s ease';
        }
      });
      this.svg.classList.remove('tree-unstable');
      this.stabilityRatio = 0.0;
      this.isUnstable = false;

      return {
        avgRoots: 0,
        fruitDemand: 0,
        ratio: 0.00,
        isUnstable: false,
        stateType: 0
      };
    }

    // 6. Stability Physics Calculation (Root-to-Fruit Balance)
    const fruitDemand = Math.max(20, this.state.fruitExpectation);
    this.stabilityRatio = avgRoots / fruitDemand;
    this.isUnstable = this.stabilityRatio < 0.85;

    let stateType = 3;
    if (this.stabilityRatio < 0.85) {
      stateType = 1; // Cây nghiêng đổ
    } else if (this.stabilityRatio < 1.05) {
      stateType = 2; // Cây bắt đầu cân bằng
    } else {
      stateType = 3; // Cây vững vàng trĩu quả
    }

    if (stateType === 1) {
      // Tree tilts under excessive fruit weight with weak root foundation
      const tiltDegrees = -4.0 - Math.min(3.5, (0.85 - this.stabilityRatio) * 12);
      canopyElements.forEach((el) => {
        if (el) {
          el.style.transformOrigin = '400px 590px';
          el.style.transform = `rotate(${tiltDegrees}deg)`;
          el.style.transition = 'transform 0.5s ease-out';
        }
      });
      this.svg.classList.add('tree-unstable');
    } else {
      // Return to proud upright posture
      canopyElements.forEach((el) => {
        if (el) {
          el.style.transformOrigin = '400px 590px';
          el.style.transform = 'rotate(0deg)';
          el.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
      });
      this.svg.classList.remove('tree-unstable');
    }

    return {
      avgRoots: Math.round(avgRoots),
      fruitDemand: Math.round(fruitDemand),
      ratio: Number(this.stabilityRatio.toFixed(2)),
      isUnstable: this.isUnstable,
      stateType: stateType
    };
  }

  applyRootVisual(rootKey, percentage) {
    const rootObj = this.roots[rootKey];
    if (!rootObj || !rootObj.el) return;

    const el = rootObj.el;
    // Scale root geometry from its base: dormant at 0%, expands to 1.2x at 100%
    const scale = percentage === 0 ? 0.38 : (0.50 + (percentage / 100) * 0.70);
    el.style.transformOrigin = rootObj.origin;
    el.style.transform = `scale(${scale.toFixed(3)})`;
    el.style.transition = 'transform 0.35s ease, opacity 0.35s ease, filter 0.35s ease';

    // Opacity
    el.style.opacity = (percentage === 0 ? 0.2 : (0.35 + (percentage / 100) * 0.65)).toString();

    // Vibrant energetic glow when strong (>= 70%)
    if (percentage >= 70) {
      const glowBlur = Math.round((percentage - 60) * 0.25);
      el.style.filter = `drop-shadow(0 0 ${glowBlur}px ${rootObj.glow})`;
    } else {
      el.style.filter = 'none';
    }
  }

  handleResize() {
    // SVG scales naturally via viewBox
  }
}

window.TreeSVGAnimator = TreeSVGAnimator;
