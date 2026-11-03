import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine/upstream.js';
import {collectionDefaults,collectionRows,collectionPlayers,estimateCollection,gatheringCollectionRows} from '../src/engine/collection-model.js';
import {plannedProducts} from '../src/planned-products.js';
const setup=()=>({...collectionDefaults(),initialized:true,worldTick:1000000});
test('gathering horizons include all rarity gains without adding action counts or changing time',()=>{
 const state=setup(),job=game.recipes.find(job=>job.id===1),players=collectionPlayers(state);
 const target=estimateCollection(state,4001,job,players,1),[row]=gatheringCollectionRows(state,[target],players);
 assert.equal(row.attempts,target.attempts);assert.equal(row.seconds,target.seconds);
 const products=plannedProducts(job,0,Math.ceil(row.attempts),players);
 assert.equal(row.details.length,5);
 for(const detail of row.details){
  assert.ok(Math.abs(detail.quantity-products[detail.id]*row.attempts/Math.ceil(row.attempts))<1e-8);
  assert.equal(detail.points,game.collectionPoints(detail.current+detail.quantity,detail.tier,1)-game.collectionPoints(detail.current,detail.tier,1));
 }
 assert.equal(row.details[4].quantity,1);
 assert.equal(row.points,row.details.reduce((sum,detail)=>sum+detail.points,0));assert.ok(row.points>target.points);
 assert.equal(row.secondsPerPoint,row.seconds/row.points);
});
test('equal horizons merge only within a source and all other horizons remain',()=>{
 const state=setup();state.config.levels.mining=100;
 const raw=collectionRows(state),gather=raw.filter(row=>row.status==='ok'&&['mining','fishing','woodcutting','thieving'].includes(row.skill)),rows=gatheringCollectionRows(state,raw);
 assert.equal(rows.length,new Set(gather.map(row=>`${row.jobId}:${row.attempts}`)).size);
 const duplicated=gatheringCollectionRows(state,[gather[0],{...gather[0]}]);assert.equal(duplicated.length,1);
 for(const source of [5,344])assert.ok(rows.some(row=>row.jobId===source));
 for(const row of gather)assert.ok(rows.some(result=>result.jobId===row.jobId&&result.attempts===row.attempts));
});
test('completed and zero-output rarities retain details without awarding points; pure coal stays plain',()=>{
 const state=setup();state.config.levels.mining=100;state.counts[1005]=game.collectionThresholds(5).at(-1);
 const job=game.recipes.find(job=>job.id===344),target=estimateCollection(state,5,job,collectionPlayers(state),100),[row]=gatheringCollectionRows(state,[target]);
 assert.equal(row.details.length,5);assert.equal(row.details[0].quantity,100);
 for(const detail of row.details.slice(1)){assert.equal(detail.quantity,0);assert.equal(detail.points,0);}
 assert.equal(row.details[1].complete,true);assert.equal(row.details[1].target,null);
 assert.equal(row.points,target.points);
});
test('fractional action counts remain fractional and blocked/craft rows never become gathering schemes',()=>{
 const state=setup(),raw=collectionRows(state),source=raw.find(row=>row.status==='ok'&&row.skill==='mining'&&!Number.isInteger(row.attempts));
 const [row]=gatheringCollectionRows(state,[source]);assert.equal(row.attempts,source.attempts);
 assert.deepEqual(gatheringCollectionRows(state,raw.filter(row=>row.status!=='ok'||row.skill==='smithing')),[]);
 assert.deepEqual(gatheringCollectionRows(collectionDefaults()),[]);
});
test('overflow in shared output fails explicitly',()=>{
 const state=setup(),source=estimateCollection(state,4001,game.recipes.find(job=>job.id===1));
 assert.throws(()=>gatheringCollectionRows(state,[{...source,quantity:Number.MAX_SAFE_INTEGER}]),/quantityOverflow/);
});
