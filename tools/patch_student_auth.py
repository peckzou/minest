import os

target_files = [
    'iPhone53.8241.html',
    'iphone.html',
    'index.html',
    'ios/Minest/Minest/iphone.html',
    'ios/MinestProject/MyApp/iphone.html'
]

OLD_PAINT_ACCT = '''      } else {
        acct.innerHTML = '<button type="button" class="mlv-gbtn" data-gin><svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>Sign in with Google</button><div class="mlv-note" style="margin-top:6px">or just type a name below</div>';
        $(acct, '[data-gin]').onclick = function () {
          var b = this; b.disabled = true; err.textContent = '';
          GAUTH.signIn().then(function (r) { if (r && r.user) { gUser = r.user; paintAcct(); } }).catch(function (e) { err.textContent = window.__minestAuthError ? window.__minestAuthError(e) + ' You can still join as a guest.' : 'Google sign-in did not finish. You can still join as a guest.'; }).then(function () { b.disabled = false; });
        };
      }'''

NEW_PAINT_ACCT = '''      } else {
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
      }'''

OLD_ROW = '<div class="mlv-row" style="justify-content:center"><button class="mlv-btn" data-join>Join</button></div><div class="mlv-err" data-err></div></section>'

NEW_ROW = '''<div class="mlv-row" style="justify-content:center"><button class="mlv-btn" data-join>Join</button></div><div class="mlv-err" data-err></div>' +
      '<div style="margin-top:14px;border-top:1px dashed rgba(255,255,255,0.12);padding-top:12px">' +
      '<button type="button" class="mlv-btn alt" data-solo-start style="font-size:13px;padding:8px 18px;background:rgba(255,255,255,0.08);color:#cbd5e1;border:1px solid rgba(255,255,255,0.15)">🎮 没有房间码？直接单人练习闯关</button>' +
      '</div></section>'''

OLD_HOOK = '''nameIn.onkeydown = codeIn.onkeydown = function (e) { if (e.key === 'Enter') go(); };'''

NEW_HOOK = '''nameIn.onkeydown = codeIn.onkeydown = function (e) { if (e.key === 'Enter') go(); };
    var soloBtn = $(o.body, '[data-solo-start]');
    if (soloBtn) {
      soloBtn.onclick = function () {
        o.close();
        if (window.StudyArcade && typeof window.StudyArcade.open === 'function') {
          var b = (window.MinestAI && window.MinestAI.board) ? window.MinestAI.board() : null;
          window.StudyArcade.open(b);
        } else if (window.returnToStudentGame) {
          window.returnToStudentGame();
        }
      };
    }'''

for path in target_files:
    if not os.path.exists(path):
        print(f"Skipping {path} (not found)")
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    if OLD_PAINT_ACCT in content:
        content = content.replace(OLD_PAINT_ACCT, NEW_PAINT_ACCT)
        changed = True
    else:
        print(f"Warning: OLD_PAINT_ACCT not found in {path}")

    if OLD_ROW in content:
        content = content.replace(OLD_ROW, NEW_ROW)
        changed = True
    else:
        print(f"Warning: OLD_ROW not found in {path}")

    if OLD_HOOK in content:
        content = content.replace(OLD_HOOK, NEW_HOOK)
        changed = True
    else:
        print(f"Warning: OLD_HOOK not found in {path}")

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Successfully patched {path}")
    else:
        print(f"No changes made to {path}")
