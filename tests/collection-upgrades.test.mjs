import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine/upstream.js';
import {craftingJobs,craftingMaterials} from '../src/engine/crafting-model.js';
import {collectionDefaults,collectionRoutes,collectionPlayers,estimateCollection,collectionRows,gatheringCollectionRows} from '../src/engine/collection-model.js';
import {validateCollectionSelection} from '../src/engine/collection-plan.js';
import {defaults,putLine,ordersForMode,estimateOrders,collectionActions,workspaceForStorage,validateUserWorkspace,applyUserWorkspace,removeCompleted} from '../src/workspace.js';
import {createPriceSnapshot} from '../src/engine/price-protocol.js';
import {hasAvailableAsks,hasInventoryMaterials} from '../src/recipe-availability.js';

const upgrades=craftingJobs.filter(job=>job.upgrade);
const character=()=>{const state=collectionDefaults();Object.assign(state,{initialized:true,worldTick:1000000,bank:{},pack:{}});for(const key in state.config.levels)state.config.levels[key]=110;return state;};
const plan=w=>estimateOrders({...w,orders:ordersForMode(w,'collection')},createPriceSnapshot(w.prices));

test('all 27 upgrade recipes support every collection quality with deterministic output, inputs and native time',()=>{
 assert.equal(upgrades.length,27);
 assert.deepEqual([95,99,105].map(level=>upgrades.filter(job=>job.levelReq===level).length),[3,14,10]);
 const state=character(),players=collectionPlayers(state);
 for(const job of upgrades)for(let tier=0;tier<5;tier++){
  const id=game.withRarity(job.output.itemId,tier);state.counts[id]=9;
  assert.ok(collectionRoutes(id).includes(job));
  const row=estimateCollection(state,id,job,players,100);
  assert.equal(row.status,'ok');assert.equal(row.attempts,91);assert.equal(row.quantity,91);
  const expectedSeconds=91*game.upgradeTicks(players.craft,job.upgrade)*game.tickMs/1000;
  assert.ok(Math.abs(row.seconds-expectedSeconds)<=Number.EPSILON*expectedSeconds*2);
  assert.deepEqual(row.materials,craftingMaterials(job,tier,91));
  assert.equal(row.points,game.collectionPoints(100,tier,job.output.itemId)-game.collectionPoints(9,tier,job.output.itemId));
  assert.equal(row.burn,0);assert.equal(row.caught,0);assert.equal(row.quality,1);
 }
 const rows=collectionRows(state,players);
 for(const job of upgrades)assert.ok(rows.some(row=>row.jobId===job.id&&row.status==='ok'));
 assert.ok(gatheringCollectionRows(state,rows,players).every(row=>typeof row.jobId==='number'));
});

test('upgrade collection handles waiting, level requirements, completion and invalid source IDs explicitly',()=>{
 const state=character(),job=upgrades.find(job=>job.levelReq===99),id=job.output.itemId;
 state.initialized=false;assert.equal(estimateCollection(state,id,job).status,'uninitialized');
 state.initialized=true;state.config.levels[job.skill]=98;assert.equal(estimateCollection(state,id,job).status,'levelTooLow');
 state.config.levels[job.skill]=99;assert.equal(estimateCollection(state,id,job).status,'ok');
 state.counts[id]=10;assert.equal(estimateCollection(state,id,job,undefined,10).status,'complete');
 const line={itemId:id,jobId:job.id,target:100};assert.deepEqual(validateCollectionSelection(line),line);
 for(const jobId of [job.upgrade.id,String(job.upgrade.id),'upgrade-999999',null,{},'41',upgrades.find(other=>other!==job).id])assert.throws(()=>validateCollectionSelection({...line,jobId}),/invalidPlan/);
});

test('upgrade collection procurement, supply filters, editable actions and version 2 storage agree',()=>{
 const w=defaults();w.character=character();w.selectedMode='collection';
 const job=upgrades.find(job=>job.levelReq===99),tier=3,id=game.withRarity(job.output.itemId,tier),source=game.withRarity(job.upgrade.from[0],tier);
 const line={kind:'collection',itemId:id,jobId:job.id,target:100};w.character.counts[id]=90;putLine(w.collectionOrder,line);
 const materials=craftingMaterials(job,tier,10);
 for(const input of Object.keys(materials))w.prices.quotes[input]={ask:{value:5,capturedAt:Date.now(),quantity:materials[input]}};
 w.character.bank={[source]:3};w.character.pack={[source]:2};
 const p=plan(w);assert.equal(p.blocked,0);assert.equal(p.collectionSeconds,estimateCollection(w.character,id,job,undefined,100).seconds);
 for(const [input,qty]of Object.entries(materials)){const row=p.rows.find(row=>row.id===Number(input));assert.equal(row.required,qty);assert.equal(row.purchase,qty-(Number(input)===source?5:0));}
 assert.deepEqual(p.entries[0].products,{[id]:10});assert.equal(p.points,game.collectionPoints(100,tier,job.output.itemId)-game.collectionPoints(90,tier,job.output.itemId));
 const action=collectionActions(p)[0];assert.equal(action.jobId,job.id);assert.equal(action.count,10);assert.deepEqual(action.issues,[]);
 assert.equal(hasInventoryMaterials(materials,w.character),false);assert.equal(hasInventoryMaterials(materials,{bank:materials,pack:{}}),true);
 assert.equal(hasAvailableAsks(materials,{getItem:input=>({sellPrice:5,sellQuantity:materials[input]})}),true);
 assert.equal(hasAvailableAsks(materials,{getItem:input=>({sellPrice:5,sellQuantity:materials[input]-1})}),false);
 const saved=workspaceForStorage(w),before=structuredClone(saved),loaded=validateUserWorkspace(saved);
 assert.equal(saved.version,2);assert.deepEqual(saved,before);assert.deepEqual(loaded.collectionOrder.lines,[line]);
 const restored=applyUserWorkspace({...defaults(),character:w.character},loaded);assert.deepEqual(plan(restored).entries,p.entries);
 const bad=structuredClone(saved);bad.collectionOrder.lines[0].jobId=job.upgrade.id;assert.throws(()=>validateUserWorkspace(bad),/invalidPlan/);assert.deepEqual(saved,before);
 w.character.bankLocked=[source];assert.equal(plan(w).rows.find(row=>row.id===source).purchase,10);
 w.character.counts[id]=100;assert.equal(collectionActions(plan(w))[0].count,0);w.autoRemove=true;assert.equal(removeCompleted(w),true);assert.deepEqual(w.collectionOrder.lines,[]);
});
