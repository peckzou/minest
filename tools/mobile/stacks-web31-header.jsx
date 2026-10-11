                          // iOS Notification Center Group Header (Expanded Stack)
                          hasStack && isStackExpanded ? (
                            (0, P.jsxs)('div', {
                              onClick: function(e) {
                                e.stopPropagation();
                                toggleStackExpand(col.id, card.id);
                                SoundEngine.play('slide');
                              },
                              style: { cursor: 'pointer' },
                              className: "ios-group-header select-none hover:opacity-90 transition-opacity",
                              children: [
                                (0, P.jsxs)('div', {
                                  className: "ios-group-header-left flex items-center gap-1.5",
                                  children: [
                                    (0, P.jsxs)('div', {
                                      className: "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium " +
                                        (isDark ? "bg-white/10 text-white/80 border border-white/10" : "bg-black/5 text-slate-700 border border-black/5"),
                                      children: [
                                        (0, P.jsxs)('svg', {
                                          className: "w-3 h-3 opacity-70",
                                          viewBox: "0 0 24 24",
                                          fill: "none",
                                          stroke: "currentColor",
                                          strokeWidth: "2",
                                          strokeLinecap: "round",
                                          strokeLinejoin: "round",
                                          children: [
                                            (0, P.jsx)('polygon', { points: "12 2 2 7 12 12 22 7 12 2" }),
                                            (0, P.jsx)('polyline', { points: "2 17 12 22 22 17" }),
                                            (0, P.jsx)('polyline', { points: "2 12 12 17 22 12" })
                                          ]
                                        }),
                                        (0, P.jsxs)('span', { children: [1 + stackCards.length, " cards"] })
                                      ]
                                    })
                                  ]
                                }),
                                (0, P.jsxs)('div', {
                                  className: "flex items-center gap-1.5 ml-auto",
                                  children: [
                                    (0, P.jsxs)('button', {
                                      type: "button",
                                      onClick: function(e) {
                                        e.stopPropagation();
                                        toggleStackExpand(col.id, card.id);
                                        SoundEngine.play('slide');
                                      },
                                      className: "ios-show-less-pill",
                                      title: "Show less",
                                      children: [
                                        (0, P.jsx)('svg', {
                                          className: "w-3 h-3 stroke-[2.5]",
                                          viewBox: "0 0 24 24",
                                          fill: "none",
                                          stroke: "currentColor",
                                          children: (0, P.jsx)('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
                                        }),
                                        (0, P.jsx)('span', { children: "Show less" })
                                      ]
                                    }),
                                    (0, P.jsx)('button', {
                                      type: "button",
                                      onClick: function(e) {
                                        e.stopPropagation();
                                        toggleStackExpand(col.id, card.id);
                                        SoundEngine.play('slide');
                                      },
                                      className: "ios-close-circle-btn",
                                      title: "Collapse stack",
                                      children: (0, P.jsx)('span', { className: "text-[11px] leading-none font-bold", children: "✕" })
                                    })
                                  ]
                                })
                              ]
                            })
                          ) : null,

