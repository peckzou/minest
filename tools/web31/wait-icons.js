  // the waiting-room tiles' pictures (31.7): flat cartoon drawings in one style instead of emoji
  var WAIT_ICONS = (function () {
    var EYE = function (x, y, r) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + (r * 1.15) + '" fill="#2f2a3d"/><circle cx="' + (x + r * .35) + '" cy="' + (y - r * .45) + '" r="' + (r * .4) + '" fill="#fff"/>'; };
    var BLUSH = function (x, y) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="3.2" ry="2" fill="#ff6b9a" opacity=".55"/>'; };
    var OCTO = function (c, d) {   // a round octopus: head, a skirt of five tentacles, a shine
      return '<path d="M13 31Q13 51 19.5 51Q24 51 24 45Q26 53 32 53Q38 53 40 45Q40 51 44.5 51Q51 51 51 31Z" fill="' + d + '"/>' +
        '<ellipse cx="32" cy="29" rx="19" ry="18" fill="' + c + '"/><path d="M20 20q5-8 14-8q-9 3-12 10z" fill="#fff" opacity=".45"/>';
    };
    var CROWN = function (x, y, k) { k = k || 1; return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><path d="M-9 4L-10-6-4.5-1 0-8 4.5-1 10-6 9 4z" fill="#fcd34d" stroke="#f59e0b" stroke-width="1.4" stroke-linejoin="round"/><circle cx="0" cy="1" r="1.6" fill="#f472b6"/><circle cx="-10" cy="-6" r="1.4" fill="#fde68a"/><circle cx="10" cy="-6" r="1.4" fill="#fde68a"/><circle cx="0" cy="-8" r="1.4" fill="#fde68a"/></g>'; };
    var LAV = '#c4b5fd', LAVD = '#a78bfa';
    function svg(body) { return '<svg class="wi" viewBox="0 0 64 64" aria-hidden="true">' + body + '</svg>'; }
    return {
      // the logo: Octo's face with its crown
      octo: svg(OCTO(LAV, LAVD) + CROWN(32, 11, 1) + EYE(25, 29, 3.4) + EYE(39, 29, 3.4) + BLUSH(20, 36) + BLUSH(44, 36) + '<path d="M28.5 37q3.5 3.4 7 0" fill="none" stroke="#2f2a3d" stroke-width="2.2" stroke-linecap="round"/>'),
      dive: svg(OCTO(LAV, LAVD) +
        '<path d="M12.5 27Q32 21 51.5 27" fill="none" stroke="#0ea5e9" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="19" y="20" width="26" height="15" rx="7" fill="#bae6fd" stroke="#0369a1" stroke-width="2.6"/>' + EYE(27, 28, 2.6) + EYE(37, 28, 2.6) +
        '<path d="M22 23l4-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M50 30Q55 24 54 9" fill="none" stroke="#f97316" stroke-width="4.4" stroke-linecap="round"/><rect x="50.5" y="5" width="7" height="5" rx="2" fill="#ea580c"/>' +
        BLUSH(22, 39) + BLUSH(42, 39) + '<path d="M29 41q3 2.6 6 0" fill="none" stroke="#2f2a3d" stroke-width="2" stroke-linecap="round"/>'),
      flap: svg('<ellipse cx="9" cy="26" rx="8" ry="11" fill="#fff" transform="rotate(-24 9 26)"/><ellipse cx="55" cy="26" rx="8" ry="11" fill="#fff" transform="rotate(24 55 26)"/>' +
        '<path d="M6 23l5 3M5 29l6 1M58 23l-5 3M59 29l-6 1" stroke="#cbd5e1" stroke-width="1.6" stroke-linecap="round"/>' +
        OCTO(LAV, LAVD) + CROWN(32, 12, .9) + EYE(25, 28, 3.2) + EYE(39, 28, 3.2) + BLUSH(20, 35) + BLUSH(44, 35) +
        '<path d="M28 36q4 4 8 0" fill="none" stroke="#2f2a3d" stroke-width="2.2" stroke-linecap="round"/>' +
        '<circle cx="54" cy="8" r="3.4" fill="#e0f2fe" stroke="#fff" stroke-width="1.2"/><circle cx="59" cy="15" r="2" fill="#e0f2fe"/>'),
      energy: svg('<path d="M37 3L13 37h16l-5 24 27-37H35z" fill="#fde047"/><path d="M37 3L13 37h7L42 3z" fill="#fff59d" opacity=".9"/><path d="M51 24L24 61l5-24h6z" fill="#facc15"/>' +
        EYE(28, 32, 2.6) + EYE(37, 30, 2.6) + BLUSH(25, 38) + BLUSH(41, 35) + '<path d="M30 38q3 2.4 6-1" fill="none" stroke="#2f2a3d" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M8 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM55 44l1.6 3.2 3.2 1.6-3.2 1.6L55 53.6l-1.6-3.2-3.2-1.6 3.2-1.6z" fill="#fff"/>'),
      bubble: svg('<circle cx="25" cy="37" r="17" fill="#bae6fd" fill-opacity=".55" stroke="#f0f9ff" stroke-width="2.6"/><path d="M14 31q3-9 12-11" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>' +
        '<circle cx="47" cy="21" r="10.5" fill="#a5f3fc" fill-opacity=".55" stroke="#f0f9ff" stroke-width="2.2"/><path d="M41 17q2-5 7-6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>' +
        '<circle cx="49" cy="46" r="6.5" fill="#c7d2fe" fill-opacity=".6" stroke="#f0f9ff" stroke-width="2"/><circle cx="46.5" cy="43.5" r="1.6" fill="#fff"/>' +
        EYE(21, 38, 2.2) + EYE(29, 38, 2.2) + '<path d="M23 44q2 1.8 4 0" fill="none" stroke="#2f2a3d" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M56 4l1.5 3 3 1.5-3 1.5L56 13l-1.5-3-3-1.5 3-1.5z" fill="#fff"/>'),
      chest: svg('<ellipse cx="32" cy="27" rx="20" ry="9" fill="#fde047" opacity=".7"/><path d="M17 26l-6-8M47 26l6-8M32 22V9M24 23l-3-8M40 23l3-8" stroke="#fff59d" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M10 30h44v21a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#b45309"/><path d="M10 30h44v6H10z" fill="#92400e"/>' +
        '<path d="M12 30L15 15Q32 9 49 15L52 30z" fill="#d97706"/><path d="M15 15Q32 9 49 15l1 4Q32 13 14 19z" fill="#f59e0b"/>' +
        '<rect x="18" y="30" width="5" height="25" fill="#fbbf24"/><rect x="41" y="30" width="5" height="25" fill="#fbbf24"/><rect x="27" y="36" width="10" height="9" rx="2" fill="#fde047"/><circle cx="32" cy="40.5" r="1.8" fill="#92400e"/>' +
        '<path d="M32 15l5 5-5 6-5-6z" fill="#22d3ee"/><path d="M32 15l5 5h-10z" fill="#a5f3fc"/>'),
      badges: svg('<path d="M17 3h11l7 23H24z" fill="#3b82f6"/><path d="M47 3H36l-7 23h11z" fill="#ef4444"/><path d="M17 3h4l7 23h-4z" fill="#60a5fa"/>' +
        '<circle cx="32" cy="41" r="17" fill="#f59e0b"/><circle cx="32" cy="41" r="13" fill="#fde047"/>' +
        '<path d="M32 31l3 6.2 6.8 1-4.9 4.7 1.2 6.7L32 46.4l-6.1 3.2 1.2-6.7-4.9-4.7 6.8-1z" fill="#f59e0b"/><path d="M22 35q3-6 9-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>')
    };
  })();
