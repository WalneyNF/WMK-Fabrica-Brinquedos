const BEST_KEY = 'wmkToyFactoryBest';
let DATA;
const state = {
  difficulty: 'facil',
  score: 0,
  lives: 5,
  time: 180,
  timer: null,
  currentOrder: null,
  selected: {
    body: null,
    color: null,
    clothe: null,
    accessory: null,
  },
  testFrame: 0,
  testInterval: null,
};

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

window.addEventListener('DOMContentLoaded', init);

async function init(){
  DATA = await loadData();
  $('#gameTitle').textContent = DATA.meta.title;
  $('#gameSubtitle').textContent = DATA.meta.subtitle;
  buildOptions();
  bindEvents();
  startGame();
}

async function loadData(){
  try{
    const res = await fetch('data/game-data.json');
    if(!res.ok) throw new Error('Falha no JSON');
    return await res.json();
  }catch(e){
    return window.WMK_TOY_FACTORY_DATA;
  }
}

function buildOptions(){
  buildOptionButtons('#bodyOptions', DATA.bodies, 'body', item => `<span class="emoji">${item.emoji}</span>${item.name}`);
  buildOptionButtons('#clotheOptions', DATA.clothes, 'clothe', item => item.name);
  buildOptionButtons('#accessoryOptions', DATA.accessories, 'accessory', item => item.name);

  const colorWrap = $('#colorOptions');
  colorWrap.innerHTML = '';
  DATA.colors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<div class="color-chip" style="background:${color.hex}"></div><span>${color.name}</span>`;
    btn.onclick = () => { state.selected.color = color.id; refreshSelection(); };
    btn.dataset.id = color.id;
    btn.dataset.section = 'color';
    colorWrap.appendChild(btn);
  });
}

function buildOptionButtons(selector, items, section, renderer){
  const wrap = $(selector);
  wrap.innerHTML = '';
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = renderer(item);
    btn.dataset.id = item.id;
    btn.dataset.section = section;
    btn.onclick = () => { state.selected[section] = item.id; refreshSelection(); };
    wrap.appendChild(btn);
  });
}

function bindEvents(){
  $$('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.difficulty-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.difficulty = btn.dataset.difficulty;
      startGame();
    });
  });
  $('#newGameBtn').onclick = startGame;
  $('#randomBuildBtn').onclick = randomBuild;
  $('#testToyBtn').onclick = runToyTest;
  $('#deliverBtn').onclick = deliverToy;
}

function startGame(){
  stopTimers();
  const preset = DATA.difficultyPresets[state.difficulty];
  state.score = 0;
  state.lives = preset.lives;
  state.time = preset.time;
  state.selected = {
    body: DATA.bodies[0].id,
    color: DATA.colors[0].id,
    clothe: DATA.clothes[0].id,
    accessory: DATA.accessories[0].id,
  };
  state.currentOrder = generateOrder();
  updateStats();
  renderOrder();
  refreshSelection();
  message('Nova partida iniciada! Monte o brinquedo pedido pelo cliente.');
  state.timer = setInterval(tick, 1000);
}

function stopTimers(){
  clearInterval(state.timer);
  clearInterval(state.testInterval);
  state.testFrame = 0;
}

function tick(){
  state.time--;
  updateStats();
  if(state.time <= 0){ endGame('⏰ O tempo acabou!'); }
}

function updateStats(){
  $('#scoreEl').textContent = state.score;
  $('#livesEl').textContent = state.lives;
  $('#timeEl').textContent = formatTime(state.time);
  $('#bestEl').textContent = localStorage.getItem(BEST_KEY) || '0';
}

function formatTime(sec){
  const m = String(Math.max(0, Math.floor(sec/60))).padStart(2,'0');
  const s = String(Math.max(0, sec%60)).padStart(2,'0');
  return `${m}:${s}`;
}

function generateOrder(){
  const body = sample(DATA.bodies);
  const color = sample(DATA.colors);
  const clothe = sample(DATA.clothes);
  const accessory = sample(DATA.accessories);
  const names = {
    urso: 'Urso', robo: 'Robô', foguete: 'Foguete', carrinho: 'Carrinho'
  };
  const prefix = sample(['Aventureiro', 'Estelar', 'Divertido', 'Turbo', 'Encantado', 'Brilhante']);
  return {
    body: body.id,
    color: color.id,
    clothe: clothe.id,
    accessory: accessory.id,
    name: `${names[body.id]} ${prefix}`,
  };
}

function renderOrder(){
  $('#orderName').textContent = state.currentOrder.name;
  const list = [
    ['Corpo', lookup(DATA.bodies, state.currentOrder.body).name],
    ['Cor', lookup(DATA.colors, state.currentOrder.color).name],
    ['Roupa', lookup(DATA.clothes, state.currentOrder.clothe).name],
    ['Acessório', lookup(DATA.accessories, state.currentOrder.accessory).name],
  ];
  $('#orderList').innerHTML = list.map(([k,v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('');
  drawToy($('#orderCanvas'), state.currentOrder, {jump:false, scale:0.92});
}

function refreshSelection(){
  $$('.option-btn').forEach(btn => {
    const section = btn.dataset.section;
    btn.classList.toggle('active', state.selected[section] === btn.dataset.id);
  });
  renderSummary();
  drawToy($('#toyCanvas'), state.selected, {jump:true, scale:1.05});
  drawToy($('#testCanvas'), state.selected, {jump:false, scale:0.82});
}

function renderSummary(){
  const lines = [
    ['Corpo', lookup(DATA.bodies, state.selected.body).name],
    ['Cor', lookup(DATA.colors, state.selected.color).name],
    ['Roupa', lookup(DATA.clothes, state.selected.clothe).name],
    ['Acessório', lookup(DATA.accessories, state.selected.accessory).name]
  ];
  $('#partsSummary').innerHTML = lines.map(([k,v]) => `<div class="part-item"><strong>${k}:</strong> ${v}</div>`).join('');
}

function randomBuild(){
  state.selected.body = sample(DATA.bodies).id;
  state.selected.color = sample(DATA.colors).id;
  state.selected.clothe = sample(DATA.clothes).id;
  state.selected.accessory = sample(DATA.accessories).id;
  refreshSelection();
  message('Montagem aleatória aplicada!');
}

function runToyTest(){
  clearInterval(state.testInterval);
  let frame = 0;
  $('#testText').textContent = 'Testando o brinquedo... ele está funcionando!';
  state.testInterval = setInterval(() => {
    frame++;
    drawToy($('#testCanvas'), state.selected, {jump: frame % 2 === 0, wave: frame % 3 === 0, scale:0.82, spin: frame});
    if(frame > 12){
      clearInterval(state.testInterval);
      $('#testText').textContent = 'Teste concluído! Seu brinquedo ficou divertido e pronto para entrega.';
    }
  }, 140);
  message('🧪 Teste iniciado! Veja seu brinquedo se mexendo.');
}

function deliverToy(){
  const ok = ['body','color','clothe','accessory'].every(key => state.selected[key] === state.currentOrder[key]);
  const preset = DATA.difficultyPresets[state.difficulty];
  if(ok){
    state.score += preset.scorePerHit;
    $('#customerMood').textContent = 'Cliente feliz';
    $('#customerText').textContent = 'Perfeito! Esse é exatamente o brinquedo que eu queria!';
    message('🎉 Pedido entregue com sucesso!');
  } else {
    state.score = Math.max(0, state.score + preset.scorePerMiss);
    state.lives -= 1;
    $('#customerMood').textContent = 'Cliente triste';
    $('#customerText').textContent = 'Ops! Esse não é o brinquedo do meu pedido...';
    message('❌ O pedido não combinou com o modelo solicitado.');
  }
  saveBest();
  updateStats();
  if(state.lives <= 0){ endGame('💥 Suas vidas acabaram!'); return; }
  state.currentOrder = generateOrder();
  renderOrder();
}

function saveBest(){
  const best = Number(localStorage.getItem(BEST_KEY) || 0);
  if(state.score > best){
    localStorage.setItem(BEST_KEY, String(state.score));
  }
}

function endGame(prefix){
  stopTimers();
  saveBest();
  updateStats();
  message(`${prefix} Sua pontuação final foi ${state.score}. Clique em Nova partida para jogar novamente.`);
}

function message(text){ $('#messageEl').textContent = text; }

function sample(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function lookup(arr, id){ return arr.find(item => item.id === id); }

function drawToy(canvas, config, opts = {}){
  const ctx = canvas.getContext('2d');
  const {width, height} = canvas;
  ctx.clearRect(0,0,width,height);

  // floor
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.beginPath(); ctx.ellipse(width/2, height-18, 76, 16, 0, 0, Math.PI*2); ctx.fill();

  const scale = opts.scale || 1;
  const cx = width/2;
  const jumpOffset = opts.jump ? -6 : 0;
  const spin = opts.spin ? Math.sin(opts.spin/2) * 4 : 0;
  const body = lookup(DATA.bodies, config.body);
  const color = lookup(DATA.colors, config.color);
  const clothe = lookup(DATA.clothes, config.clothe);
  const accessory = lookup(DATA.accessories, config.accessory);

  ctx.save();
  ctx.translate(cx, height/2 + 10 + jumpOffset);
  ctx.scale(scale, scale);

  if(body.id === 'urso') drawBear(ctx, color.hex, clothe.id, accessory.id, spin, opts.wave);
  if(body.id === 'robo') drawRobot(ctx, color.hex, clothe.id, accessory.id, spin, opts.wave);
  if(body.id === 'foguete') drawRocket(ctx, color.hex, clothe.id, accessory.id, spin, opts.wave);
  if(body.id === 'carrinho') drawCar(ctx, color.hex, clothe.id, accessory.id, spin, opts.wave);

  ctx.restore();
}

function drawBear(ctx, fill, clothe, accessory, spin, wave){
  const bodyColor = fill;
  circle(ctx, -48, -34, 16, bodyColor); circle(ctx, 48, -34, 16, bodyColor); // ears
  circle(ctx, 0, -18, 42, bodyColor); // head
  circle(ctx, 0, 50, 48, bodyColor); // body
  circle(ctx, -36, 96, 24, bodyColor); circle(ctx, 36, 96, 24, bodyColor); // feet
  circle(ctx, -58, 34, 18, bodyColor); circle(ctx, 58, 34, 18, bodyColor); // arms
  circle(ctx, 0, -8, 18, '#ecd1a8');
  circle(ctx, -14, -24, 4, '#2c1f2d'); circle(ctx, 14, -24, 4, '#2c1f2d');
  circle(ctx, 0, -10, 5, '#5a3126');
  line(ctx, -6, 0, 6, 0, '#9a4a51', 3);
  drawClothe(ctx, clothe);
  drawAccessory(ctx, accessory, wave);
}
function drawRobot(ctx, fill, clothe, accessory, spin, wave){
  roundRect(ctx, -40, -50, 80, 70, 16, fill, '#3d5970', 3);
  roundRect(ctx, -52, 26, 104, 78, 18, fill, '#3d5970', 3);
  line(ctx, 0, -62, 0, -88, '#475a6c', 5); circle(ctx, 0, -96, 10, '#ffd54f');
  circle(ctx, -18, -20, 8, '#fff'); circle(ctx, 18, -20, 8, '#fff');
  circle(ctx, -18, -20, 4, '#4d8fff'); circle(ctx, 18, -20, 4, '#4d8fff');
  line(ctx, -18, 0, 18, 0, '#334e62', 4);
  line(ctx, -52, 44, -82, 62 + (wave? -8:0), '#647b8e', 10); line(ctx, 52, 44, 82, 62, '#647b8e', 10);
  line(ctx, -20, 104, -20, 132, '#647b8e', 10); line(ctx, 20, 104, 20, 132, '#647b8e', 10);
  circle(ctx, -84, 62 + (wave? -8:0), 9, '#ffd76c'); circle(ctx, 84, 62, 9, '#ffd76c');
  circle(ctx, -20, 136, 12, '#475a6c'); circle(ctx, 20, 136, 12, '#475a6c');
  drawClothe(ctx, clothe);
  drawAccessory(ctx, accessory, wave);
}
function drawRocket(ctx, fill, clothe, accessory, spin, wave){
  // Use clothes as stripe style accessory as top fin feel
  ctx.save();
  ctx.translate(0, 25);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, -110); ctx.quadraticCurveTo(46, -36, 36, 80); ctx.lineTo(-36, 80); ctx.quadraticCurveTo(-46, -36, 0, -110); ctx.fill();
  ctx.strokeStyle = '#445687'; ctx.lineWidth = 4; ctx.stroke();
  roundRect(ctx, -18, -28, 36, 36, 50, '#e8f8ff', '#5273a8', 4);
  ctx.fillStyle = '#ff5f5f'; ctx.fillRect(-36, 60, 20, 26); ctx.fillRect(16, 60, 20, 26);
  triangle(ctx, -36, 15, -68, 38, -36, 55, '#ff8c58'); triangle(ctx, 36, 15, 68, 38, 36, 55, '#ff8c58');
  triangle(ctx, -18, 84, 0, 126, 18, 84, '#ffc53a');
  drawClothe(ctx, clothe);
  drawAccessory(ctx, accessory, wave);
  ctx.restore();
}
function drawCar(ctx, fill, clothe, accessory, spin, wave){
  ctx.save(); ctx.translate(0, 18);
  roundRect(ctx, -72, 16, 144, 54, 22, fill, '#4b5f8a', 4);
  roundRect(ctx, -44, -18, 88, 44, 16, fill, '#4b5f8a', 4);
  roundRect(ctx, -30, -8, 24, 20, 8, '#eaf8ff', '#4b5f8a', 3);
  roundRect(ctx, 6, -8, 24, 20, 8, '#eaf8ff', '#4b5f8a', 3);
  circle(ctx, -42, 76, 16, '#28354f'); circle(ctx, 42, 76, 16, '#28354f');
  circle(ctx, -42, 76, 7, '#dbe4ff'); circle(ctx, 42, 76, 7, '#dbe4ff');
  drawClothe(ctx, clothe);
  drawAccessory(ctx, accessory, wave);
  ctx.restore();
}

function drawClothe(ctx, id){
  ctx.save();
  if(id === 'colete'){
    roundRect(ctx, -28, 18, 56, 42, 14, '#5ed45d', '#4e9954', 3);
    line(ctx, 0, 18, 0, 60, '#d4f9da', 3);
  } else if(id === 'camiseta'){
    roundRect(ctx, -34, 20, 68, 38, 12, '#ff6a6a', '#ce3e3e', 3);
  } else if(id === 'jardineira'){
    roundRect(ctx, -30, 26, 60, 46, 14, '#4a8dff', '#355fbb', 3);
    line(ctx, -16, 26, -6, 12, '#4a8dff', 6); line(ctx, 16, 26, 6, 12, '#4a8dff', 6);
  } else if(id === 'armadura'){
    roundRect(ctx, -34, 18, 68, 48, 16, '#d8ecff', '#8da7c4', 3);
    line(ctx, -34, 42, 34, 42, '#8da7c4', 2);
  }
  ctx.restore();
}

function drawAccessory(ctx, id, wave){
  ctx.save();
  if(id === 'oculos'){
    circle(ctx, -16, -24, 12, 'transparent', '#6a4c31', 4); circle(ctx, 16, -24, 12, 'transparent', '#6a4c31', 4); line(ctx, -4, -24, 4, -24, '#6a4c31', 3);
  } else if(id === 'chapeu'){
    roundRect(ctx, -26, -70, 52, 18, 8, '#c68b43', '#8b5b2e', 3); roundRect(ctx, -16, -88, 32, 22, 8, '#d7a15b', '#8b5b2e', 3);
  } else if(id === 'laco'){
    triangle(ctx, -6, 4, -34, 20, -6, 26, '#ff5f93'); triangle(ctx, 6, 4, 34, 20, 6, 26, '#ff5f93'); circle(ctx, 0, 18, 8, '#ffe768');
  } else if(id === 'fone'){
    arc(ctx, 0, -32, 28, Math.PI, Math.PI*2, '#4158a4', 6); circle(ctx, -26, -18, 10, '#6e9cff'); circle(ctx, 26, -18, 10, '#6e9cff');
  }
  ctx.restore();
}

function circle(ctx,x,y,r,fill,stroke=null,lineWidth=0){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); if(fill !== 'transparent'){ctx.fillStyle=fill; ctx.fill();} if(stroke){ctx.strokeStyle=stroke; ctx.lineWidth=lineWidth; ctx.stroke();}}
function line(ctx,x1,y1,x2,y2,stroke,w=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke();}
function roundRect(ctx,x,y,w,h,r,fill,stroke=null,lw=0){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r); if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}}
function triangle(ctx,x1,y1,x2,y2,x3,y3,fill){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
function arc(ctx,x,y,r,a1,a2,stroke,w){ctx.beginPath();ctx.arc(x,y,r,a1,a2);ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
