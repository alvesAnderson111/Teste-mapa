'use strict';
const Rules=(()=>{
const size=32,types={res:{label:'Residência',price:5000,tax:.015,prefix:'casa_',color:'#529b78'},com:{label:'Comércio',price:8000,tax:.025,prefix:'comercio_',color:'#538dbc'},ind:{label:'Indústria',price:12000,tax:.04,prefix:'industrial_',color:'#bb9452'}};
const fresh=()=>({version:1,money:100000,buildings:[]});
function quote(state,type,a,b){if(!types[type]||!a||!b)return {cells:[],blocked:0,base:0,tax:0,total:0};const occupied=new Set(state.buildings.map(o=>`${o.x},${o.y}`)),cells=[];let blocked=0;
for(let y=Math.max(0,Math.min(a.y,b.y));y<=Math.min(size-1,Math.max(a.y,b.y));y++)for(let x=Math.max(0,Math.min(a.x,b.x));x<=Math.min(size-1,Math.max(a.x,b.x));x++){if(occupied.has(`${x},${y}`))blocked++;else cells.push({x,y});}
const base=cells.length*types[type].price,tax=Math.round(base*types[type].tax);return {cells,blocked,base,tax,total:base+tax};}
function build(state,type,a,b,rng=Math.random){const q=quote(state,type,a,b);if(!q.cells.length||q.total>state.money)return false;const variants=q.cells.map(c=>({...c,type,variant:Math.min(2,Math.floor(rng()*3))}));state.money-=q.total;state.buildings.push(...variants);return q;}
function restore(data){if(!data||data.version!==1||!Number.isInteger(data.money)||data.money<0||data.money>100000||!Array.isArray(data.buildings)||data.buildings.length>size*size)return null;const used=new Set();let spent=0;
for(const b of data.buildings){if(!types[b.type]||![b.x,b.y,b.variant].every(Number.isInteger)||b.x<0||b.x>=size||b.y<0||b.y>=size||b.variant<0||b.variant>2||used.has(`${b.x},${b.y}`))return null;used.add(`${b.x},${b.y}`);spent+=types[b.type].price*(1+types[b.type].tax);}if(Math.round(spent)+data.money!==100000)return null;return data;}
return {size,types,fresh,quote,build,restore};})();
if(typeof module!=='undefined')module.exports=Rules;
