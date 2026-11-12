import test from 'node:test';
import assert from 'node:assert/strict';
import {copyCharacter} from '../src/capture.js';
import {resolveSkillMasteries,validateSkillMasteries,effectiveSkillMasteries} from '../src/engine/skill-masteries.js';

const pages=()=>({
 masteries:{gather:104,rare:105},masteryPage:1,
 masterySkills:{smithing:2,mining:1,fishing:3},masteryAway:{2:{craft:106}},
});

test('each working skill selects a whole page; missing bindings and unowned pages use current ranks',()=>{
 const player=pages();
 const expected={
  cooking:{craft:0},smithing:{craft:106},fletching:{craft:0},herblore:{craft:0},crafting:{craft:0},
  mining:{gather:104,rare:105},fishing:{gather:104,rare:105},woodcutting:{gather:104,rare:105},thieving:{gather:104,rare:105},
 };
 assert.deepEqual(resolveSkillMasteries(player),expected);
 for(const away of [{},{craft:200}]){
  player.masteryAway[3]=away;
  assert.deepEqual(resolveSkillMasteries(player).fishing,{gather:0,rare:0});
 }
 assert.equal(resolveSkillMasteries({masteries:{}}),null);
});

test('rejects damaged inputs before using a partially valid page or a legacy fallback',()=>{
 const bad=[
  {},{masteries:null},{masteries:[]},{masteries:{rare:null}},
  {...pages(),masteryPage:0},{...pages(),masterySkills:null},{...pages(),masteryAway:[]},
  {...pages(),masterySkills:{mining:'2'}},{...pages(),masterySkills:{mining:4}},
  {...pages(),masteries:{craft:201}},{...pages(),masteryAway:{3:null}},
  {...pages(),masteryAway:{3:{craft:1.5}}},{...pages(),masteryAway:{2:{gather:-1}}},
  {...pages(),masteryAway:{other:{}}},{...pages(),masteryAway:{'02':{}}},
 ];
 for(const key of ['masteryPage','masterySkills','masteryAway']){
  const player=pages();delete player[key];bad.push(player);
 }
 for(const player of bad){
  assert.throws(()=>resolveSkillMasteries(player),/incompleteSnapshot/);
  assert.throws(()=>resolveSkillMasteries(copyCharacter(player)),/incompleteSnapshot/);
 }
});

test('canonical maps validate exact formula ranks and equivalent single-page configurations serialize identically',()=>{
 const config={masteries:{craft:40,gather:0,rare:200}};
 const map=resolveSkillMasteries({...config,masteryPage:3,masteryAway:{},masterySkills:{}});
 const reordered=Object.fromEntries(Object.entries(map).reverse().map(([key,ranks])=>[key,Object.fromEntries(Object.entries(ranks).reverse())]));
 assert.equal(JSON.stringify(validateSkillMasteries(reordered)),JSON.stringify(effectiveSkillMasteries(config)));
 assert.deepEqual(effectiveSkillMasteries({...config,skillMasteries:map}),map);
 for(const broken of [{...map,smithing:{}},{...map,smithing:{craft:1,rare:0}},{...map,fishing:{gather:0,rare:201}},{...map,other:{}}]){
  assert.throws(()=>validateSkillMasteries(broken),/invalidConfiguration/);
 }
});

test('capture projects sparse mastery pages, preserving empty pages without reading unrelated data',()=>{
 const player=pages();
 const privateField={get private(){throw Error('private field read');}};
 player.masterySkills.raid=privateField;
 player.masteryAway[2].raid=privateField;
 player.masteryAway[3]={raid:privateField};
 assert.deepEqual(copyCharacter(player),{...pages(),masteryAway:{2:{craft:106},3:{}}});
});

test('capture keeps damaged fields invalid without copying their contents',()=>{
 const privateField={secret:'do-not-copy'};
 for(const [field,value] of Object.entries({
  masteryPage:privateField,masteries:[privateField],masterySkills:{mining:privateField},
  masteryAway:{2:{rare:privateField}},
 })){
  const projected=copyCharacter({...pages(),[field]:value});
  assert.equal(Object.hasOwn(projected,field),true,field);
  assert.doesNotMatch(JSON.stringify(projected),/do-not-copy/);
 }
});
