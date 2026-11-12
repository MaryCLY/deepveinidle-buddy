import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine/upstream.js';
import {craftingJobs,craftingMaterials,craftingDefaults,craftingPlayer,importCrafting} from '../src/engine/crafting-model.js';
import {gatheringDefaults,gatheringPlayer,importGathering} from '../src/engine/gathering-model.js';
import {collectionDefaults,importCollection,collectionPlayers} from '../src/engine/collection-model.js';
import {copyCharacter} from '../src/capture.js';
import {playerFixture} from './fixtures/player.js';

const snapshot=player=>({version:2,capturedAt:Date.now(),player,worldTick:player.lastTick,worldBuffs:[],worldBuffsVersion:1});
test('all ten level-105 tool upgrades preserve rarity and enhancement and require boss materials',()=>{
 const upgrades=craftingJobs.filter(job=>job.upgrade&&job.levelReq===105);
 assert.deepEqual(upgrades.map(job=>job.upgrade.to[0]),[698,699,572,573,575,576,711,712,718,719]);
 for(const job of upgrades){
  assert.equal(job.levelReq,105);assert.equal(game.tool(job.output.itemId).bonus,.65);
  for(let tier=0;tier<5;tier++){
   const from=game.withRarity(job.upgrade.from[0],tier),to=game.withRarity(job.output.itemId,tier);
   for(const plus of [0,1,10,20])assert.equal(game.upgradeResult(job.upgrade,game.encode(from,plus)),game.encode(to,plus));
   assert.deepEqual(craftingMaterials(job,tier,2),{[from]:2,[job.upgrade.extra[0].itemId]:2});
   assert.ok(game.item(to));assert.equal(game.recipeLevel(job.output.itemId),85);
   assert.equal(game.marketFamily(job.output.itemId),'tools');
  }
 }
});
test('skill offhands import rarity and enhancement and only accelerate matching ordinary work',()=>{
 const source=playerFixture();source.skills.mining=game.levelXp(85);source.skills.smithing=game.levelXp(85);
 const mining=game.recipes.find(job=>job.id===8),smithing=game.recipes.find(job=>job.output.itemId===44);
 const baseGather=gatheringPlayer(gatheringDefaults()).player,baseCraft=craftingPlayer(craftingDefaults()).player;
 for(const [skill,id,job,base,importer,defaults] of [
  ['mining',720,mining,baseGather,importGathering,gatheringDefaults],
  ['smithing',721,smithing,baseCraft,importCrafting,craftingDefaults],
 ]){
  base.skills[skill]=source.skills[skill];
  source.equipment.shield=game.encode(game.withRarity(id,3),10);
  const captured=copyCharacter(source);
  assert.equal(captured.equipment.shield,source.equipment.shield);
  const imported=importer(defaults(),snapshot(captured));assert.deepEqual(imported.warnings,[]);
  assert.deepEqual(imported.state.gear.shield,{id,tier:3,plus:10});
  const state=importCollection(collectionDefaults(),snapshot(captured)),players=collectionPlayers(state),player=skill==='mining'?players.gather:players.craft;
  const lift=game.gear(source.equipment.shield).offhand.lift;
  assert.ok(lift>.03);assert.equal(game.workChance(job,player),Math.min(1,game.workChance(job,base)*(1+lift)));
  const other=structuredClone(player);other.equipment.shield=game.withRarity(skill==='mining'?721:720,3);
  assert.equal(game.workChance(job,other),game.workChance(job,base));
 }
});
test('ordinary combat shields stay valid character data without adding a work bonus',()=>{
 const player=playerFixture();player.equipment.shield=115;
 const state=importCollection(collectionDefaults(),snapshot(copyCharacter(player)));
 assert.deepEqual(state.config.gear.shield,{id:115,tier:0,plus:0});
 const baseline=collectionPlayers(collectionDefaults()),actual=collectionPlayers(state),job=game.recipes.find(job=>job.id===8);
 assert.equal(game.workChance(job,actual.gather),game.workChance(job,baseline.gather));
});
