import os

target_files = [
    'iPhone53.8241.html',
    'iphone.html',
    'index.html',
    'ios/Minest/Minest/iphone.html',
    'ios/MinestProject/MyApp/iphone.html'
]

STUDENT_ACCOUNT_MODULE = '''  // ================================================================== MINEST STUDENT PIN & CLOUD ACCOUNT (Chromebook Support)
  var MinestStudentAccount = (function() {
    var RTDB_BASE = 'https://minest-33761-default-rtdb.firebaseio.com/minest-rooms/';
    var DEFAULT_CLASS = 'CHINESE';

    function safeKey(str) {
      return encodeURIComponent(String(str || '').trim().toLowerCase().replace(/[\\.\\#\\$\\[\\]\\/]/g, '_'));
    }

    function hashPin(pin) {
      var p = String(pin).trim();
      var h = 0;
      for (var i = 0; i < p.length; i++) {
        h = ((h << 5) - h) + p.charCodeAt(i);
        h |= 0;
      }
      return 'p' + Math.abs(h);
    }

    function getCurrent() {
      try { return JSON.parse(sessionStorage.getItem('minest.student.current') || 'null'); } catch(e) { return null; }
    }

    function collectLocalData() {
      var g = 0, lk = {}, alb = {}, sb = {}, av = '';
      try { g = +localStorage.getItem('minest.live.gems.v1') || 0; } catch(e){}
      try { lk = JSON.parse(localStorage.getItem('minest.live.locker.v1') || '{}'); } catch(e){}
      try { alb = JSON.parse(localStorage.getItem('minest.live.album.v1') || '{}'); } catch(e){}
      try { sb = JSON.parse(localStorage.getItem('minest.teaching.solo.best') || '{}'); } catch(e){}
      try { av = localStorage.getItem('minest.live.av') || ''; } catch(e){}
      return {
        gems: g,
        locker: lk,
        album: alb,
        soloBest: sb,
        av: av,
        lastUpdated: Date.now()
      };
    }

    function restoreLocalData(data) {
      if (!data) return;
      try {
        if (typeof data.gems === 'number') localStorage.setItem('minest.live.gems.v1', String(data.gems));
        if (data.locker) localStorage.setItem('minest.live.locker.v1', JSON.stringify(data.locker));
        if (data.album) localStorage.setItem('minest.live.album.v1', JSON.stringify(data.album));
        if (data.soloBest) localStorage.setItem('minest.teaching.solo.best', JSON.stringify(data.soloBest));
        if (data.av) localStorage.setItem('minest.live.av', String(data.av));
      } catch(e) { console.error('Failed to restore student local data', e); }
    }

    function syncToCloud() {
      var cur = getCurrent();
      if (!cur || !cur.classCode || !cur.name) return Promise.resolve(null);
      var key = safeKey(cur.name);
      var payload = collectLocalData();
      payload.name = cur.name;
      payload.pinHash = cur.pinHash;
      var url = RTDB_BASE + encodeURIComponent(cur.classCode) + '/students/' + key + '.json';
      return fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(r){ return r.json(); }).catch(function(e){ console.warn('Student sync error:', e); });
    }

    function login(classCode, name, pin) {
      classCode = (classCode || DEFAULT_CLASS).trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || DEFAULT_CLASS;
      name = (name || '').trim();
      pin = String(pin || '').trim();

      if (!name) return Promise.reject(new Error('请填写你的名字'));
      if (!/^\\d{4}$/.test(pin)) return Promise.reject(new Error('请输入 4 位纯数字密码 (PIN)'));

      var key = safeKey(name);
      var pHash = hashPin(pin);
      var url = RTDB_BASE + encodeURIComponent(classCode) + '/students/' + key + '.json';

      return fetch(url, { cache: 'no-store' })
        .then(function(r){ return r.json(); })
        .then(function(cloudUser){
          if (!cloudUser || !cloudUser.pinHash) {
            var newProfile = collectLocalData();
            newProfile.name = name;
            newProfile.pinHash = pHash;
            newProfile.classCode = classCode;
            newProfile.createdAt = Date.now();
            if (!newProfile.gems) newProfile.gems = 60;
            restoreLocalData(newProfile);

            return fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newProfile)
            }).then(function(){
              var cur = { classCode: classCode, name: name, pinHash: pHash, isNew: true };
              sessionStorage.setItem('minest.student.current', JSON.stringify(cur));
              return { user: cur, isNew: true, gems: newProfile.gems };
            });
          } else {
            if (cloudUser.pinHash !== pHash) {
              throw new Error('4 位数字密码不正确。如果忘记密码，请老师在后台重置。');
            }
            restoreLocalData(cloudUser);
            var cur = { classCode: classCode, name: name, pinHash: pHash, isNew: false };
            sessionStorage.setItem('minest.student.current', JSON.stringify(cur));
            return { user: cur, isNew: false, gems: cloudUser.gems || 0 };
          }
        });
    }

    function logout() {
      sessionStorage.removeItem('minest.student.current');
    }

    setInterval(function() {
      if (getCurrent()) syncToCloud();
    }, 15000);

    return {
      login: login,
      logout: logout,
      getCurrent: getCurrent,
      syncToCloud: syncToCloud,
      restoreLocalData: restoreLocalData,
      DEFAULT_CLASS: DEFAULT_CLASS
    };
  })();
  window.MinestStudentAccount = MinestStudentAccount;

  // ================================================================== STUDENT'''

GEMS_HOOK_OLD = '''    if (add) { g = Math.max(0, g + add); try { localStorage.setItem(GEMS_KEY, String(g)); } catch (e) {} }'''
GEMS_HOOK_NEW = '''    if (add) { g = Math.max(0, g + add); try { localStorage.setItem(GEMS_KEY, String(g)); } catch (e) {} try { if (window.MinestStudentAccount && window.MinestStudentAccount.syncToCloud) window.MinestStudentAccount.syncToCloud(); } catch(e){} }'''

LOCKER_HOOK_OLD = '''    if (L) { try { localStorage.setItem(LOCKER_KEY, JSON.stringify(L)); } catch (e) {} return L; }'''
LOCKER_HOOK_NEW = '''    if (L) { try { localStorage.setItem(LOCKER_KEY, JSON.stringify(L)); } catch (e) {} try { if (window.MinestStudentAccount && window.MinestStudentAccount.syncToCloud) window.MinestStudentAccount.syncToCloud(); } catch(e){} return L; }'''

PAINT_ACCT_OLD = '''    function paintAcct() {
      if (!acct || !acct.isConnected) return;
      if (gUser) {
        acct.innerHTML = (gUser.photoURL ? '<img src="' + esc(gUser.photoURL) + '" alt="" referrerpolicy="no-referrer">' : '<i class="mlv-av">🙂</i>') + '<span>Signed in as <b>' + esc(gUser.displayName || 'you') + '</b></span><button type="button" class="mlv-link-btn" data-out>Sign out</button>';
        $(acct, '[data-out]').onclick = function () { GAUTH.signOut().then(function () { gUser = null; paintAcct(); }); };
        if (!nameIn.value.trim() || nameIn.getAttribute('data-auto')) { nameIn.value = String(gUser.displayName || '').split(' ')[0].slice(0, 20); nameIn.setAttribute('data-auto', '1'); }
      } else {
        acct.innerHTML = '<div style="background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.25);border-radius:16px;padding:8px 12px;margin:0 auto 8px;max-width:320px;display:flex;align-items:center;justify-content:center;gap:8px">' +
          '<span style="font-size:16px">🎒</span>' +
          '<span style="font-size:13px;font-weight:700;color:#60a5fa">学生免授权模式 · 输入名字直接开玩</span>' +
          '</div>' +
          '<div style="margin-bottom:6px"><button type="button" class="mlv-link-btn" data-gin style="font-size:11px;opacity:0.65;text-decoration:underline">使用 Google 账号同步（可选）</button></div>';
        var ginBtn = $(acct, '[data-gin]');
        if (ginBtn) ginBtn.onclick = function () {
          var b = this; b.disabled = true; err.textContent = '';
          GAUTH.signIn().then(function (r) {
            if (r && r.user) { gUser = r.user; paintAcct(); }
          }).catch(function (e) {
            console.warn('Google sign-in authorization required/blocked:', e);
            err.innerHTML = '⚠️ 账号未获管理员授权。<b>学生已自动启用免授权游客模式</b>，直接输入名字加入即可！';
            try {
              if (window.firebase && firebase.auth) {
                firebase.auth().signInAnonymously().then(function(res){
                  if (res && res.user) { gUser = res.user; paintAcct(); }
                }).catch(function(){});
              }
            } catch(ign){}
          }).then(function () { b.disabled = false; });
        };
      }
    }'''

PAINT_ACCT_NEW = '''    function paintAcct() {
      if (!acct || !acct.isConnected) return;
      var curStudent = window.MinestStudentAccount ? window.MinestStudentAccount.getCurrent() : null;
      if (curStudent) {
        acct.innerHTML = '<div style="background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);border-radius:18px;padding:8px 14px;margin:0 auto 10px;max-width:360px;display:flex;align-items:center;justify-content:space-between">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-size:18px">🎒</span>' +
          '<div style="text-align:left">' +
          '<div style="font-size:13px;font-weight:800;color:#4ade80">学生档案 · <b>' + esc(curStudent.name) + '</b></div>' +
          '<div style="font-size:11px;color:#94a3b8">班级: ' + esc(curStudent.classCode) + ' · 💎 进度已与云端同步</div>' +
          '</div></div>' +
          '<button type="button" class="mlv-link-btn" data-pin-out style="font-size:11px;color:#f87171;text-decoration:underline">切换账号</button>' +
          '</div>';
        var outBtn = $(acct, '[data-pin-out]');
        if (outBtn) outBtn.onclick = function() {
          window.MinestStudentAccount.logout();
          paintAcct();
        };
        if (!nameIn.value.trim() || nameIn.getAttribute('data-auto')) {
          nameIn.value = curStudent.name;
          nameIn.setAttribute('data-auto', '1');
        }
      } else if (gUser) {
        acct.innerHTML = (gUser.photoURL ? '<img src="' + esc(gUser.photoURL) + '" alt="" referrerpolicy="no-referrer">' : '<i class="mlv-av">🙂</i>') + '<span>Signed in as <b>' + esc(gUser.displayName || 'you') + '</b></span><button type="button" class="mlv-link-btn" data-out>Sign out</button>';
        $(acct, '[data-out]').onclick = function () { GAUTH.signOut().then(function () { gUser = null; paintAcct(); }); };
        if (!nameIn.value.trim() || nameIn.getAttribute('data-auto')) { nameIn.value = String(gUser.displayName || '').split(' ')[0].slice(0, 20); nameIn.setAttribute('data-auto', '1'); }
      } else {
        var savedName = esc(saved.name || nameIn.value || '');
        var savedClass = esc(window.MinestStudentAccount ? window.MinestStudentAccount.DEFAULT_CLASS : 'CHINESE');
        acct.innerHTML = '<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:18px;padding:12px 14px;margin:0 auto 12px;max-width:360px;text-align:left">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<span style="font-size:13px;font-weight:800;color:#60a5fa">🔑 班级云端存档 (换电脑不丢金币/装扮)</span>' +
          '<span style="font-size:10px;color:#94a3b8;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:6px">免邮箱</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:8px">' +
          '<div>' +
          '<label style="font-size:10px;color:#94a3b8;font-weight:700">你的名字</label>' +
          '<input type="text" data-pin-name placeholder="姓名 (如 Leo)" style="width:100%;box-sizing:border-box;margin-top:2px;padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:#fff;font-size:13px;font-weight:700" value="' + savedName + '">' +
          '</div>' +
          '<div>' +
          '<label style="font-size:10px;color:#94a3b8;font-weight:700">4位数字密码 (PIN)</label>' +
          '<input type="password" data-pin-code maxlength="4" placeholder="4位数字" style="width:100%;box-sizing:border-box;margin-top:2px;padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.3);color:#fff;font-size:13px;letter-spacing:0.2em;text-align:center;font-weight:700">' +
          '</div></div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">' +
          '<div style="font-size:10px;color:#64748b;display:flex;align-items:center;gap:4px">' +
          '<span>班级:</span>' +
          '<input type="text" data-pin-class value="' + savedClass + '" maxlength="10" style="width:65px;background:transparent;border:none;border-bottom:1px dashed #64748b;color:#93c5fd;font-size:11px;font-weight:700;text-align:center;text-transform:uppercase">' +
          '</div>' +
          '<button type="button" class="mlv-btn" data-pin-submit style="padding:5px 14px;font-size:12px;height:auto;border-radius:99px;background:#3b82f6;color:#fff;border:none;cursor:pointer">☁️ 登录 / 恢复存档</button>' +
          '</div>' +
          '<div data-pin-msg style="font-size:11px;margin-top:6px;display:none"></div>' +
          '</div>';

        var pSubmit = $(acct, '[data-pin-submit]');
        var pName = $(acct, '[data-pin-name]');
        var pCode = $(acct, '[data-pin-code]');
        var pClass = $(acct, '[data-pin-class]');
        var pMsg = $(acct, '[data-pin-msg]');

        function doPinLogin() {
          if (!window.MinestStudentAccount) return;
          var sName = (pName.value || '').trim();
          var sPin = (pCode.value || '').trim();
          var sClass = (pClass.value || '').trim();
          if (!sName) { showMsg('请填写你的名字', true); pName.focus(); return; }
          if (!sPin || sPin.length !== 4) { showMsg('请输入 4 位数字密码 (如 1234)', true); pCode.focus(); return; }
          pSubmit.disabled = true;
          showMsg('正在连接云端存档…', false);

          window.MinestStudentAccount.login(sClass, sName, sPin).then(function(res) {
            showMsg((res.isNew ? '🎉 欢迎新同学 ' : '🟢 欢迎回来 ') + sName + '！云端数据已恢复', false);
            nameIn.value = sName;
            var gc = $(o.body, '[data-gemct]');
            if (gc) gc.textContent = '💎 ' + gems();
            var myAv = String(localAv() || '').split('~')[0];
            $$(o.body, '[data-av]').forEach(function(btn){
              var id = btn.getAttribute('data-av');
              var own = ownsAv(id);
              btn.classList.toggle('lock', !own);
              var pr = btn.querySelector('.pr');
              if (own && pr) pr.remove();
              btn.classList.toggle('on', id === myAv);
            });
            setTimeout(function() { paintAcct(); }, 600);
          }).catch(function(err) {
            showMsg('⚠️ ' + (err.message || '登录失败'), true);
            pSubmit.disabled = false;
          });
        }

        function showMsg(text, isErr) {
          if (!pMsg) return;
          pMsg.style.display = 'block';
          pMsg.style.color = isErr ? '#f87171' : '#4ade80';
          pMsg.textContent = text;
        }

        if (pSubmit) pSubmit.onclick = doPinLogin;
        if (pCode) pCode.onkeydown = function(e) { if (e.key === 'Enter') doPinLogin(); };
      }
    }'''

for path in target_files:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # 1. Add MinestStudentAccount module before STUDENT section
    STUDENT_MARKER = '  // ================================================================== STUDENT'
    if STUDENT_MARKER in content and 'MinestStudentAccount' not in content:
        content = content.replace(STUDENT_MARKER, STUDENT_ACCOUNT_MODULE)
        changed = True

    # 2. Hook gems(add)
    if GEMS_HOOK_OLD in content:
        content = content.replace(GEMS_HOOK_OLD, GEMS_HOOK_NEW)
        changed = True

    # 3. Hook locker(L)
    if LOCKER_HOOK_OLD in content:
        content = content.replace(LOCKER_HOOK_OLD, LOCKER_HOOK_NEW)
        changed = True

    # 4. Replace paintAcct
    if PAINT_ACCT_OLD in content:
        content = content.replace(PAINT_ACCT_OLD, PAINT_ACCT_NEW)
        changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully patched {path}")
    else:
        print(f"No changes needed or markers not found in {path}")
