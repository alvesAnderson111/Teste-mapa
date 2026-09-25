'use strict';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d'),KEY='quadra-city-v1';
let state=Rules.fresh(),type='res',selection=null,panMode=false,ready=false,models={},sprites={},width=0,height=0,tile=72,ox=0,oy=0,frame=0;
let noticeTimer;
try{const saved=localStorage.getItem(KEY);if(saved){const restored=Rules.restore(JSON.parse(saved));if(restored)state=restored;else notify('O salvamento não pôde ser recuperado. Uma nova cidade foi aberta.');}}catch(e){notify('Salvamento indisponível. A cidade ficará apenas nesta sessão.');}
function short(n){return '$ '+(n>=1000?new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(n/1000)+'k':new Intl.NumberFormat('pt-BR').format(n));}
function exact(n){return '$ '+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
function notify(message){$('notice').textContent=message;$('notice').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('show'),4500);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){notify('Construído. Não foi possível salvar neste navegador.');}}
function project(x,y,z=0){return {x:ox+(x-y)*tile/2,y:oy+(x+y)*tile/4-z*tile/2};}
function unproject(x,y){const a=(x-ox)/(tile/2),b=(y-oy)/(tile/4);return {x:(a+b)/2,y:(b-a)/2};}
function inside(p){return p.x>=0&&p.y>=0&&p.x<Rules.size&&p.y<Rules.size;}
function clamp(p){return {x:Math.max(0,Math.min(Rules.size,p.x)),y:Math.max(0,Math.min(Rules.size,p.y))};}
function polygon(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function lot(x,y,fill,stroke){polygon([project(x,y),project(x+1,y),project(x+1,y+1),project(x,y+1)],fill,stroke);}
function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
function draw(){ctx.clearRect(0,0,width,height);ctx.fillStyle='#eef1eb';ctx.fillRect(0,0,width,height);const N=Rules.size;polygon([project(0,0),project(N,0),project(N,N),project(0,N)],'#fffefb','#cdd6c8');
if(selection){
 const q=Rules.quote(state,type,selection.a,selection.b),c=Rules.types[type].color;
 if(Math.hypot(selection.a.x-selection.b.x,selection.a.y-selection.b.y)>.15){
  const left=Math.min(selection.a.x,selection.b.x),top=Math.min(selection.a.y,selection.b.y),right=Math.max(selection.a.x,selection.b.x),bottom=Math.max(selection.a.y,selection.b.y);
  polygon([project(left,top),project(right,top),project(right,bottom),project(left,bottom)],c+'15',c+'88');
 }
 for(const p of q.cells)lot(p.x,p.y,c+'28',c+'88');
 for(const p of q.rejected)lot(p.x,p.y,'#ce6a6330','#c66c65');
}
const all=state.buildings.map(b=>({...b,ghost:false}));if(selection){const q=Rules.quote(state,type,selection.a,selection.b);for(const c of q.cells.slice(0,120))all.push({...c,type,variant:Math.abs(Math.round(c.x*700+c.y*1300))%3,ghost:true});}
all.sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);for(const b of all){const p=project(b.x+.5,b.y+.5),img=sprites[b.type]?.[b.variant];if(!img||p.x< -tile||p.x>width+tile||p.y< -tile||p.y>height+tile*1.4)continue;ctx.globalAlpha=b.ghost?.43:1;ctx.drawImage(img,p.x-tile/2,p.y-tile, tile,tile*1.3);}ctx.globalAlpha=1;}
function makeSprite(model,categoryColor){const xs=model.v.map(p=>p[0]),ys=model.v.map(p=>p[1]),zs=model.v.map(p=>p[2]),mx=(Math.max(...xs)+Math.min(...xs))/2,my=(Math.max(...ys)+Math.min(...ys))/2,mz=Math.min(...zs),scale=.88/Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));const v=model.v.map(p=>[(p[0]-mx)*scale,-(p[1]-my)*scale,(p[2]-mz)*scale]);const img=document.createElement('canvas');img.width=400;img.height=520;const c=img.getContext('2d');c.scale(2,2);
const faces=model.f.map(f=>{const p=f.slice(0,3).map(i=>v[i]);return {p,color:f[3],depth:p.reduce((n,p)=>n+p[0]+p[1]+p[2]*1.4,0)/3};}).sort((a,b)=>a.depth-b.depth);

// Keep flat category colors while separating the slab, roof and facade details.
const tint=categoryColor.match(/\w\w/g).map(v=>parseInt(v,16));
const darkDetails=new Set(['#40515a','#9ab7c2','#795641','#646b6d']);
const roofs=new Set(['#6c5445','#8a6550','#596064']);
for(const f of faces){
 const [a,b,d]=f.p,u=b.map((v,i)=>v-a[i]),w=d.map((v,i)=>v-a[i]);
 let n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
 // The reflected Y coordinate changes winding. Orient the two-sided face toward the camera.
 if(n[0]+n[1]+n[2]*1.4<0)n=n.map(v=>-v);
 const len=Math.hypot(...n)||1;
 const light=.48+.52*Math.max(0,(-n[0]*.6+n[1]*.35+n[2]*.72)/len);
 const slab=f.p.every(p=>p[2]<=.365*scale);
 let base=tint;
 if(slab)base=tint.map(v=>Math.round(210+v*.10));
 else if(darkDetails.has(f.color))base=tint.map(v=>v*.36+12);
 else if(roofs.has(f.color))base=tint.map(v=>v*.78);
 else if(f.color==='#e7e3d8')base=tint.map(v=>v*.65+255*.35);
 const rgb=base.map(v=>Math.max(0,Math.min(255,Math.round(v*light))));
 c.beginPath();f.p.forEach((p,i)=>{const x=100+(p[0]-p[1])*100,y=200+(p[0]+p[1])*50-p[2]*100;i?c.lineTo(x,y):c.moveTo(x,y);});
 c.closePath();c.fillStyle=`rgb(${rgb.join(',')})`;c.fill();
}
return img;}
function update(){const q=selection?Rules.quote(state,type,selection.a,selection.b):null;$('balance').textContent=short(state.money);$('balance').title=exact(state.money);$('count').textContent=state.buildings.length+' construções';$('quote').hidden=!selection;
if(q){$('summary').textContent=q.cells.length+' '+(type==='res'?'residências':type==='com'?'comércios':'indústrias');$('total').textContent=short(q.total);$('total').title=exact(q.total);$('breakdown').textContent=`Construções ${exact(q.base)} + terreno (${Rules.types[type].tax*100}%) ${exact(q.tax)}. `+(q.blocked?`${q.blocked} posição(ões) com sobreposição ignorada(s). `:'')+(q.total>state.money?'Saldo insuficiente: selecione uma área menor.':!q.cells.length?'Sem espaço livre para construir aqui.':`Saldo após construir: ${short(state.money-q.total)}.`);$('breakdown').classList.toggle('error',q.total>state.money||!q.cells.length);$('confirm').disabled=!ready||!q.cells.length||q.total>state.money;$('confirm').textContent='Construir · '+short(q.total);}
$('hint').textContent=panMode?'Arraste para mover · pinça para aproximar':'Toque para posicionar · arraste para preencher uma área';schedule();}
function center(){ox=width/2;oy=height*.43-Rules.size*tile/4;schedule();}
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);center();}
function zoom(f,x=width/2,y=height*.45){const old=tile;tile=Math.max(24,Math.min(160,tile*f));ox=x-(x-ox)*tile/old;oy=y-(y-oy)*tile/old;schedule();}
for(const b of document.querySelectorAll('.category'))b.onclick=()=>{type=b.dataset.type;panMode=false;selection=null;for(const other of document.querySelectorAll('.category'))other.setAttribute('aria-pressed',String(other===b));$('pan').classList.remove('active');$('pan').setAttribute('aria-pressed','false');update();};
$('pan').onclick=()=>{panMode=!panMode;selection=null;$('pan').classList.toggle('active',panMode);$('pan').setAttribute('aria-pressed',String(panMode));update();};$('plus').onclick=()=>zoom(1.2);$('minus').onclick=()=>zoom(1/1.2);$('center').onclick=center;$('cancel').onclick=()=>{selection=null;update();};$('confirm').onclick=()=>{if(!ready||!selection)return;const q=Rules.build(state,type,selection.a,selection.b);if(!q){update();return;}selection=null;save();notify(`${q.cells.length} construção(ões) adicionada(s). Custo: ${exact(q.total)}.`);update();};
const fingers=new Map();let gesture=false;
canvas.addEventListener('pointerdown',e=>{if(!ready)return;canvas.setPointerCapture(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size>1){gesture=true;selection=null;update();return;}gesture=false;if(!panMode){const p=unproject(e.clientX,e.clientY);selection=inside(p)?{a:p,b:p}:null;update();}});
canvas.addEventListener('pointermove',e=>{if(!fingers.has(e.pointerId))return;const previous=fingers.get(e.pointerId),before=[...fingers.values()];fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});const after=[...fingers.values()];if(after.length===2){const dist=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),mid=p=>({x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2}),a=mid(before),b=mid(after);if(dist(before)>0)zoom(dist(after)/dist(before),a.x,a.y);ox+=b.x-a.x;oy+=b.y-a.y;schedule();return;}if(gesture)return;if(panMode){ox+=e.clientX-previous.x;oy+=e.clientY-previous.y;schedule();}else if(selection){selection.b=clamp(unproject(e.clientX,e.clientY));update();}});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,e=>{fingers.delete(e.pointerId);if(name==='pointercancel'){selection=null;update();}if(!fingers.size)gesture=false;});canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.001),e.clientX,e.clientY);},{passive:false});window.addEventListener('resize',resize);window.addEventListener('keydown',e=>{if(e.key==='Escape'){selection=null;update();}});resize();
fetch('models.json').then(r=>{if(!r.ok)throw Error('Modelos indisponíveis');return r.json();}).then(data=>{models=data;for(const [key,t] of Object.entries(Rules.types)){const names=Object.keys(models).filter(n=>n.startsWith(t.prefix)).sort();if(names.length!==3)throw Error('Categoria incompleta');sprites[key]=names.map(n=>makeSprite(models[n],t.color));}ready=true;document.querySelectorAll('.category').forEach(b=>b.disabled=false);update();}).catch(e=>{$('hint').textContent='Não foi possível carregar os modelos. Atualize a página para tentar novamente.';notify(e.message);});
