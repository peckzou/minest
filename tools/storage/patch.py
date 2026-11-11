from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
files=['iphone.html','index.html','iPhone53.8241.html','iPhoneDuo.html','ipad.html','web31.0.html','web31.1.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
for name in files:
 p=root/name;s=p.read_text()
 # Workspace sync metadata must not block every data upload when localStorage is full.
 a=s.find('var namesKey =');b=s.find('}());',a) if a>=0 else -1
 block=s[a:b].replace('localStorage.getItem(', '(window.MinestDurableStorage||localStorage).getItem(').replace('localStorage.setItem(', '(window.MinestDurableStorage||localStorage).setItem(')
 if a>=0:s=s[:a]+block+s[b:]
 s=s.replace("function minestCloudMark(k, v) { try { localStorage.setItem(k, String(v));", "function minestCloudMark(k, v) { try { (window.MinestDurableStorage||localStorage).setItem(k, String(v));")
 s=s.replace("function minestCloudNum(k) { try { return Number(localStorage.getItem(k))", "function minestCloudNum(k) { try { return Number((window.MinestDurableStorage||localStorage).getItem(k))")
 # Wait for durable Routine recovery and pending commits before serializing a cloud payload.
 s=s.replace('\nfunction minestCloudPayload(boards, extra) {', '\nasync function minestCloudPayload(boards, extra) {\n  if(window.MinestDurableStorage)await window.MinestDurableStorage.ready;\n  if(window.MinestRoutine&&window.MinestRoutine.flush)await window.MinestRoutine.flush();')
 s=s.replace('GlassUI.toast("⚠️ " + err.message + " Changes are kept on this device.");', 'if(window.MinestSyncManagement)window.MinestSyncManagement.reportSyncError(err);')
 s=s.replace("GlassUI.toast(\"☁️ Cloud sync did not go through (\" + ((err && (err.code || err.message)) || 'offline') + \"). Your changes are kept on this device and will be sent again.\");", 'if(window.MinestSyncManagement)window.MinestSyncManagement.reportSyncError(err);')
 s=s.replace('window.__minestCloudFailWarned = false;\n          setLastSyncTime', 'window.__minestCloudFailWarned = false;if(window.MinestSyncManagement)window.MinestSyncManagement.clearSyncError();\n          setLastSyncTime')
 s=s.replace('sentAt = minestCloudNum(MINEST_CLOUD_DIRTY);', 'sentAt = minestCloudNum(MINEST_CLOUD_DIRTY), uploadSucceeded = false;')
 s=s.replace('}).then(function() {\n          if (sentAt > minestCloudNum(MINEST_CLOUD_ACK))', '}).then(function() {\n          uploadSucceeded = true;\n          if (sentAt > minestCloudNum(MINEST_CLOUD_ACK))')
 s=s.replace('setSyncStatus("error");\n      if (err && err.tooLarge)', 'setSyncStatus("error");\n      if(window.MinestSyncManagement)window.MinestSyncManagement.reportSyncError(err);\n      if (err && err.tooLarge)')
 # A request being settled must not consume the only wake-up for a later edit.
 s=s.replace('cloudInFlightRef.current = null;\n        });', 'cloudInFlightRef.current = null;\n          if(uploadSucceeded&&minestCloudUnsynced())setTimeout(function(){setCloudKick(function(k){return k+1;});},1000);\n        });')
 if '<script id="mn-routine-run">' in s:
  a=s.index('<script id="mn-routine-run">');b=s.index('</script>',a);block=s[a:b]
  block=block.replace('var durable = window.MinestRoutineHostStore(', 'var durable = window.MinestDurable.routine(')
  block=block.replace('envelope:window.MinestRoutineEnvelope,storage:', 'envelope:window.MinestRoutineEnvelope,database:window.MinestDurableStorage.database,status:saveStatus,storage:')
  insert="""  var saveStatus = window.MinestSaveIndicator(function(text){
    if(window.MinestSyncManagement)window.MinestSyncManagement.reportLocalSave('routine',text);
  });
"""
  if 'function saveStatus(' in block:
   start=block.index('  function saveStatus(');end=block.index('  var actor;',start);block=block[:start]+insert+block[end:]
  elif 'var saveStatus = ' in block:
   start=block.index('  var saveStatus = ');end=block.index('  var actor;',start);block=block[:start]+insert+block[end:]
  else:block=block.replace('  var actor;',insert+'  var actor;')
  block=block.replace("document.getElementById('mn-routine-save-status')&&!document.getElementById('mn-routine-save-status').hidden", "durable.isSaving()")
  block=block.replace('  function open() {','  async function open() {\n    try{await durable.ready;}catch(e){saveStatus({error:e.message});return;}')
  block=block.replace('pending:durable.pending, confirm:durable.mergeCloud, _merge:', 'pending:durable.pending, confirm:durable.mergeCloud, ready:durable.ready, flush:durable.flush, _merge:')
  if 'beforeunload' not in block:block=block.replace('  var store = ', "  window.addEventListener('beforeunload',function(e){if(durable.isSaving()){e.preventDefault();e.returnValue='';}});\n  var store = ")
  s=s[:a]+block+s[b:]
 p.write_text(s)
