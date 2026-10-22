/**
 * EduPath AI - Interactive Living Career Tree (Canvas 2D/3D Engine)
 * Visualizes Lesson 4 SGK: Tree of Career (Roots, Trunk, Branches, Fruits)
 * Incorporates dynamic stability physics and wind sway animations.
 */
'use strict';

class CareerTreeCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // State parameters (0 to 100)
    this.state = {
      rootInterest: 80,   // Rễ Sở thích
      rootAbility: 75,    // Rễ Năng lực
      rootPersonality: 85,// Rễ Cá tính
      rootFamily: 70,     // Rễ Bối cảnh gia đình
      fruitExpectation: 80 // Độ lớn của Quả ngọt (Mong muốn lương/vị thế)
    };

    this.windAngle = 0;
    this.animationFrameId = null;
    this.isViolentShake = false;
    this.stabilityIndex = 1.0;

    this.handleResize = this.handleResize.bind(this);
    this.render = this.render.bind(this);

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.start();
  }

  handleResize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = Math.max(480, rect.height || 540);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
  }

  calculateStability() {
    const avgRoots = (this.state.rootInterest + this.state.rootAbility + this.state.rootPersonality + this.state.rootFamily) / 4;
    const fruitStress = Math.max(20, this.state.fruitExpectation);
    // Ratio of root strength to fruit demand
    this.stabilityIndex = avgRoots / fruitStress;
    this.isViolentShake = this.stabilityIndex < 0.72;
    return {
      avgRoots: Math.round(avgRoots),
      fruitStress: Math.round(fruitStress),
      ratio: Number(this.stabilityIndex.toFixed(2)),
      isUnstable: this.isViolentShake
    };
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const groundY = this.height * 0.62;
    const centerX = this.width * 0.5;

    // Stability calculation
    this.calculateStability();

    // Wind animation
    const windSpeed = this.isViolentShake ? 0.18 : 0.035;
    const swayAmplitude = this.isViolentShake ? 0.09 : 0.02;
    this.windAngle += windSpeed;
    const sway = Math.sin(this.windAngle) * swayAmplitude;

    // 1. Draw Background Sky & Soil
    this.drawEnvironment(groundY);

    // 2. Draw 4 Taproots (Underground)
    this.drawRoots(centerX, groundY);

    // 3. Draw Tree Trunk & Branches (Above ground)
    this.drawTrunkAndCanopy(centerX, groundY, sway);

    this.animationFrameId = requestAnimationFrame(this.render);
  }

  drawEnvironment(groundY) {
    const ctx = this.ctx;

    // Underground soil gradient
    const soilGrad = ctx.createLinearGradient(0, groundY, 0, this.height);
    soilGrad.addColorStop(0, '#1e293b');
    soilGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(0, groundY, this.width, this.height - groundY);

    // Ground line with grass fringe
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.strokeStyle = this.isViolentShake ? '#ef4444' : '#10b981';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Soil status label
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('MẶT ĐẤT THỰC TIỄN', 16, groundY - 8);
    ctx.fillText('TẦNG GỐC RỄ NỘI TỰ TẠI (Năng lực, Sở thích, Cá tính, Gia đình)', 16, groundY + 20);
  }

  drawRoots(x, y) {
    const ctx = this.ctx;
    const maxDepth = this.height - y - 30;

    const rInterest = (this.state.rootInterest / 100) * maxDepth;
    const rAbility = (this.state.rootAbility / 100) * maxDepth;
    const rPersonality = (this.state.rootPersonality / 100) * maxDepth;
    const rFamily = (this.state.rootFamily / 100) * maxDepth;

    // Root 1: Sở thích (Trái xa)
    this.drawSingleRoot(x, y, x - 130, y + rInterest, '#2563eb', 'Rễ Sở thích (' + this.state.rootInterest + '%)', -0.5);

    // Root 2: Năng lực (Trực diện sâu)
    this.drawSingleRoot(x, y, x - 35, y + rAbility, '#10b981', 'Rễ Năng lực (' + this.state.rootAbility + '%)', -0.15);

    // Root 3: Cá tính (Thẳng đứng giữa)
    this.drawSingleRoot(x, y, x + 40, y + rPersonality, '#f59e0b', 'Rễ Cá tính (' + this.state.rootPersonality + '%)', 0.15);

    // Root 4: Gia đình (Phải)
    this.drawSingleRoot(x, y, x + 130, y + rFamily, '#8b5cf6', 'Rễ Gia đình (' + this.state.rootFamily + '%)', 0.5);
  }

  drawSingleRoot(x1, y1, x2, y2, color, label, curveBias) {
    const ctx = this.ctx;
    const midX = (x1 + x2) * 0.5 + curveBias * 40;
    const midY = (y1 + y2) * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Root tip pulse
    ctx.beginPath();
    ctx.arc(x2, y2, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(label, x2 - 20, y2 + 16);
    ctx.restore();
  }

  drawTrunkAndCanopy(x, y, swayAngle) {
    const ctx = this.ctx;
    const trunkHeight = 150;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(swayAngle);

    // Trunk
    const trunkGrad = ctx.createLinearGradient(-25, 0, 25, 0);
    trunkGrad.addColorStop(0, '#78350f');
    trunkGrad.addColorStop(0.5, '#92400e');
    trunkGrad.addColorStop(1, '#591c0b');

    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(-15, -trunkHeight * 0.5, -12, -trunkHeight);
    ctx.lineTo(12, -trunkHeight);
    ctx.quadraticCurveTo(15, -trunkHeight * 0.5, 22, 0);
    ctx.closePath();
    ctx.fillStyle = trunkGrad;
    ctx.fill();

    // Tree rings / bark textures
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -40);
    ctx.lineTo(14, -40);
    ctx.moveTo(-13, -90);
    ctx.lineTo(12, -90);
    ctx.stroke();

    // Branches & Foliage cluster
    const crownY = -trunkHeight;
    const branchColor = '#78350f';

    // Left Branch (CNTT & AI)
    this.drawBranchWithFruit(ctx, 0, crownY, -110, crownY - 70, branchColor, 'CNTT & Phần mềm', 'Lương 15-30tr', '#38bdf8');

    // Mid-Left Branch (Cơ điện tử & Robot)
    this.drawBranchWithFruit(ctx, 0, crownY, -40, crownY - 110, branchColor, 'Cơ điện tử & Robot', 'Lương 12-25tr', '#34d399');

    // Mid-Right Branch (Tự động hoá & Điện)
    this.drawBranchWithFruit(ctx, 0, crownY, 45, crownY - 110, branchColor, 'Điện & Tự động hoá', 'Lương 10-20tr', '#fbbf24');

    // Right Branch (Kỹ thuật Xây dựng & Kiến trúc)
    this.drawBranchWithFruit(ctx, 0, crownY, 115, crownY - 70, branchColor, 'Xây dựng & Kiến trúc', 'Lương 11-22tr', '#f472b6');

    // Foliage Center Cloud
    ctx.beginPath();
    const leafColor = this.isViolentShake ? '#ea580c' : '#059669';
    ctx.arc(0, crownY - 50, 65, 0, Math.PI * 2);
    ctx.fillStyle = leafColor;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Stability Badge
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const statusText = this.isViolentShake ? '⚠️ CÂY MẤT THĂNG BẰNG!' : '✨ CÂY PHÁT TRIỂN VỮNG VÀNG';
    ctx.fillText(statusText, 0, crownY - 45);

    ctx.restore();
  }

  drawBranchWithFruit(ctx, x1, y1, x2, y2, branchColor, branchName, salaryText, fruitColor) {
    ctx.save();
    // Branch wood
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) * 0.5, (y1 + y2) * 0.5 + 10, x2, y2);
    ctx.strokeStyle = branchColor;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Leaf cluster at branch tip
    ctx.beginPath();
    const leafColor = this.isViolentShake ? '#c2410c' : '#10b981';
    ctx.arc(x2, y2, 28, 0, Math.PI * 2);
    ctx.fillStyle = leafColor;
    ctx.fill();

    // Fruit (Quả ngọt: Cơ hội việc làm & Lương)
    const fruitScale = Math.max(12, (this.state.fruitExpectation / 100) * 22);
    ctx.beginPath();
    ctx.arc(x2, y2 + 10, fruitScale, 0, Math.PI * 2);
    ctx.fillStyle = fruitColor;
    ctx.shadowColor = fruitColor;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Branch Label
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(branchName, x2, y2 - 32);

    // Salary text
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(salaryText, x2, y2 + 14);

    ctx.restore();
  }

  start() {
    if (!this.animationFrameId) {
      this.render();
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
  }
}

window.CareerTreeCanvas = CareerTreeCanvas;
