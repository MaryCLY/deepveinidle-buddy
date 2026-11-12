import assert from 'node:assert/strict';
import {craftingSkills} from '../src/engine/crafting-model.js';
import {gatheringSkills} from '../src/engine/gathering-model.js';

// Exercise the same live draft guards against the two native navigation fixtures.
export async function checkMasteryDrafts(page,{jobId,mobile}){
 const panel=page.locator('#deepveinidle-buddy');
 const action=panel.locator(`[data-action="prefill-action"][data-key="${jobId}:0"]`);
 const purchase=panel.locator('[data-action="prefill-purchase"][data-item="1"]');
 const click=button=>mobile?button.tap():button.click();
 await page.evaluate(skills=>{
  window.__panel.open();
  Object.assign(window.deepvein.session.state,{
   masteryPage:1,masterySkills:Object.fromEntries(skills.map(skill=>[skill,1])),
   masteryAway:{2:{craft:106,rare:5},3:{rare:5,craft:106}},
  });
 },[...craftingSkills,...gatheringSkills]);
 const expectedCount=Number((await panel.locator(`[data-execution-action="${jobId}:0"] td`).nth(3).textContent()).replaceAll(',',''));
 for(const [binding,valid] of [[2,false],[3,true]]){
  await page.evaluate(binding=>{
   window.__panel.open();
   const toggle=document.querySelector('[data-opt-line]');
   toggle.setAttribute('aria-expanded','false');
   document.querySelector('[data-opt-sheet]').hidden=true;
   window.__blockOptionOpen=true;
   window.__routes.amount=777;
   window.__wait=async()=>{
    const state=window.deepvein.session.state;
    state.masterySkills.cooking=binding;
    if(binding===3){
     const previous=state.masteries;
     state.masteries=state.masteryAway[2];
     state.masteryPage=2;
     state.masteryAway={3:state.masteryAway[3],1:previous};
    }
    window.__blockOptionOpen=false;
    toggle.click();
    window.__wait=null;
   };
  },binding);
  await click(action);
  await page.waitForFunction(()=>window.__wait===null);
  if(valid){
   await page.waitForFunction(count=>window.__routes.amount===count,expectedCount);
   assert.equal(await page.locator('[data-buddy-hint]').textContent(),'');
  }else{
   await page.locator('[data-buddy-hint]').filter({hasText:'请重试'}).waitFor();
   assert.equal(await page.evaluate(()=>window.__routes.amount),777);
  }
 }
 await page.evaluate(()=>{
  window.__panel.open();
  window.__wait=async()=>{
   window.deepvein.session.state.masterySkills.cooking=1;
   window.__wait=null;
  };
 });
 const expectedQuantity=Number((await panel.locator('[data-material="1"] td').nth(2).textContent()).replaceAll(',',''));
 await click(purchase);
 await page.waitForFunction(()=>window.__wait===null&&document.querySelector('[data-buddy-hint]').textContent==='');
 assert.equal(Number((await page.locator('[data-trade-qty-in]').inputValue()).replaceAll(',','')),expectedQuantity);
 assert.equal(await page.locator('[data-trade-price-in]').inputValue(),'112');
 assert.deepEqual(await page.evaluate(()=>window.__commands),[]);
}
