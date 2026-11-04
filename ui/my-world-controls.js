/* UI adapter: all actions delegate to the existing My World systems. */
(function () {
  'use strict';
  function voxel() { var b = document.getElementById('vx62-btn'); if (b) b.click(); }
  function prepare() {
    document.querySelectorAll('.wf .wf-acts').forEach(function (nav) {
      if (nav.querySelector('[data-console-voxel]')) return;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-console-voxel', '');
      b.innerHTML = '<i>🧊</i><span>体素世界</span>'; b.addEventListener('click', voxel); nav.appendChild(b);
    });
    var santorini = document.getElementById('mn-btn-santorini-3d');
    if (santorini) document.querySelectorAll('.wf .wf-acts').forEach(function(nav){
      if(nav.querySelector('[data-console-santorini]'))return;
      var b=document.createElement('button');b.type='button';b.setAttribute('data-console-santorini','');b.innerHTML='<i>🏛️</i><span>圣托里尼</span>';b.onclick=function(){santorini.click();};nav.appendChild(b);
    });
    var root = document.getElementById('oia-root');
    if (!root) return;
    var panel = root.querySelector('#mn-bld-p');
    if (!root.querySelector('#oia-console')) {
      var toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'oia-console-toggle';
      toggle.textContent = '≡'; toggle.setAttribute('aria-label', '打开 My World 控制台'); toggle.setAttribute('aria-expanded','false');
      var console = document.createElement('section'); console.id = 'oia-console'; console.hidden = true;
      console.setAttribute('aria-label','My World 控制台');
      console.innerHTML = '<header><b>🌴 World › 圣托里尼</b><span>1/6 · World</span><button data-console="close" aria-label="收起控制台">×</button></header>' +
        '<div class="console-grid"><nav aria-label="编辑工具"><button data-console="bld">🏛️<br>建筑</button><button data-console="elem">🌳<br>元素</button><button data-console="disp">🎨<br>陈列</button><button data-console="ai">✨<br>Smart</button></nav><main></main><nav aria-label="世界导航"><button data-console="door">🏠<br>进入房间</button><button data-console="worlds">🌍<br>一键世界</button><button data-console="voxel">🧊<br>体素世界</button><button data-console="return">‹<br>返回小岛</button></nav></div>';
      function open(on) {
        console.hidden = !on; toggle.setAttribute('aria-expanded',String(on));
        if (window.MinestOiaBld) window.MinestOiaBld.toggle(on);
      }
      toggle.onclick = function () { open(console.hidden); };
      console.addEventListener('click',function(e){
        var b=e.target.closest('[data-console]'); if(!b)return;
        var action=b.getAttribute('data-console'); e.stopPropagation();
        if(action==='close')return open(false);
        if(action==='voxel'){open(false);return voxel();}
        if(action==='return'){open(false);if(window.MinestOia)window.MinestOia.close();return;}
        if(action==='worlds'||action==='door'){
          var old=document.getElementById(action==='worlds'?'oia-q-worlds':'oia-q-door');if(old){old.click();return;} if(action==='worlds'){open(false);if(window.MinestOia)window.MinestOia.close();var pick=document.querySelector('.wf [data-wfmegapop]');if(pick&&pick.getAttribute('aria-expanded')!=='true')pick.click();}return;
        }
        if(window.MinestOiaBld)window.MinestOiaBld.toggle(true);
        var tab=root.querySelector('#mn-bld-p [data-tab="'+action+'"]');if(tab)tab.click();
        console.querySelectorAll('[data-console]').forEach(function(x){x.classList.toggle('on',x===b);});
      });
      root.appendChild(toggle);root.appendChild(console);
    }
    if(panel && panel.parentElement!==root.querySelector('#oia-console main'))root.querySelector('#oia-console main').appendChild(panel);
  }
  var queued=false;
  new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;prepare();});}).observe(document.body,{childList:true,subtree:true});
  prepare();
})();
