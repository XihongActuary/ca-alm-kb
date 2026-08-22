/* ALM 知识库 · 交互脚本
   进度记忆 + 滚动进度条 + 回到顶部 + 四个可交互演算器（久期/偿付能力/EV/久期缺口） */
(function(){
  'use strict';
  var KEY='alm-kb-progress';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}}
  function save(o){localStorage.setItem(KEY,JSON.stringify(o))}

  /* ---------- 学习进度 ---------- */
  var p=load();
  document.querySelectorAll('.done-btn').forEach(function(b){
    var id=b.getAttribute('data-id');
    if(p[id]){b.classList.add('did');b.textContent='✓ 已完成（点击撤销）'}
    b.addEventListener('click',function(){
      p=load();
      if(p[id]){delete p[id];b.classList.remove('did');b.textContent='○ 标记本页已完成'}
      else{p[id]=Date.now();b.classList.add('did');b.textContent='✓ 已完成（点击撤销）'}
      save(p);renderMini();
    });
  });
  function renderMini(){
    var m=document.querySelector('.side .prog-mini b');
    if(m){var n=Object.keys(load()).length;m.textContent=n+' / 16'}
  }
  renderMini();

  /* ---------- 顶部滚动进度条 ---------- */
  var bar=document.createElement('div');
  bar.style.cssText='position:fixed;top:0;left:0;height:3px;background:#EF9F27;z-index:99;transition:width .1s';
  document.body.appendChild(bar);

  /* ---------- 回到顶部 ---------- */
  var top=document.createElement('button');
  top.className='back-top';top.textContent='↑';top.title='回到顶部';
  document.body.appendChild(top);
  top.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});

  window.addEventListener('scroll',function(){
    var h=document.documentElement;
    var w=(h.scrollTop)/(h.scrollHeight-h.clientHeight)*100;
    bar.style.width=Math.min(100,Math.max(0,w))+'%';
    if(h.scrollTop>600){top.classList.add('show')}else{top.classList.remove('show')}
  });

  /* ---------- 演算器工具 ---------- */
  function $(id){return document.getElementById(id)}
  function num(el){var v=parseFloat(el.value);return isNaN(v)?0:v}
  function fmt(x,d){if(!isFinite(x))return'—';return x.toLocaleString('zh-CN',{minimumFractionDigits:d||2,maximumFractionDigits:d||2})}

  /* ---------- ① 久期计算器 ---------- */
  (function(){
    var box=$('calc-dur');if(!box)return;
    var ins=['dur-rate'].concat([1,2,3,4,5].map(function(i){return['dur-t'+i,'dur-c'+i]}));
    function run(){
      var r=num($('dur-rate'))/100,PV=0,wd=0;
      for(var i=1;i<=5;i++){
        var t=num($('dur-t'+i)),cf=num($('dur-c'+i));
        if(t===0||cf===0)continue;
        var pv=cf/Math.pow(1+r,t);
        PV+=pv;wd+=pv*t;
        var o=$('dur-pv'+i);if(o)o.textContent=fmt(pv);
      }
      var mac=PV>0?wd/PV:0;
      $('dur-pv-out').textContent=fmt(PV);
      $('dur-mac').textContent=fmt(mac);
      $('dur-mod').textContent=fmt(mac/(1+r));
    }
    ins.forEach(function(id){var e=$(id);if(e)e.addEventListener('input',run)});
    box.querySelector('.calc-run')&&box.querySelector('.calc-run').addEventListener('click',run);
    run();
  })();

  /* ---------- ② 偿付能力计算器 ---------- */
  (function(){
    var box=$('calc-solv');if(!box)return;
    function run(){
      var ra=num($('solv-ra')),rl=num($('solv-rl')),mc=num($('solv-mc')),cc=num($('solv-cc'));
      var ac=ra-rl;
      $('solv-ac').textContent=fmt(ac);
      var core=cc/mc*100,comp=ac/mc*100;
      $('solv-core').textContent=fmt(core,1)+'%';
      $('solv-comp').textContent=fmt(comp,1)+'%';
      var j1=core>=50,j2=comp>=100;
      $('solv-j1').textContent=j1?'✓ 达标':'✗ 不达标';
      $('solv-j1').style.color=j1?'#0F6E56':'#A32D2D';
      $('solv-j2').textContent=j2?'✓ 达标':'✗ 不达标';
      $('solv-j2').style.color=j2?'#0F6E56':'#A32D2D';
    }
    ['solv-ra','solv-rl','solv-mc','solv-cc'].forEach(function(id){var e=$(id);if(e)e.addEventListener('input',run)});
    run();
  })();

  /* ---------- ③ 内含价值计算器 ---------- */
  (function(){
    var box=$('calc-ev');if(!box)return;
    function run(){
      var fs=num($('ev-fs')),rc=num($('ev-rc')),vif=num($('ev-vif')),crc=num($('ev-crc'));
      var ev=fs+rc+vif-crc;
      $('ev-out').textContent=fmt(ev);
      $('ev-up').textContent='+'+fmt(ev*0.2);
      $('ev-dn').textContent=fmt(-ev*0.2);
      $('ev-rdr-up').textContent='+'+fmt(ev*0.05);
      $('ev-rdr-dn').textContent=fmt(-ev*0.05);
    }
    ['ev-fs','ev-rc','ev-vif','ev-crc'].forEach(function(id){var e=$(id);if(e)e.addEventListener('input',run)});
    run();
  })();

  /* ---------- ④ 久期缺口 · 利率冲击演算器 ---------- */
  (function(){
    var box=$('calc-gap');if(!box)return;
    function run(){
      var da=num($('gap-da')),dl=num($('gap-dl')),va=num($('gap-va')),vl=num($('gap-vl')),sh=num($('gap-shock'))/100;
      var gap=da-dl*(vl/va);
      $('gap-out').textContent=fmt(gap);
      var dva=-da*sh*va,dvl=-dl*sh*vl,dnav=dva-dvl;
      $('gap-dva').textContent=fmt(dva);
      $('gap-dvl').textContent=fmt(dvl);
      $('gap-dnav').textContent=fmt(dnav);
      var el=$('gap-verdict');
      if(el){
        if(Math.abs(gap)<0.5){el.textContent='近似免疫：资产与负债久期基本匹配，利率小幅变动对净资产影响有限';el.style.color='#0F6E56'}
        else if(gap>0){el.textContent='资产久期偏长（缺口 +'+fmt(gap)+'）：利率下行受益、上行承压 → 恰与寿险负债久期长的一般格局相反，需结合负债端判断';el.style.color='#854F0B'}
        else{el.textContent='负债久期偏长（缺口 '+fmt(gap)+'）：利率下行时资产增值不及负债，存在再投资/利差损风险——中国寿险业典型形态';el.style.color='#A32D2D'}
      }
    }
    ['gap-da','gap-dl','gap-va','gap-vl','gap-shock'].forEach(function(id){var e=$(id);if(e)e.addEventListener('input',run)});
    run();
  })();

  /* ---------- 模拟卷：展开/收起全部答案 ---------- */
  document.querySelectorAll('.js-toggle-answers').forEach(function(btn){
    btn.addEventListener('click',function(){
      var boxes=document.querySelectorAll('details.answer');
      var anyClosed=false;
      boxes.forEach(function(d){if(!d.open)anyClosed=true});
      boxes.forEach(function(d){d.open=anyClosed});
      btn.textContent=anyClosed?'收起全部答案':'展开全部答案';
    });
  });
})();
