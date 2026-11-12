import {masteryRankLimit} from './upstream.js';
import {craftingSkills} from './crafting-model.js';
import {gatheringSkills} from './gathering-model.js';
import {requireKeys} from './record-shape.js';

const ranks=['craft','gather','rare'];
const pageFields=['masteryPage','masterySkills','masteryAway'];
export const masteryFields=['masteries',...pageFields];
const record=value=>Object.prototype.toString.call(value)==='[object Object]';
const validPage=value=>Number.isInteger(value)&&value>=1&&value<=3;
const validPageKey=key=>validPage(Number(key))&&String(Number(key))===key;
const validRank=value=>Number.isInteger(value)&&value>=0&&value<=masteryRankLimit;
const workSkills=[...craftingSkills,...gatheringSkills];
const formulaRanks=skill=>craftingSkills.includes(skill)?['craft']:['gather','rare'];

// Preserve field presence and damaged values without cloning unrelated game objects.
export function projectMasteries(player){
 const number=value=>typeof value==='number'?value:null;
 const pick=(value,keys)=>record(value)?Object.fromEntries(keys.filter(key=>Object.hasOwn(value,key)).map(key=>[key,number(value[key])])):null;
 const projected={};
 if(Object.hasOwn(player,'masteries'))projected.masteries=pick(player.masteries,ranks);
 if(Object.hasOwn(player,'masteryPage'))projected.masteryPage=number(player.masteryPage);
 if(Object.hasOwn(player,'masterySkills'))projected.masterySkills=pick(player.masterySkills,workSkills);
 if(Object.hasOwn(player,'masteryAway')){
  const away=player.masteryAway;
  projected.masteryAway=record(away)&&Object.keys(away).every(validPageKey)
   ?Object.fromEntries(Object.keys(away).map(page=>[page,pick(away[page],ranks)])):null;
 }
 return projected;
}

function validRanks(page){
 return record(page)&&ranks.every(key=>!Object.hasOwn(page,key)||validRank(page[key]));
}
function perSkill(select){
 return Object.fromEntries(workSkills.map(skill=>{
  const page=select(skill);
  return [skill,Object.fromEntries(formulaRanks(skill).map(key=>[key,Object.hasOwn(page,key)?page[key]:0]))];
 }));
}

export function validateMasteryPages(player){
 const {masteries,masteryPage,masterySkills,masteryAway}=player;
 if(!validRanks(masteries))throw Error('incompleteSnapshot');
 if(!pageFields.some(key=>Object.hasOwn(player,key)))return;
 if(!pageFields.every(key=>Object.hasOwn(player,key))||!validPage(masteryPage)||!record(masterySkills)||!record(masteryAway)
  ||workSkills.some(skill=>Object.hasOwn(masterySkills,skill)&&!validPage(masterySkills[skill]))
  ||Object.keys(masteryAway).some(key=>!validPageKey(key)||!validRanks(masteryAway[key])))throw Error('incompleteSnapshot');
}

export function resolveSkillMasteries(player){
 validateMasteryPages(player);
 if(!Object.hasOwn(player,'masteryPage'))return null;
 const {masteries,masteryPage,masterySkills,masteryAway}=player;
 return perSkill(skill=>{
  const binding=masterySkills[skill];
  return Object.hasOwn(masterySkills,skill)&&binding!==masteryPage&&Object.hasOwn(masteryAway,binding)?masteryAway[binding]:masteries;
 });
}

export function validateSkillMasteries(map){
 requireKeys(map,workSkills,'invalidConfiguration');
 return perSkill(skill=>{
  requireKeys(map[skill],formulaRanks(skill),'invalidConfiguration');
  if(!Object.values(map[skill]).every(validRank))throw Error('invalidConfiguration');
  return map[skill];
 });
}

// Collection configs have already passed validation. Include only ranks used by each formula.
export function effectiveSkillMasteries(config){
 return config.skillMasteries??perSkill(()=>config.masteries);
}
