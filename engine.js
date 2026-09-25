'use strict';
const Rules=(()=>{
const size=32,types={res:{label:'Residência',price:5000,tax:.015,prefix:'casa_',color:'#59b877'},com:{label:'Comércio',price:8000,tax:.025,prefix:'comercio_',color:'#529fe0'},ind:{label:'Indústria',price:12000,tax:.04,prefix:'industrial_',color:'#ee9345'}};

const footprint=.94,spacing=1.04,epsilon=1e-8;
const fresh=()=>({version:3,money:100000,buildings:[],roads:[],parks:[],upkeepPaid:0,upkeepDebt:0,clock:{month:0,elapsed:0,speed:1}});
const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const extent=b=>footprint/2*(Math.abs(Math.cos(b.angle||0))+Math.abs(Math.sin(b.angle||0)));
const overlaps=(a,b)=>Math.abs(a.x-b.x)<extent(a)+extent(b)-epsilon&&Math.abs(a.y-b.y)<extent(a)+extent(b)-epsilon;
const inBounds=p=>validPoint(p)&&p.x+.5-extent(p)>=0&&p.y+.5-extent(p)>=0&&p.x+.5+extent(p)<=size&&p.y+.5+extent(p)<=size;
function quote(state,type,a,b,align=false){
 const result={cells:[],rejected:[],blocked:0,base:0,tax:0,total:0};
 if(!types[type]||!validPoint(a)||!validPoint(b))return result;
 // Selection endpoints are continuous world positions, representing building centers.
 // Only the relative packing interval is fixed; there is no world grid or snapping.
 const left=Math.max(.5,Math.min(a.x,b.x)),top=Math.max(.5,Math.min(a.y,b.y));
 const right=Math.min(size-.5,Math.max(a.x,b.x)),bottom=Math.min(size-.5,Math.max(a.y,b.y));
 if(left>right||top>bottom)return result;
 const cols=Math.floor((right-left+epsilon)/spacing)+1,rows=Math.floor((bottom-top+epsilon)/spacing)+1;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  let p={x:left+i*spacing-.5,y:top+j*spacing-.5};if(align)p=alignToRoad(state,p);
  if(!inBounds(p)||state.buildings.some(o=>overlaps(o,p))||result.cells.some(o=>overlaps(o,p))||infrastructureBlocks(state,p)){result.blocked++;result.rejected.push(p);}
  else result.cells.push(p);
 }
 result.base=result.cells.length*types[type].price;result.tax=Math.round(result.base*types[type].tax);result.total=result.base+result.tax;return result;
}
function build(state,type,a,b,rng=Math.random,align=false){const q=quote(state,type,a,b,align);if(!q.cells.length||q.total>state.money)return false;
 const additions=q.cells.map(c=>({...c,type,variant:Math.min(2,Math.max(0,Math.floor(rng()*3)))}));
 state.money-=q.total;state.buildings.push(...additions);state.version=3;return q;
}
function restore(data){
 if(!data||![1,2,3].includes(data.version)||!Number.isInteger(data.money)||data.money<0||data.money>100000||!Array.isArray(data.buildings)||data.buildings.length>size*size)return null;
 let spent=0;const checked=[];
 for(const b of data.buildings){
  if(!types[b.type]||!inBounds(b)||!Number.isInteger(b.variant)||b.variant<0||b.variant>2||!Number.isFinite(b.angle||0)||checked.some(o=>overlaps(o,b)))return null;
  checked.push({x:b.x,y:b.y,type:b.type,variant:b.variant,angle:b.angle||0});spent+=types[b.type].price*(1+types[b.type].tax);
 }
 const restored={version:3,money:data.money,buildings:checked,roads:[],parks:[],upkeepPaid:data.upkeepPaid||0,upkeepDebt:data.upkeepDebt||0,clock:normalizeClock(data.clock)};
 if(!Number.isSafeInteger(restored.upkeepPaid)||restored.upkeepPaid<0||!Number.isSafeInteger(restored.upkeepDebt)||restored.upkeepDebt<0)return null;
 const roads=data.roads||[],parks=data.parks||[];if(!Array.isArray(roads)||!Array.isArray(parks)||roads.length+parks.length>1000)return null;
 for(const item of [...roads,...parks]){if(!item||!['road','avenue','park'].includes(item.type))return null;const q=quoteInfra(restored,item.type,item.points,true);if(q.error||q.total!==item.cost)return null;const clean={id:'i'+(restored.roads.length+restored.parks.length+1),type:item.type,points:q.points,width:q.width,cost:q.total,maintenance:q.maintenance};if(item.type==='park')restored.parks.push(clean);else restored.roads.push(clean);spent+=q.total;}
 if(Math.round(spent)+restored.upkeepPaid+data.money!==100000)return null;return restored;
}

const MONTH_MS=60000;
function normalizeClock(c){return {month:Number.isSafeInteger(c?.month)&&c.month>=0?c.month:0,elapsed:Number.isFinite(c?.elapsed)&&c.elapsed>=0&&c.elapsed<MONTH_MS?c.elapsed:0,speed:[0,1,2,4].includes(c?.speed)?c.speed:1};}
function advanceClock(state,realMs){state.clock=normalizeClock(state.clock);if(!Number.isFinite(realMs)||realMs<0)return 0;const total=state.clock.elapsed+realMs*state.clock.speed,months=Math.floor(total/MONTH_MS);state.clock.month+=months;state.clock.elapsed=total%MONTH_MS;if(months)chargeMaintenance(state,months);return months;}

const infraTypes={road:{label:'Rua',width:.55,rate:350},avenue:{label:'Avenida',width:1,rate:650},park:{label:'Parque',rate:450}};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function nearest(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return {x:a.x+dx*t,y:a.y+dy*t,t};}
function cross(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function intersects(a,b,c,d){const ab1=cross(a,b,c),ab2=cross(a,b,d),cd1=cross(c,d,a),cd2=cross(c,d,b);if(ab1*ab2<0&&cd1*cd2<0)return true;return [distance(a,nearest(a,c,d)),distance(b,nearest(b,c,d)),distance(c,nearest(c,a,b)),distance(d,nearest(d,a,b))].some(v=>v<1e-7);}
function segmentDistance(a,b,c,d){if(intersects(a,b,c,d))return 0;return Math.min(distance(a,nearest(a,c,d)),distance(b,nearest(b,c,d)),distance(c,nearest(c,a,b)),distance(d,nearest(d,a,b)));}
function contains(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>p.y)!==(b.y>p.y))&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
const edges=poly=>poly.map((p,i)=>[p,poly[(i+1)%poly.length]]);
function polygonsOverlap(a,b){return a.some(p=>contains(p,b))||b.some(p=>contains(p,a))||edges(a).some(e=>edges(b).some(f=>intersects(...e,...f)));}
function boxFor(b){const h=extent(b),x=b.x+.5,y=b.y+.5;return [{x:x-h,y:y-h},{x:x+h,y:y-h},{x:x+h,y:y+h},{x:x-h,y:y+h}];}
function roadHitsPoly(road,poly){for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i];if(contains(a,poly)||contains(b,poly)||edges(poly).some(e=>segmentDistance(a,b,...e)<road.width/2+.025))return true;}return false;}
function infrastructureBlocks(state,b){const box=boxFor(b);return (state.roads||[]).some(r=>roadHitsPoly(r,box))||(state.parks||[]).some(p=>polygonsOverlap(box,p.points));}
function smooth(raw,closed=false){let pts=[];for(const p of raw){if(validPoint(p)&&(!pts.length||distance(p,pts[pts.length-1])>.12))pts.push({x:p.x,y:p.y});if(pts.length>=160)break;}if(closed&&pts.length>2&&distance(pts[0],pts.at(-1))<.15)pts.pop();for(let round=0;round<2;round++){if(pts.length<3)break;const next=closed?[]:[pts[0]];for(let i=0;i<(closed?pts.length:pts.length-1);i++){const a=pts[i],b=pts[(i+1)%pts.length];next.push({x:.75*a.x+.25*b.x,y:.75*a.y+.25*b.y},{x:.25*a.x+.75*b.x,y:.25*a.y+.75*b.y});}if(!closed)next.push(pts.at(-1));pts=next;}return pts;}
const pathLength=pts=>pts.slice(1).reduce((v,p,i)=>v+distance(p,pts[i]),0);
const area=pts=>Math.abs(pts.reduce((v,p,i)=>{const q=pts[(i+1)%pts.length];return v+p.x*q.y-q.x*p.y;},0))/2;
function roadConnections(road,roads){return roads.filter(r=>road.points.slice(1).some((b,i)=>r.points.slice(1).some((d,j)=>segmentDistance(road.points[i],b,r.points[j],d)<(road.width+r.width)/2+.01))).map(r=>r.id);}
function snapEndpoint(p,roads){let best=null,min=.55;for(const r of roads)for(let i=1;i<r.points.length;i++){const q=nearest(p,r.points[i-1],r.points[i]),d=distance(p,q);if(d<min){min=d;best=q;}}return best?{x:best.x,y:best.y}:p;}
function quoteInfra(state,type,raw,prepared=false){const spec=infraTypes[type],q={type,points:[],total:0,maintenance:0,error:'',connections:[]};if(!spec||!Array.isArray(raw))return {...q,error:'Traçado inválido.'};q.points=prepared?raw.map(p=>({x:p.x,y:p.y})):smooth(raw,type==='park');
if(q.points.length<(type==='park'?3:2))return {...q,error:type==='park'?'Desenhe o contorno de uma área.':'Arraste para desenhar uma rua.'};
if(type!=='park'&&!prepared){q.points[0]=snapEndpoint(q.points[0],state.roads||[]);q.points[q.points.length-1]=snapEndpoint(q.points.at(-1),state.roads||[]);}
if(q.points.length>650||q.points.some(p=>!validPoint(p)))return {...q,error:'Traçado inválido.'};
q.width=spec.width||0;const margin=q.width/2;
if(q.points.some(p=>p.x<margin||p.y<margin||p.x>size-margin||p.y>size-margin))q.error='O traçado precisa ficar dentro do terreno.';
if(type==='park'){
 q.area=area(q.points);q.total=Math.ceil(q.area*spec.rate);q.maintenance=Math.ceil(q.area*12);
 if(q.area<.35)q.error='Desenhe um parque maior.';
 const es=edges(q.points);for(let i=0;i<es.length;i++)for(let j=i+2;j<es.length;j++)if(!(i===0&&j===es.length-1)&&intersects(...es[i],...es[j]))q.error='O contorno do parque não pode cruzar a si mesmo.';
 if(state.buildings.some(b=>polygonsOverlap(boxFor(b),q.points))||(state.roads||[]).some(r=>roadHitsPoly(r,q.points))||(state.parks||[]).some(p=>polygonsOverlap(p.points,q.points)))q.error='O parque cruza uma construção, rua ou outro parque.';
}else{
 q.length=pathLength(q.points);q.total=Math.ceil(q.length*spec.rate);
 if(q.length<.4)q.error='Desenhe um trecho maior.';
 if(state.buildings.some(b=>roadHitsPoly(q,boxFor(b)))||(state.parks||[]).some(p=>roadHitsPoly(q,p.points)))q.error='A via cruza uma construção ou parque.';
 q.connections=roadConnections(q,state.roads||[]);
}
return q;}
function buildInfra(state,type,raw){const q=quoteInfra(state,type,raw);if(q.error||q.total>state.money)return false;state.roads||=[];state.parks||=[];const item={id:'i'+(state.roads.length+state.parks.length+1),type,points:q.points,width:q.width,cost:q.total,maintenance:q.maintenance};state.money-=q.total;if(type==='park')state.parks.push(item);else state.roads.push(item);state.version=3;return q;}
function alignToRoad(state,p){let best=null,min=2.5;const center={x:p.x+.5,y:p.y+.5};for(const r of state.roads||[])for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],q=nearest(center,a,b),d=distance(center,q);if(d<min&&distance(a,b)>.0001){min=d;best={r,a,b,q};}}if(!best)return p;const {r,a,b,q}=best,len=distance(a,b);let nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;if((center.x-q.x)*nx+(center.y-q.y)*ny<0){nx=-nx;ny=-ny;}const angle=Math.round(Math.atan2(nx,-ny)/(Math.PI/12))*(Math.PI/12),h=extent({angle}),offset=r.width/2+h*(Math.abs(nx)+Math.abs(ny))+.14;return {x:q.x+nx*offset-.5,y:q.y+ny*offset-.5,angle};}
function chargeMaintenance(state,months){const due=(state.parks||[]).reduce((n,p)=>n+p.maintenance,0)*months,paid=Math.min(state.money,due);state.money-=paid;state.upkeepPaid=(state.upkeepPaid||0)+paid;state.upkeepDebt=(state.upkeepDebt||0)+due-paid;return {due,paid};}

return {extent,infraTypes,quoteInfra,buildInfra,roadConnections,contains,alignToRoad,chargeMaintenance,MONTH_MS,normalizeClock,advanceClock,size,types,footprint,spacing,fresh,quote,build,restore,overlaps};})();
if(typeof module!=='undefined')module.exports=Rules;
