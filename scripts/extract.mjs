import fs from 'node:fs';
import crypto from 'node:crypto';
import {parse} from 'acorn';
import {analyze} from 'eslint-scope';

// Select upstream declarations by semantic signature; preserve their source verbatim.
const sourceInfo={"sourceUrl":"https://deepveinidle.com/assets/index-BqokRC4i.js","retrieved":"2026-11-06","changelogVersion":"1.0.1212","sha256":"13f144ed0a9a34f3f844e4f1c5b490a34590d37a57775522cceecf2c9716d932"};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const source = fs.readFileSync('vendor/game-original.js','utf8');
if(hash(source)!==sourceInfo.sha256)throw Error('Unreviewed upstream snapshot: review source metadata, export mappings and signatures before extraction');
const ast = parse(source,{ecmaVersion:'latest',sourceType:'module',ranges:true});
const declarations = new Map();
for (const node of ast.body) {
  if (node.type === 'FunctionDeclaration') declarations.set(node.id.name,{name:node.id.name,start:node.start,end:node.end,text:source.slice(node.start,node.end)});
  if (node.type === 'VariableDeclaration') for(const d of node.declarations) {
    // Keep destructuring together, so dependent constants retain original initialization.
    const ids=[]; const walk=n=>{if(!n)return;if(n.type==='Identifier')ids.push(n.name);else if(n.type==='ObjectPattern')n.properties.forEach(p=>walk(p.value));else if(n.type==='ArrayPattern')n.elements.forEach(walk);};walk(d.id);
    const entry={name:ids.join(','),start:d.start,end:d.end,text:node.kind+' '+source.slice(d.start,d.end)+';'};
    ids.forEach(id=>declarations.set(id,entry));
  }
}
// Reviewed public build mappings; the source hash guards every symbol.
// Reviewed roots: current work calculations and character/market data.
const exportsMap={
  "equipment": "KI",
  "items": "Fs",
  "marketFamily": "ZA",
  "marketPriceLimit": "th",
  "gear": "ma",
  "item": "Bo",
  "encode": "js",
  "withRarity": "Yc",
  "levelXp": "rt",
  "level": "Qo",
  "maxLevel": "Qi",
  "equipmentSlots": "ur",
  "masteries": "Fl",
  "rooms": "w7",
  "combine": "Va",
  "tickMs": "ho",
  "maxEnhancement": "Ks",
  "potions": "mw",
  "recipes": "Vo",
  "translations": "AE",
  "worldTranslations": "TSo",
  "uiTranslations": "xSo",
  "homeTranslations": "RSo",
  "masteryRankLimit": "ds",
  "collectionThresholds": "yg",
  "collectionPoints": "B8",
  "collectionItems": "Lu",
  "rarityThresholds": "Gl",
  "baseItemId": "to",
  "itemTier": "Xo",
  "coinItemId": "ft",
  "hotSkill": "vO",
  "world": "U",
  "allSkills": "$e",
  "perks": "f2",
  "tools": "MI",
  "tool": "Kt",
  "toolLuck": "mO",
  "equipmentLuck": "Ob",
  "brewRarityMultiplier": "WX",
  "houseRarityMultiplier": "S4",
  "masteryMultiplier": "Ca",
  "canEnhance": "mn",
  "workChance": "PX",
  "recipeInputs": "ga",
  "burnChance": "TOo",
  "caughtChance": "zX",
  "upgradeRecipes": "ws",
  "upgradeTicks": "CO",
  "upgradeResult": "pr",
  "upgradeMaterials": "om",
  "recipeLevel": "YV",
  "hotRarityMultiplier": "JK",
  "itemSupportsRarity": "$h",
  "recipeRarity": "nw",
  "recipeOutput": "Hh",
  "collectionExcluded": "L8"
};
const selected=new Set(); const allowed=new Set(['WeakSet','WeakMap','Uint8Array','Uint16Array','Uint32Array','Int32Array','Float64Array','Math','Map','Set','Number','Object','Array','String','Error','Date','Boolean','Infinity','undefined','JSON','RegExp','parseInt','parseFloat']);
function collect(name){
 const d=declarations.get(name);if(!d)throw Error('Missing declaration '+name);if(selected.has(d))return;selected.add(d);
 const a=parse(d.text,{ecmaVersion:'latest',sourceType:'module',ranges:true});
 const refs=analyze(a,{ecmaVersion:2024,sourceType:'module'}).globalScope.through.map(r=>r.identifier.name);
 for(const dep of new Set(refs))if(declarations.has(dep))collect(dep);else if(!allowed.has(dep))throw Error(`Unexpected external dependency ${dep} in ${name}`);
}
Object.values(exportsMap).forEach(collect);
const ordered=[...selected].sort((a,b)=>a.start-b.start);
fs.mkdirSync('src',{recursive:true});
fs.writeFileSync('src/engine/upstream.js','// GENERATED from reviewed vendor snapshots. Do not edit.\n'+ordered.map(d=>d.text).join('\n')+'\nexport { '+Object.entries(exportsMap).map(([alias,name])=>`${name} as ${alias}`).join(', ')+' };\n');
fs.writeFileSync('vendor/manifest.json',JSON.stringify({...sourceInfo,exports:exportsMap,declarations:ordered.map(({name,start,end,text})=>({name,start,end,sha256:hash(text)})),overrides:[]},null,2));
console.log(`Extracted ${ordered.length} original declarations (${fs.statSync('src/engine/upstream.js').size} bytes).`);
