(function(root){
  'use strict';
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const ncKey=r=>r.store+'|'+r.nc;
  const sum=rows=>rows.reduce((s,r)=>s+r.value,0);
  function stats(rows){
    const pending=rows.filter(r=>r.pending==='S'),done=rows.filter(r=>r.pending==='N');
    return {items:rows.length,ncs:new Set(rows.map(ncKey)).size,value:sum(rows),suppliers:new Set(rows.map(r=>r.supplierKey)).size,products:new Set(rows.map(r=>r.product)).size,pendingItems:pending.length,pendingValue:sum(pending),pendingNCs:new Set(pending.map(ncKey)).size,doneItems:done.length,doneValue:sum(done),unknownItems:rows.length-pending.length-done.length,unmappedItems:rows.filter(r=>!r.mappedCategory).length};
  }
  function filter(rows,f){
    const query=norm(f.query).trim();
    return rows.filter(r=>!((f.from&&r.date<f.from)||(f.to&&r.date>f.to)||(f.origin&&r.origin!==f.origin)||(f.status&&r.pending!==f.status)||(f.type&&r.type!==f.type)||(f.supplier&&r.supplierKey!==f.supplier)||(f.category&&r.category!==f.category)||(query&&!norm([r.nc,r.product,r.description,r.supplier,r.category,r.type,r.originLabel].join(' ')).includes(query))));
  }
  function group(rows,field){
    const map=new Map(),total=sum(rows);
    for(const r of rows){
      const key=field==='supplier'?r.supplierKey:field==='month'?r.date.slice(0,7):r[field];
      if(!map.has(key))map.set(key,{key,label:field==='supplier'?r.supplier:field==='origin'?r.originLabel:key,items:0,value:0,pendingItems:0,pendingValue:0,ncSet:new Set(),pendingSet:new Set(),codes:new Set()});
      const g=map.get(key);g.items++;g.value+=r.value;g.ncSet.add(ncKey(r));if(r.supplierCode)g.codes.add(r.supplierCode);
      if(r.pending==='S'){g.pendingItems++;g.pendingValue+=r.value;g.pendingSet.add(ncKey(r));}
    }
    return [...map.values()].map(({ncSet,pendingSet,codes,...g})=>({...g,ncs:ncSet.size,pendingNCs:pendingSet.size,codes:[...codes].sort(),share:total?g.value/total:0}));
  }
  const sort=(groups,metric='value')=>[...groups].sort((a,b)=>(b[metric]-a[metric])||(b.value-a.value)||a.label.localeCompare(b.label,'pt-BR'));
  function months(rows,from,to){
    const groups=new Map(group(rows,'month').map(g=>[g.key,g]));
    if(!from||!to||from>to)return [];
    const start=new Date(from.slice(0,7)+'-01T00:00:00Z'),end=new Date(to.slice(0,7)+'-01T00:00:00Z'),result=[];
    while(start<=end&&result.length<240){const key=start.toISOString().slice(0,7);result.push(groups.get(key)||{key,label:key,items:0,ncs:0,value:0,pendingItems:0,pendingValue:0,share:0});start.setUTCMonth(start.getUTCMonth()+1);}
    return result;
  }
  function treatmentByMonth(rows,universe=rows,unit='ncs'){
    const result={};
    if(unit==='items'){for(const r of rows)if(r.pending==='N')result[r.date.slice(0,7)]=(result[r.date.slice(0,7)]||0)+1;return result;}
    const ncStates=new Map();
    for(const r of universe){const key=ncKey(r);ncStates.set(key,(ncStates.has(key)?ncStates.get(key):true)&&r.pending==='N');}
    const counted=new Set();
    for(const r of rows){const key=ncKey(r);if(ncStates.get(key)&&!counted.has(key)){counted.add(key);result[r.date.slice(0,7)]=(result[r.date.slice(0,7)]||0)+1;}}
    return result;
  }
  function salesRatio(rows,sales,from,to,coverage={from:'2026-01-02',to:'2026-10-30'}){
    const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
    const unavailable=()=>({months:[],totalLoss:0,totalSales:null,rate:null,available:false,reason:'invalid-period',partialMonths:[],missingMonths:[],zeroMonths:[]});
    if(!validDate(from)||!validDate(to)||from>to||!validDate(coverage?.from)||!validDate(coverage?.to)||coverage.from>coverage.to)return unavailable();
    const losses=new Map();
    let totalLoss=0;
    for(const row of rows){
      if(row.date<from||row.date>to)continue;
      const key=row.date.slice(0,7);
      totalLoss+=row.value;
      losses.set(key,(losses.get(key)||0)+row.value);
    }
    const partialMonths=[],missingMonths=[],zeroMonths=[],result=[];
    const cursor=new Date(from.slice(0,7)+'-01T00:00:00Z'),last=new Date(to.slice(0,7)+'-01T00:00:00Z');
    while(cursor<=last){
      const key=cursor.toISOString().slice(0,7),monthFrom=key+'-01';
      const monthTo=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,0)).toISOString().slice(0,10);
      const requiredFrom=monthFrom>coverage.from?monthFrom:coverage.from,requiredTo=monthTo<coverage.to?monthTo:coverage.to;
      const partial=requiredFrom>requiredTo||from>requiredFrom||to<requiredTo;
      const rawSales=sales?.byMonth?.[key],monthlySales=typeof rawSales==='number'&&Number.isFinite(rawSales)&&rawSales>=0?rawSales:null;
      const missing=monthlySales===null,zero=monthlySales===0;
      if(partial)partialMonths.push(key);
      if(missing)missingMonths.push(key);
      if(zero)zeroMonths.push(key);
      const reason=partial?'partial-period':missing?'missing-sales':zero?'zero-sales':'';
      const loss=losses.get(key)||0,eligible=!reason;
      result.push({key,loss,sales:monthlySales,rate:eligible?loss/monthlySales:null,eligible,reason});
      cursor.setUTCMonth(cursor.getUTCMonth()+1);
    }
    const reason=partialMonths.length?'partial-period':missingMonths.length?'missing-sales':zeroMonths.length?'zero-sales':'';
    const available=!reason,totalSales=available?result.reduce((value,month)=>value+month.sales,0):null;
    return {months:result,totalLoss,totalSales,rate:available?totalLoss/totalSales:null,available,reason,partialMonths,missingMonths,zeroMonths};
  }
  const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function csv(matrix){return '\uFEFF'+matrix.map(row=>row.map(v=>{let s=typeof v==='number'?String(v).replace('.',','):String(v??'');if(typeof v!=='number'&&/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');}
  const api={norm,ncKey,sum,stats,filter,group,sort,months,treatmentByMonth,salesRatio,escapeHtml,csv};root.NCCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
