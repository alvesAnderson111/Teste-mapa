'use strict';
const Rules=(()=>{
const size=32,types={res:{label:'Residência',price:5000,tax:.015,prefix:'casa_',color:'#59b877'},com:{label:'Comércio',price:8000,tax:.025,prefix:'comercio_',color:'#529fe0'},ind:{label:'Indústria',price:12000,tax:.04,prefix:'industrial_',color:'#ee9345'}};

const footprint=.94,spacing=1.04,epsilon=1e-8;
const fresh=()=>({version:2,money:100000,buildings:[]});
const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const overlaps=(a,b)=>Math.abs(a.x-b.x)<footprint-epsilon&&Math.abs(a.y-b.y)<footprint-epsilon;
const inBounds=p=>validPoint(p)&&p.x>=0&&p.y>=0&&p.x<=size-1&&p.y<=size-1;
function quote(state,type,a,b){
 const result={cells:[],rejected:[],blocked:0,base:0,tax:0,total:0};
 if(!types[type]||!validPoint(a)||!validPoint(b))return result;
 // Selection endpoints are continuous world positions, representing building centers.
 // Only the relative packing interval is fixed; there is no world grid or snapping.
 const left=Math.max(.5,Math.min(a.x,b.x)),top=Math.max(.5,Math.min(a.y,b.y));
 const right=Math.min(size-.5,Math.max(a.x,b.x)),bottom=Math.min(size-.5,Math.max(a.y,b.y));
 if(left>right||top>bottom)return result;
 const cols=Math.floor((right-left+epsilon)/spacing)+1,rows=Math.floor((bottom-top+epsilon)/spacing)+1;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const p={x:left+i*spacing-.5,y:top+j*spacing-.5};
  if(state.buildings.some(o=>overlaps(o,p))){result.blocked++;result.rejected.push(p);}
  else result.cells.push(p);
 }
 result.base=result.cells.length*types[type].price;result.tax=Math.round(result.base*types[type].tax);result.total=result.base+result.tax;return result;
}
function build(state,type,a,b,rng=Math.random){const q=quote(state,type,a,b);if(!q.cells.length||q.total>state.money)return false;
 const additions=q.cells.map(c=>({...c,type,variant:Math.min(2,Math.max(0,Math.floor(rng()*3)))}));
 state.money-=q.total;state.buildings.push(...additions);state.version=2;return q;
}
function restore(data){
 if(!data||![1,2].includes(data.version)||!Number.isInteger(data.money)||data.money<0||data.money>100000||!Array.isArray(data.buildings)||data.buildings.length>size*size)return null;
 let spent=0;const checked=[];
 for(const b of data.buildings){
  if(!types[b.type]||!inBounds(b)||!Number.isInteger(b.variant)||b.variant<0||b.variant>2||(data.version===1&&(!Number.isInteger(b.x)||!Number.isInteger(b.y)))||checked.some(o=>overlaps(o,b)))return null;
  checked.push({x:b.x,y:b.y,type:b.type,variant:b.variant});spent+=types[b.type].price*(1+types[b.type].tax);
 }
 if(Math.round(spent)+data.money!==100000)return null;
 return {version:2,money:data.money,buildings:checked};
}
return {size,types,footprint,spacing,fresh,quote,build,restore,overlaps};})();
if(typeof module!=='undefined')module.exports=Rules;
