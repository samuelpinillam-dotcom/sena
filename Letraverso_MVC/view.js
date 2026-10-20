/* VISTA: renderiza la figura, las letras y las conexiones en Canvas. */
class LetterGameView {
  constructor() {
    this.canvas = document.querySelector("#gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.levelValue = document.querySelector("#levelValue");
    this.livesValue = document.querySelector("#livesValue");
    this.wordDisplay = document.querySelector("#wordDisplay");
    this.wordLabel = document.querySelector(".word-display .word-label");
    this.hintImage = document.querySelector("#hintImage");
    this.hintImageLabel = document.querySelector("#hintImageLabel");
    this.feedback = document.querySelector("#feedback");
    this.hint = document.querySelector("#canvasHint");
    this.nextBtn = document.querySelector("#nextBtn");
    this.resetBtn = document.querySelector("#resetBtn");
    this.state = null;
    this.points = [];
    this.lines = [];
    this.wrongIndices = new Set();
    this.onPick = () => {};
    this.onNext = () => {};
    this.onReset = () => {};
    this.canvas.addEventListener("pointerdown", e => this.handlePointer(e));
    this.nextBtn.addEventListener("click", () => this.onNext());
    this.resetBtn.addEventListener("click", () => this.onReset());
    window.addEventListener("resize", () => { this.layoutPoints(); this.draw(); });
    this.hintImage.addEventListener("error", () => {
      this.hintImage.alt = `No se encontró la imagen de ${this.state?.label || "ayuda"}`;
      this.hintImage.classList.add("image-missing");
    });
  }
  bind({ onPick, onNext, onReset }) {
    this.onPick = onPick; this.onNext = onNext; this.onReset = onReset;
  }
  setState(state) {
    const oldSignature = this.state ? `${this.state.word}|${this.state.nodes.map(n => n.letter).join("")}` : "";
    const newSignature = `${state.word}|${state.nodes.map(n => n.letter).join("")}`;
    this.state = state;
    // Conserva las coordenadas durante la partida; solo las sortea al cambiar de palabra.
    if (oldSignature !== newSignature || this.points.length !== state.nodes.length) this.layoutPoints();
    this.updateText();
    this.draw();
  }
  updateText() {
    const s = this.state;
    this.levelValue.textContent = String(s.level || 1);
    this.livesValue.textContent = `${"♥ ".repeat(s.lives || 0).trim()}${s.lives ? "" : "—"}`;
    this.livesValue.setAttribute("aria-label", `${s.lives} vidas restantes`);
    this.livesValue.classList.toggle("no-lives", s.lives === 0);
    if (s.gameOver) {
      // Al perder, la respuesta completa se revela; no dejamos una letra inicial
      // como pista porque ya se está mostrando la solución completa.
      this.wordLabel.textContent = "RESPUESTA REVELADA";
      this.wordDisplay.textContent = s.word.split("").join(" ");
    } else {
      this.wordLabel.textContent = "PALABRA ENCONTRADA";
      this.wordDisplay.textContent = s.word.split("").map((letter, i) => i < s.position ? letter : (s.revealedHint && i === s.position ? letter : "_")).join(" ");
    }
    this.hintImage.src = s.image;
    this.hintImage.alt = `Imagen de ayuda: ${s.label}`;
    this.hintImage.classList.remove("image-missing");
    this.hintImageLabel.textContent = "Observa la imagen y deduce la palabra";
    this.nextBtn.hidden = !(s.complete || s.gameOver);
    this.nextBtn.innerHTML = s.gameOver ? 'Nueva palabra <span>↻</span>' : 'Siguiente nivel <span>→</span>'; 
    this.wrongIndices.clear();
    if (s.gameOver) {
      this.feedback.textContent = "Te quedaste sin vidas. ¡Inténtalo otra vez!";
      this.feedback.className = "feedback error";
      this.hint.textContent = "Reintenta el nivel: la palabra cambiará y tendrás 3 vidas nuevas.";
    }
    if (s.complete) {
      this.feedback.textContent = `¡Correcto! Formaste ${s.label.toLocaleUpperCase("es")}.`;
      this.feedback.className = "feedback success";
      this.hint.textContent = "¡Figura revelada! Continúa con otra.";
    }
  }
  setFeedback(type, message, hint = "") {
    this.feedback.textContent = message;
    this.feedback.className = `feedback ${type}`;
    this.hint.textContent = hint || (type === "silent" ? "" : "Toca las letras en el orden de la palabra.");
  }
  flashWrong(index) { this.wrongIndices.add(index); this.draw(); }
  clearWrong(index) { this.wrongIndices.delete(index); this.draw(); }
  layoutPoints() {
    if (!this.state) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    if (!w) return;

    const nodes = this.state.nodes;
    const compact = w < 620;
    const radius = compact ? 13 : 15;
    // Celdas pequeñas con posiciones desplazadas: cubren el tablero sin formar
    // filas rígidas y garantizan un hueco visual entre los bordes de las fichas.
    const cellW = compact ? 39 : 43;
    const cellH = compact ? 43 : 47;
    const padding = radius + 8;
    const usableW = Math.max(cellW, w - padding * 2);
    const cols = Math.max(1, Math.floor(usableW / cellW));
    const rows = Math.ceil(nodes.length / cols);
    const minHeight = compact ? 570 : 540;
    const height = Math.max(minHeight, padding * 2 + rows * cellH);
    const usableH = height - padding * 2;
    const rowCount = Math.max(1, Math.ceil(usableH / cellH));

    // Creamos una nube de posiciones que ocupa desde arriba hasta abajo.
    // Se mezcla el orden de las celdas y se aplica jitter para evitar una cuadrícula visible.
    const cells = [];
    for (let row = 0; row < rowCount; row++) {
      const y0 = padding + (row + 0.5) * (usableH / rowCount);
      for (let col = 0; col < cols; col++) {
        const x0 = padding + (col + 0.5) * (usableW / cols);
        cells.push({
          x: Math.max(padding, Math.min(w - padding, x0 + (Math.random() - 0.5) * cellW * 0.42)),
          y: Math.max(padding, Math.min(height - padding, y0 + (Math.random() - 0.5) * cellH * 0.42))
        });
      }
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // El número de fichas se calcula para ocupar el tablero completo; no se dejan
    // todas arriba ni grandes franjas vacías. La celda limita la proximidad entre círculos.
    const placed = cells.slice(0, nodes.length);
    const area = this.canvas.closest('.drawing-area');
    if (area) area.style.height = `${height}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.style.minHeight = `${height}px`;

    this.points = nodes.map((node, i) => ({
      ...placed[i], letter: node.letter, order: node.order,
      target: node.target, index: i
    }));
    // IMPORTANTE: no volver a mezclar aquí. El modelo ya entrega las fichas
    // mezcladas y el controlador selecciona por índice del arreglo state.nodes.
    // Si la vista las mezcla otra vez, la letra visible deja de corresponder al
    // índice que recibe el modelo: se marca como error una letra que sí era correcta
    // y las líneas pueden conectarse con fichas equivocadas.
    this.points.forEach((point, index) => { point.index = index; });
  }
  handlePointer(event) {
    if (!this.state || this.state.complete || this.state.gameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    let best = -1, bestDistance = (this.canvas.getBoundingClientRect().width < 620 ? 19 : 22);
    this.points.forEach((p, i) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDistance) { best = i; bestDistance = d; }
    });
    if (best >= 0) this.onPick(best);
  }
  draw() {
    if (!this.state) return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width, h = rect.height;
    ctx.clearRect(0, 0, w, h);
    this.drawGrid(ctx, w, h);
    // Las conexiones permanecen visibles entre todas las letras seleccionadas.
    const selected = this.state.selectedIndices || [];
    if (selected.length > 1) {
      ctx.save();
      ctx.beginPath();
      selected.forEach((nodeIndex, i) => {
        const point = this.points[nodeIndex];
        if (!point) return;
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = "rgba(249,115,22,.9)";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(249,115,22,.35)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }
    this.points.forEach(p => this.drawLetter(ctx, p));
  }
  drawGrid(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = "rgba(148,163,184,.045)"; ctx.lineWidth = 1;
    for (let x=20; x<w; x+=28) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y=20; y<h; y+=28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.restore();
  }
  drawFigure(ctx, w, h, type, compact) {
    const cx = compact ? w/2 : w*.19;
    const cy = compact ? h*.20 : h*.50;
    const scale = compact ? Math.min(w*.22, h*.105) : Math.min(w*.105, h*.20);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale);
    ctx.shadowColor = "rgba(85,244,239,.16)"; ctx.shadowBlur = 20;
    if (type === "traffic-light") this.drawTrafficLight(ctx);
    else if (type === "bicycle") this.drawBicycle(ctx);
    else if (type === "guitar") this.drawGuitar(ctx);
    else if (type === "butterfly") this.drawButterfly(ctx);
    else this.drawPlanet(ctx);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#9aa7c8"; ctx.font = "10px 'DM Mono', monospace";
    ctx.textAlign = "center"; ctx.fillText("FIGURA DE REFERENCIA", cx, compact ? h*.37 : h*.86);
    ctx.restore();
  }
  drawTrafficLight(ctx) {
    ctx.lineWidth = 5; ctx.lineJoin = "round";
    ctx.strokeStyle = "#a6b7dc"; ctx.fillStyle = "#111a35";
    ctx.beginPath(); ctx.roundRect(-46,-108,92,218,18); ctx.fill(); ctx.stroke();
    [["#ff617d",-62],["#ffd66b",0],["#72f7b5",62]].forEach(([color,y])=>{
      ctx.beginPath(); ctx.arc(0,y,23,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
      ctx.beginPath(); ctx.arc(-7,y-7,6,0,Math.PI*2); ctx.fillStyle="rgba(255,255,255,.55)"; ctx.fill();
    });
    ctx.strokeStyle="#a6b7dc"; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(0,110); ctx.lineTo(0,155); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-42,157); ctx.lineTo(42,157); ctx.stroke();
  }
  drawBicycle(ctx) {
    ctx.strokeStyle="#55f4ef"; ctx.lineWidth=6; ctx.beginPath();
    ctx.arc(-70,35,43,0,Math.PI*2); ctx.moveTo(70,35); ctx.arc(70,35,43,0,Math.PI*2);
    ctx.moveTo(-70,35); ctx.lineTo(-20,-35); ctx.lineTo(10,35); ctx.lineTo(-70,35);
    ctx.lineTo(70,35); ctx.lineTo(30,-35); ctx.lineTo(-20,-35); ctx.moveTo(30,-35); ctx.lineTo(50,-35);
    ctx.stroke(); ctx.beginPath(); ctx.moveTo(-33,-45); ctx.lineTo(-8,-45); ctx.moveTo(20,-35); ctx.lineTo(42,-50); ctx.stroke();
  }
  drawGuitar(ctx) {
    ctx.fillStyle="#a68cff"; ctx.strokeStyle="#d6cbff"; ctx.lineWidth=4;
    ctx.beginPath(); ctx.ellipse(0,35,39,50,-.2,0,Math.PI*2); ctx.ellipse(0,-12,28,31,.2,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle="#111a35"; ctx.fillRect(-10,-120,20,110); ctx.strokeRect(-10,-120,20,110);
    ctx.fillStyle="#55f4ef"; ctx.beginPath(); ctx.arc(0,35,12,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#f1f4ff"; ctx.lineWidth=1.5; for(let x=-5;x<=5;x+=3){ctx.beginPath();ctx.moveTo(x,-115);ctx.lineTo(x,75);ctx.stroke();}
  }
  drawButterfly(ctx) {
    ctx.fillStyle="#a68cff"; ctx.strokeStyle="#d9d0ff"; ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(-36,-30,38,50,-.5,0,Math.PI*2);ctx.ellipse(36,-30,38,50,.5,0,Math.PI*2);
    ctx.ellipse(-34,34,30,38,.5,0,Math.PI*2);ctx.ellipse(34,34,30,38,-.5,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle="#55f4ef";ctx.beginPath();ctx.roundRect(-7,-50,14,100,7);ctx.fill();
    ctx.strokeStyle="#55f4ef";ctx.beginPath();ctx.moveTo(-3,-47);ctx.quadraticCurveTo(-28,-80,-35,-72);ctx.moveTo(3,-47);ctx.quadraticCurveTo(28,-80,35,-72);ctx.stroke();
  }
  drawPlanet(ctx) {
    ctx.strokeStyle="#55f4ef";ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,0,100,38,-.35,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#a68cff";ctx.beginPath();ctx.arc(0,0,52,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#55f4ef";ctx.beginPath();ctx.arc(-18,-15,12,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#d6cbff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,52,.3,2.4);ctx.stroke();
  }
  drawLetter(ctx, p) {
    const active = (this.state.selectedIndices || []).includes(p.index);
    const wrong = this.wrongIndices.has(p.index);
    const r = this.canvas.getBoundingClientRect().width < 620 ? 18 : (this.state.nodes.length > 55 ? 19 : 21);
    ctx.save();
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    // Colores sobrios: azul tinta y naranja cálido para letras encontradas.
    ctx.fillStyle = active ? "#f97316" : (wrong ? "#b91c1c" : "#1e293b");
    ctx.strokeStyle = active ? "#fed7aa" : (wrong ? "#fca5a5" : "#94a3b8");
    ctx.lineWidth = active ? 2.5 : 1.4;
    ctx.shadowColor = active ? "rgba(249,115,22,.45)" : (wrong ? "rgba(248,113,113,.55)" : "transparent");
    ctx.shadowBlur = active || wrong ? 12 : 0;
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${this.canvas.getBoundingClientRect().width < 620 ? 15 : 17}px Manrope, system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(p.letter, p.x, p.y + 1);
    ctx.restore();
  }
}
