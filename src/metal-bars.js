import * as game from './engine/upstream.js';
import {craftingJobs,craftingMaterials,safeAdd} from './engine/crafting-model.js';

// Only bars and cut gems are expandable; equipment and tools remain direct materials.
const intermediateJobIds=new Set([41,42,43,44,45,230]);
const intermediateJobs=new Map(craftingJobs.filter(job=>intermediateJobIds.has(job.id)).map(job=>[job.output.itemId,job]));

// Keep the existing bar identifiers alongside the saved preference and action keys.
export function expandBarMaterials(materials,availableBars){
 const costMaterials={},requirements={...materials},stockUsed={},steps=[];
 for(const [id,qty]of Object.entries(materials)){
  const itemId=Number(id),job=intermediateJobs.get(game.baseItemId(itemId));
  if(!job){costMaterials[id]=safeAdd(costMaterials[id]??0,qty);continue;}
  const tier=game.itemTier(itemId);
  // The allowlisted upstream recipes yield exactly one item of the selected quality.
  if(job.output.qty!==1||job.burn||game.recipeOutput(job,tier)!==itemId)throw Error('invalidResult');
  if(availableBars===null){
   steps.push({kind:'craft',jobId:job.id,tier,outputItemId:itemId,count:null,materials:{}});
   continue;
  }
  const used=Math.min(qty,availableBars.get(itemId)??0),count=qty-used;
  if(used>0){costMaterials[id]=safeAdd(costMaterials[id]??0,used);stockUsed[id]=used;}
  if(count===0)continue;
  const inputs=craftingMaterials(job,tier,count);
  steps.push({kind:'craft',jobId:job.id,tier,outputItemId:itemId,count,materials:inputs});
  for(const [input,amount]of Object.entries(inputs)){
   costMaterials[input]=safeAdd(costMaterials[input]??0,amount);
   requirements[input]=safeAdd(requirements[input]??0,amount);
  }
 }
 return {costMaterials,requirements,stockUsed,steps};
}
