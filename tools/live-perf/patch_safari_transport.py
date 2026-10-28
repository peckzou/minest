from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
FILES=['iPhone53.8241.html','iphone.html','index.html','iPhoneDuo.html','ipad.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html','ios/Minest/Minest/ipad.html','ios/MinestProject/MyApp/iphone.html']
old='    var db = firebase.firestore();\n    try {\n      db.enablePersistence'
new='''    var db = firebase.firestore();
    // WebKit 26.4+ may buffer Firestore stream completion frames indefinitely.
    // Configure before persistence/listeners; other browsers retain their transport.
    if (!db.__minestTransportChecked) {
      db.__minestTransportChecked = true;
      var ua = navigator.userAgent || '';
      var webkit = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua));
      if (webkit) try {
        db.settings({merge:true, experimentalAutoDetectLongPolling:false, experimentalForceLongPolling:true, useFetchStreams:false});
      } catch (transportError) { console.warn('Firestore compatibility transport unavailable:', transportError.code || 'already-started'); }
    }
    try {
      db.enablePersistence'''
for name in FILES:
 p=ROOT/name;s=p.read_text()
 if 'db.__minestTransportChecked' in s:continue
 assert s.count(old)==1,name
 p.write_text(s.replace(old,new))
