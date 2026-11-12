import test from 'node:test';import assert from 'node:assert/strict';
import {priceDefaults,normalizePriceState,mergeMarketSnapshot} from '../src/engine/item-prices.js';
import {createPriceSnapshot} from '../src/engine/price-protocol.js';
import {parseMarketPrices} from '../src/engine/market-import.js';
test('market state stores only side quotes and merges newer observations per side',()=>{
 const at=Date.now(),old={version:1,quotes:{1:{ask:{value:112,capturedAt:at},bid:{value:80,capturedAt:at}}}},before=structuredClone(old);
 const next=mergeMarketSnapshot(old,{version:1,invalid:0,quotes:{1:{ask:{value:110,capturedAt:at-1},bid:{value:85,quantity:10,capturedAt:at}}}});
 assert.equal(next.quotes[1].ask.value,112);assert.equal(next.quotes[1].bid.value,85);assert.deepEqual(old,before);assert.deepEqual(normalizePriceState(next),next);
 const item=createPriceSnapshot(next).getItem(1);assert.equal(item.sellPrice,112);assert.equal(item.buyPrice,85);for(const key of ['price','vendorPrice','configured'])assert.equal(Object.hasOwn(item,key),false);
});
test('official missing sides and invalid supply stay unknown instead of becoming zero',()=>{
 const raw={game:'Deep Vein Idle',generatedAt:new Date().toISOString(),refreshSeconds:300,items:{1:{lowestSell:null,highestBuy:80,sellQty:'bad',buyQty:0}}};
 const next=mergeMarketSnapshot(priceDefaults(),parseMarketPrices(raw)),item=createPriceSnapshot(next).getItem(1);assert.equal(item.sellPrice,null);assert.equal(item.sellQuantity,null);assert.equal(item.buyPrice,80);
});
test('effective prices, preferences, invalid quantities and obsolete state versions reject',()=>{
 for(const value of [{version:4,prices:{},quotes:{},preferences:{}},{...priceDefaults(),prices:{}},{...priceDefaults(),preferences:{}}])assert.throws(()=>normalizePriceState(value));
 const old=priceDefaults();assert.throws(()=>mergeMarketSnapshot(old,{version:1,invalid:0,quotes:{1:{ask:{value:1,quantity:-1,capturedAt:Date.now()}}}}));assert.deepEqual(old,priceDefaults());
});
test('explicit zero quotes survive ingestion while missing and invalid sides stay unknown',()=>{
 const raw={game:'Deep Vein Idle',generatedAt:new Date().toISOString(),refreshSeconds:300,items:{
  40:{lowestSell:0,highestBuy:null,sellQty:1,buyQty:0},
  1:{lowestSell:-1,highestBuy:0,sellQty:0,buyQty:1},
 }};
 const prices=createPriceSnapshot(mergeMarketSnapshot(priceDefaults(),parseMarketPrices(raw)));
 assert.equal(prices.getItem(40).sellPrice,0);
 assert.equal(prices.getItem(40).buyPrice,null);
 assert.equal(prices.getItem(1).sellPrice,null);
 assert.equal(prices.getItem(1).buyPrice,0);
});
