:root{--bg:#090f1f;--panel:#111a2d;--panel2:#15223a;--border:rgba(173,190,220,.22);--text:#edf3ff;--muted:#8e9db9;--blue:#4388ff;--cyan:#42d1c8;--green:#4ad4a5;--purple:#a98aff;--orange:#ffb35e;--red:#ff657b}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:15px;line-height:1.55}button,input,select{font:inherit}button,a,select,input{outline-offset:3px}button{cursor:pointer}.app-shell{display:flex;min-height:100vh}.sidebar{width:250px;flex:0 0 250px;background:#0d1527;border-right:1px solid var(--border);padding:25px 17px;display:flex;flex-direction:column;gap:25px}.brand{display:flex;align-items:center;gap:12px;color:inherit;text-decoration:none;padding:4px}.brand-mark{width:43px;height:43px}.brand-mark svg,.splash-logo svg{width:100%;height:100%;fill:none;stroke:var(--blue);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.brand-copy strong{display:block;font-size:17px;letter-spacing:-.4px}.brand-copy em{color:var(--blue);font-style:normal}.brand-copy small{font-size:9px;color:var(--muted);letter-spacing:1.8px}.workspace-label,.eyebrow{font-size:11px;letter-spacing:2px;font-weight:800;color:var(--muted)}.workspace-label{padding:0 11px}.nav-menu{display:grid;gap:7px}.nav-link{display:flex;align-items:center;gap:12px;padding:12px;border-radius:12px;text-decoration:none;color:var(--muted);font-weight:650}.nav-link.active,.nav-link:hover{color:var(--text);background:#1a2a47}.nav-link.active{box-shadow:inset 3px 0 var(--blue)}.nav-icon{width:22px;text-align:center;font-size:18px}.nav-live-dot,.status-dot,.footer-live-dot{width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block}.nav-live-dot{margin-left:auto}.sidebar-bottom{margin-top:auto}.device-mini{border:1px solid var(--border);background:var(--panel);padding:14px;border-radius:14px}.device-mini-top,.device-mini-foot{display:flex;align-items:center;justify-content:space-between;gap:7px;font-size:10px;color:var(--muted)}.device-online{color:var(--green)}.device-mini>strong{display:block;margin:13px 0}.device-meter,.progress-track,.splash-loader{height:5px;background:#293750;border-radius:9px;overflow:hidden}.device-meter span{display:block;width:25%;height:100%;background:var(--blue)}.device-mini-foot{margin-top:12px}.sidebar-footer{margin-top:18px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:8px}.version{margin-left:auto}.main-content{min-width:0;flex:1}.topbar{height:80px;padding:0 30px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:15px}.breadcrumb,.topbar-actions{display:flex;align-items:center;gap:15px}.breadcrumb{color:var(--muted)}.breadcrumb strong{color:var(--text)}.topbar-actions{gap:12px}.live-pill{display:flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:30px;padding:8px 12px;font-size:10px;font-weight:800;letter-spacing:1px;color:var(--green)}.live-pill.offline{color:var(--red)}.icon-button{border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:12px;width:42px;height:42px}.avatar{background:#25405c;border:1px solid #456780;border-radius:12px;padding:10px;font-weight:800}.mobile-menu{display:none}.content-wrap{max-width:1400px;margin:auto;padding:30px}.welcome-row{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:24px}.eyebrow{display:flex;align-items:center;gap:10px}.eyebrow-line{height:3px;width:26px;background:var(--blue);border-radius:3px}h1{font-size:clamp(29px,4vw,43px);letter-spacing:-1.8px;line-height:1.15;margin:15px 0 10px}h1 span{color:var(--blue)}h2{font-size:21px;letter-spacing:-.5px;margin:5px 0 0}.subheading{color:var(--muted);margin:0}.welcome-actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:10px}.last-updated{width:100%;text-align:right;font-size:12px;color:var(--muted)}.last-updated strong{color:var(--text)}.button{border:1px solid var(--border);border-radius:12px;padding:12px 17px;min-height:44px;font-weight:750;color:var(--text);background:var(--panel)}.button-primary{background:linear-gradient(120deg,#347df5,#3868df);border-color:#4d86fa}.button-secondary:hover,.icon-button:hover{border-color:var(--blue)}.refresh-symbol{font-size:19px;margin-right:7px}.demo-banner{display:flex;align-items:flex-start;gap:14px;padding:17px 19px;border:1px solid #557ab3;border-radius:15px;background:#13203a;margin-bottom:25px;color:#d9e7ff}.demo-banner-icon{font-size:21px;color:#7eb9ff}.demo-banner div{display:grid;gap:3px;flex:1}.demo-banner span{font-size:13px;color:#9fb0cd}.demo-banner strong{font-size:14px}.demo-banner button{border:0;background:transparent;color:var(--muted);font-size:23px}.metric-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-bottom:20px}.metric-card,.panel{min-width:0;background:var(--panel);border:1px solid var(--border);border-radius:21px;padding:24px}.metric-heading,.metric-main,.panel-header{display:flex;align-items:center}.metric-heading{justify-content:space-between;color:var(--muted);font-size:11px;font-weight:800;letter-spacing:1.6px}.metric-icon{display:grid;place-items:center;width:43px;height:43px;border-radius:14px;font-size:21px}.icon-blue{background:#18345a;color:#86b8ff}.icon-purple{background:#30234e;color:var(--purple)}.icon-cyan{background:#103d40;color:var(--cyan)}.icon-orange{background:#483321;color:var(--orange)}.metric-main{gap:8px;margin:15px 0 17px;flex-wrap:wrap}.metric-main>strong{font-size:clamp(36px,5vw,56px);line-height:1;letter-spacing:-2px}.metric-unit,.trend{color:var(--muted)}.trend{margin-left:auto;font-size:12px}.metric-bottom{display:grid;gap:10px}.progress-track span{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--blue),var(--cyan));transition:width .5s}.metric-caption{font-size:12px;color:var(--muted)}.sparkline{display:flex;align-items:end;gap:6px;height:36px;margin:4px 0 10px}.sparkline i{display:block;flex:1;border-radius:4px 4px 0 0;background:var(--blue)}.spark-cyan i{background:var(--cyan)}.loss-visual{display:flex;gap:5px;margin:18px 0}.loss-visual span{height:10px;flex:1;border-radius:3px;background:#293750}.primary-grid,.secondary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-bottom:20px}.panel-header{justify-content:space-between;gap:12px;margin-bottom:23px}.text-button,.more-button{border:0;background:transparent;color:var(--muted);font-weight:700}.text-button span{margin-left:8px}.network-list{display:grid;gap:7px}.network-row{display:grid;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:12px;padding:13px 10px;border:1px solid transparent;border-bottom-color:var(--border);border-radius:12px;cursor:pointer}.network-row.selected{background:#1a2a47;border-color:#284a78}.network-symbol{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#1b2d49;font-weight:850;color:#85b9ff}.signal-5g{color:var(--purple);background:#30234e}.signal-sat{color:var(--orange);background:#493322}.signal-wan{color:var(--cyan);background:#153a3c}.network-info strong,.network-info small,.network-quality strong,.network-quality span{display:block}.network-info small,.quality-label{font-size:11px;color:var(--muted)}.network-quality{text-align:right}.network-quality strong{font-size:14px}.network-quality small{font-weight:400;color:var(--muted)}.network-bars,.selected-check{display:none}.panel-footnote{border-top:1px solid var(--border);margin-top:17px;padding-top:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--muted)}.panel-footnote strong{color:var(--text)}.footnote-right{width:100%;padding-left:18px}.score-gauge{width:min(100%,330px);margin:0 auto;display:block}.gauge-number{font-size:43px;font-weight:800;fill:var(--text)}.gauge-caption{fill:var(--muted);font-size:10px;letter-spacing:1.5px}.score-label{text-align:center;color:var(--muted);margin:5px 0 22px}.score-bars{display:grid;gap:14px}.score-bar-row{display:grid;grid-template-columns:105px minmax(40px,1fr) 42px;align-items:center;gap:10px;font-size:12px;color:var(--muted)}.score-bar-row .progress-track{height:7px}.score-bar-row strong{text-align:right;color:var(--text)}.chart-wrap{overflow:hidden}.chart-svg{width:100%;height:auto;display:block}.chart-disclaimer{font-size:12px;color:var(--muted);margin-top:12px}.chart-labels{display:flex;justify-content:space-between;font-size:10px;color:var(--muted);gap:5px}.event-list{display:grid}.event-item{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)}.event-icon{width:37px;height:37px;border-radius:12px;display:grid;place-items:center;background:#183b37;color:var(--green);font-weight:800}.event-copy{min-width:0;flex:1}.event-copy strong,.event-copy small{display:block}.event-copy strong{font-size:13px}.event-copy small{font-size:11px;color:var(--muted);overflow-wrap:anywhere}.event-item time{font-size:10px;color:var(--muted)}.empty-events{color:var(--muted);padding:20px 0}.sim-panel{margin-bottom:22px}.sim-badge{font-size:10px;letter-spacing:1px;color:var(--cyan);background:#123a3a;border-radius:20px;padding:7px 10px;white-space:nowrap}.sim-intro{max-width:780px;color:var(--muted);font-size:13px}.sim-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:9px 15px;max-width:760px;margin-top:20px}.sim-form label{font-size:12px;color:var(--muted);font-weight:700}.sim-form input,.sim-form select{width:100%;min-width:0;min-height:48px;background:#0c1426;border:1px solid var(--border);border-radius:11px;color:var(--text);padding:10px 13px;font-size:16px}.sim-form button,.sim-message,.sim-privacy{grid-column:1/-1}.sim-form button{justify-self:start;margin-top:5px}.sim-privacy,.sim-message{font-size:12px;color:var(--muted);margin:0}.sim-notice{display:grid;gap:4px;border-left:3px solid var(--blue);background:#14223a;padding:13px 15px;margin-top:20px;border-radius:0 10px 10px 0;font-size:12px}.sim-notice span{color:var(--muted)}.page-footer{border-top:1px solid var(--border);padding:24px 4px 8px;display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;color:var(--muted);font-size:12px}.page-footer>div{display:flex;align-items:center;gap:9px}.page-footer strong{color:var(--text)}.footer-brand-mark{border:1px solid var(--border);border-radius:8px;padding:5px 7px;color:#9bc3ff}.footer-live-dot{background:var(--green)}.toast{position:fixed;bottom:20px;left:50%;transform:translate(-50%,20px);opacity:0;pointer-events:none;background:#eaf1ff;color:#101a2c;border-radius:12px;padding:12px 17px;max-width:calc(100% - 30px);z-index:10000;font-size:13px;box-shadow:0 8px 35px #0005;transition:.25s}.toast.show{opacity:1;transform:translate(-50%,0)}.test-overlay{position:fixed;inset:0;background:#050a16eF;display:grid;place-items:center;padding:20px;z-index:5000}.test-overlay[hidden]{display:none}.test-dialog{width:min(100%,420px);background:var(--panel);border:1px solid var(--border);border-radius:22px;padding:30px;text-align:center}.test-orbit{margin:0 auto 22px;width:68px;height:68px;border:2px solid #335b96;border-radius:50%;display:grid;place-items:center;color:var(--cyan);font-size:35px;animation:orbit-pulse 1.8s ease-in-out infinite}.test-progress{height:7px;background:#293750;border-radius:9px;overflow:hidden;margin:22px 0 9px}.test-progress span{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--blue),var(--cyan));transition:width .25s}.test-progress-meta{display:flex;justify-content:space-between;color:var(--muted);font-size:12px;margin-bottom:20px}.splash-screen{position:fixed;inset:0;z-index:20000;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at 50% 43%,#182c50 0,#0b1224 45%,#060a14 100%);transition:opacity .65s ease,visibility .65s ease}.splash-hidden{opacity:0;visibility:hidden;pointer-events:none}.splash-logo{width:92px;height:92px;position:relative;z-index:1;animation:logo-enter 1.1s cubic-bezier(.2,.8,.2,1) both,logo-float 3s 1.1s ease-in-out infinite;filter:drop-shadow(0 0 20px #4388ff55)}.splash-logo svg{stroke-width:2}.splash-name{font-size:30px;font-weight:850;letter-spacing:-1px;margin-top:20px;animation:fade-up .7s .25s both}.splash-name span{color:var(--blue)}.splash-screen p{font-size:10px;letter-spacing:3px;color:#9aaccb;margin:8px 0 30px;animation:fade-up .7s .4s both}.splash-loader{width:150px;height:3px;background:#263653;animation:fade-up .7s .5s both}.splash-loader span{display:block;width:35%;height:100%;background:linear-gradient(90deg,var(--blue),var(--cyan));animation:loader-sweep 1.3s ease-in-out infinite}.splash-screen>small{font-size:9px;letter-spacing:2px;color:#7184a6;margin-top:15px;animation:fade-up .7s .6s both}.splash-orbit{position:absolute;width:270px;height:270px;border:1px solid #4776b426;border-radius:50%;animation:orbit-rotate 12s linear infinite}.orbit-one:before,.orbit-two:before{content:"";position:absolute;width:7px;height:7px;border-radius:50%;background:var(--cyan);top:30px;left:35px;box-shadow:0 0 18px var(--cyan)}.orbit-two{width:350px;height:350px;border-style:dashed;animation-direction:reverse;animation-duration:25s}.orbit-two:before{background:var(--blue);top:auto;left:auto;right:30px;bottom:80px;box-shadow:0 0 18px var(--blue)}@keyframes logo-enter{from{opacity:0;transform:scale(.55) rotate(-20deg)}to{opacity:1;transform:scale(1) rotate(0)}}@keyframes logo-float{0%,100%{translate:0 0}50%{translate:0 -7px}}@keyframes fade-up{from{opacity:0;translate:0 10px}to{opacity:1;translate:0 0}}@keyframes loader-sweep{0%{transform:translateX(-110%)}100%{transform:translateX(400%)}}@keyframes orbit-rotate{to{transform:rotate(360deg)}}@keyframes orbit-pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 #4388ff00}50%{transform:scale(1.05);box-shadow:0 0 25px #4388ff22}}body.light-theme{--bg:#eef3fb;--panel:#fff;--panel2:#f5f8ff;--border:rgba(57,76,112,.2);--text:#17243b;--muted:#64738d}body.light-theme .sidebar{background:#f6f8fd}body.light-theme .demo-banner,body.light-theme .sim-notice{background:#edf4ff;color:#1d3558}body.light-theme .sim-form input,body.light-theme .sim-form select{background:#f7f9fd;color:#17243b}@media(min-width:1100px){.metric-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.primary-grid{grid-template-columns:1.05fr .95fr}}@media(max-width:900px){.sidebar{width:220px;flex-basis:220px}.content-wrap{padding:23px}.welcome-row{align-items:flex-start;flex-direction:column}.welcome-actions{justify-content:flex-start}.last-updated{text-align:left}.primary-grid,.secondary-grid{grid-template-columns:1fr}.topbar{padding:0 22px}}@media(max-width:640px){.sidebar{position:fixed;z-index:4000;inset:0 auto 0 0;transform:translateX(-105%);transition:transform .25s;box-shadow:20px 0 40px #0005}.sidebar.open{transform:translateX(0)}.mobile-menu{display:block;flex-shrink:0}.topbar{height:68px;padding:0 14px}.breadcrumb{gap:8px;font-size:12px}.topbar-actions{gap:7px}.live-pill{font-size:0;padding:10px}.live-pill .status-dot{width:9px;height:9px}.avatar{padding:8px;font-size:12px}.content-wrap{padding:22px 14px}.metric-grid{grid-template-columns:1fr;gap:13px}.metric-card,.panel{padding:19px;border-radius:18px}.welcome-actions{width:100%;justify-content:stretch}.welcome-actions .button{flex:1;padding:11px 9px;font-size:12px}.network-row{grid-template-columns:39px minmax(0,1fr) auto;gap:9px;padding:12px 7px}.network-symbol{width:37px;height:37px}.network-info strong{font-size:13px}.network-info small{font-size:10px}.network-quality strong{font-size:13px}.sim-form{grid-template-columns:1fr}.sim-form label{margin-top:5px}.sim-form button{width:100%}.page-footer{font-size:11px}.page-footer>div{flex-wrap:wrap}.splash-logo{width:80px;height:80px}.splash-name{font-size:27px}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}

/* IntelliLink X1 identity and per-visitor probe */
.splash-tagline{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;font-size:clamp(14px,3.6vw,17px)!important;font-weight:500;letter-spacing:.045em!important;text-transform:none;color:#dbe8ff!important;margin:6px 0 10px!important;text-align:center;animation:fade-up .8s .34s both;text-shadow:0 0 22px #4b8dff30}.splash-kicker{margin:0 0 26px!important;font-size:9px!important;letter-spacing:2.5px!important}.browser-monitor-panel{margin:0 0 22px}.browser-probe-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:18px 0}.browser-probe-grid article{min-width:0;padding:15px;border:1px solid var(--border);background:var(--panel2);border-radius:13px;display:grid;align-content:start;gap:6px}.browser-probe-grid small,.browser-probe-grid span{font-size:11px;color:var(--muted)}.browser-probe-grid strong{font-size:20px;line-height:1.25;overflow-wrap:anywhere}.browser-probe-actions{display:flex;align-items:center;gap:13px;flex-wrap:wrap}.browser-probe-actions>span{font-size:12px;color:var(--muted);overflow-wrap:anywhere}.browser-probe-actions button:disabled{opacity:.7;cursor:progress}.sim-notice{overflow-wrap:anywhere}@media(max-width:640px){.browser-probe-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.browser-probe-grid article{padding:13px}.browser-probe-grid strong{font-size:18px}}


/* v0.1.3 visual consistency fixes: class names used by the current index.html */
.device-dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:var(--green);box-shadow:0 0 10px #4ad4a577}
.device-mini-top{display:flex;align-items:center;gap:7px}
.device-mini-top>span:nth-child(2){flex:1}
.metric-card{overflow:hidden}
.metric-card .metric-caption{display:block;margin-top:10px}
.metric-main .trend{white-space:nowrap}
.network-info{min-width:0;overflow-wrap:anywhere}
.network-info small{display:block;color:var(--muted);font-size:12px}
.network-quality{min-width:74px}
.quality-label{display:block;margin-top:5px;font-size:11px;line-height:1.35}
.quality-good{color:var(--green)}
.quality-muted{color:var(--muted)}
.network-row.selected .selected-check{display:block;color:var(--blue);font-weight:900}
.network-row.selected{grid-template-columns:44px minmax(0,1fr) auto 13px}
.network-bars{display:none}
.score-gauge{position:relative;width:min(100%,360px);height:auto;aspect-ratio:220/150;margin:4px auto 0}
.score-gauge>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.gauge-track,.gauge-progress{fill:none;stroke-width:13;stroke-linecap:round}
.gauge-track{stroke:#2b3850}
.gauge-progress{stroke:url(#gaugeGradient);transition:stroke-dasharray .5s ease}
.gauge-value{position:absolute;left:0;right:0;bottom:2%;display:flex;flex-direction:column;align-items:center;gap:3px}
.gauge-value strong{font-size:clamp(30px,4vw,48px);font-weight:800;letter-spacing:-1.5px;line-height:1}
.gauge-value span{font-size:10px;letter-spacing:1.6px;color:var(--muted)}
.score-status{display:flex;justify-content:center;align-items:center;gap:9px;flex-wrap:wrap;margin:10px 0 22px;color:var(--muted);font-size:13px}
.score-status strong{color:var(--green);font-size:14px}
.status-pulse{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 12px #4ad4a555}
.score-breakdown{display:grid;gap:14px}
.score-breakdown>div{display:grid;grid-template-columns:115px minmax(40px,1fr) 38px;align-items:center;gap:10px;color:var(--muted);font-size:12px}
.score-breakdown b{font-size:12px;text-align:right;color:var(--text)}
.mini-track{height:7px;border-radius:10px;background:#283650;overflow:hidden}
.mini-track span{display:block;height:100%;width:0;border-radius:10px;background:var(--blue);transition:width .4s}
.purple-track span{background:var(--purple)}
.cyan-track span{background:var(--cyan)}
.score-info{display:flex;align-items:flex-start;gap:8px;color:var(--muted);font-size:11px;margin-top:20px;line-height:1.5}
.score-info>span{color:#83b9ff}
.chart-legend{display:flex;flex-wrap:wrap;gap:18px;color:var(--muted);font-size:12px;margin:0 0 18px}
.chart-legend>span{display:flex;align-items:center;gap:7px}
.legend-dot{width:9px;height:9px;border-radius:50%;display:inline-block}
.dot-latency{background:#638dff}.dot-speed{background:#40d7cc}
.chart-area{display:grid;grid-template-columns:29px minmax(0,1fr);gap:9px;min-width:0}
.chart-y-axis{display:flex;flex-direction:column;justify-content:space-between;padding:3px 0 19px;font-size:10px;color:var(--muted);text-align:right}
.chart-plot{position:relative;min-width:0;min-height:185px;padding-bottom:24px}
.chart-gridlines{position:absolute;inset:0 0 24px;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}
.chart-gridlines i{border-top:1px dashed #58677f66;width:100%}
.line-chart{position:absolute;inset:0 0 24px;width:100%;height:calc(100% - 24px);overflow:visible}
.chart-x-axis{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;gap:3px;color:var(--muted);font-size:10px;white-space:nowrap}
.chart-x-axis span{min-width:0}
.chart-disclaimer{line-height:1.5;overflow-wrap:anywhere}
.splash-screen{isolation:isolate}
.splash-logo{will-change:transform,opacity}
.splash-tagline{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;font-weight:550;letter-spacing:.04em!important;font-size:clamp(14px,3.6vw,18px)!important;color:#dbe8ff!important;text-transform:none!important;text-align:center;text-shadow:0 0 20px #4388ff40}
.splash-orbit{pointer-events:none}
.sound-toggle{font-size:17px;display:grid;place-items:center}
.sound-toggle:focus-visible,.button:focus-visible,.icon-button:focus-visible{outline:2px solid var(--cyan)}
#runTestBtn{min-width:150px}
#runDiagnosticsBtn{white-space:nowrap}
#settingsPanel{scroll-margin-top:20px}
#simPhone::placeholder{color:#7586a3;opacity:1}
.sim-panel{border-color:#3b5f91;box-shadow:inset 0 1px 0 #6c9bdf12}
.sim-form label{display:block}
.sim-form input:focus,.sim-form select:focus{border-color:var(--blue)}
.splash-screen p.splash-tagline{margin:6px 0 9px!important;letter-spacing:.04em!important;font-size:clamp(14px,3.6vw,18px)!important}
@media(max-width:1100px){
  .app-shell{display:block}
  .sidebar{position:fixed;z-index:9000;inset:0 auto 0 0;width:min(82vw,285px);max-width:285px;flex-basis:auto;overflow-y:auto;transform:translateX(-105%);transition:transform .25s ease;box-shadow:20px 0 40px #0005}
  .sidebar.open{transform:translateX(0)}
  .main-content{width:100%;min-width:0}
  .mobile-menu{display:block;flex-shrink:0}
  .primary-grid,.secondary-grid{grid-template-columns:minmax(0,1fr)}
  .metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .topbar{padding:0 16px}
  .content-wrap{padding:22px clamp(14px,3vw,28px)}
  .sidebar-footer{padding-bottom:20px}
}
@media(max-width:640px){
  .metric-grid{grid-template-columns:1fr}
  .metric-card,.panel{padding:18px}
  .welcome-actions{display:flex;flex-wrap:wrap;justify-content:stretch;gap:8px}
  .welcome-actions .last-updated{flex-basis:100%}
  .welcome-actions .button{flex:1 1 calc(50% - 8px);min-width:0;white-space:normal}
  #runTestBtn,#runDiagnosticsBtn{min-width:0}
  .topbar-actions{gap:5px}
  .breadcrumb span:first-child,.breadcrumb b{display:none}
  .browser-probe-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .network-row{grid-template-columns:38px minmax(0,1fr) auto;gap:8px}
  .network-row.selected{grid-template-columns:38px minmax(0,1fr) auto}
  .network-row.selected .selected-check{display:none}
  .network-quality{min-width:66px}
  .network-info small{font-size:10px}
  .score-breakdown>div{grid-template-columns:95px minmax(30px,1fr) 35px;gap:8px}
  .gauge-value strong{font-size:38px}
  .sim-form{grid-template-columns:1fr}
  .sim-form label{margin-top:4px}
  .sim-form button{width:100%}
  .panel-header{align-items:flex-start}
  .panel-header h2{font-size:19px}
  .chart-area{grid-template-columns:25px minmax(0,1fr);gap:6px}
  .chart-plot{min-height:165px}
}
@media(prefers-reduced-motion:reduce){.splash-logo,.splash-orbit,.splash-loader span,.test-orbit{animation:none!important}}
  // ==========================================
  // UPDATE MINI METRICS
  // ==========================================

  function updateMiniMetric(selector, value) {
    const node = $(selector);
    if (!node) return;

    const number = numeric(value);

    if (number === null) {
      node.textContent = '—';
      return;
    }

    node.textContent = String(number);
  }

  // ==========================================
  // NETWORK ROWS
  // ==========================================

  function updateNetworkRows(metrics) {
    const rows = $$('.network-row');

    rows.forEach(row => {
      const networkName = row.dataset.network;
      const active = networkName === metrics.network;

      row.classList.toggle('selected', active);
      row.setAttribute('aria-pressed', String(active));

      const scoreNode = $('.network-quality strong', row);
      const qualityNode = $('.quality-label', row);

      if (scoreNode) {
        const score = numeric(metrics.score);

        scoreNode.replaceChildren();

        const scoreText = document.createElement('span');
        scoreText.textContent = score === null
          ? '—'
          : String(Math.round(score));

        const suffix = document.createElement('small');
        suffix.textContent = ' /100';

        scoreNode.append(scoreText, suffix);
      }

      if (qualityNode) {
        const score = numeric(metrics.score);

        if (!active || score === null) {
          qualityNode.textContent = active
            ? 'Score unavailable'
            : 'No live reading';

          qualityNode.classList.add('quality-muted');
        } else {
          qualityNode.textContent = display(
            metrics.quality,
            score >= 85
              ? 'Excellent'
              : score >= 70
                ? 'Good'
                : score >= 50
                  ? 'Fair'
                  : 'Poor'
          );

          qualityNode.classList.remove('quality-muted');
        }
      }

      const bars = $$('.network-bars i', row);

      bars.forEach((bar, index) => {
        const score = numeric(metrics.score);
        const activeBars = score === null
          ? 0
          : Math.round((score / 100) * bars.length);

        bar.classList.toggle(
          'off',
          !active || index >= activeBars
        );
      });
    });

    setText(
      '#suggestionText',
      metrics.network || 'No recommendation',
      'No recommendation'
    );
  }

  // ==========================================
  // APPLY API SNAPSHOT
  // ==========================================

  function applySnapshot(rawSnapshot, rawScore = null) {
    const snapshot = objectValue(
      rawSnapshot,
      ['snapshot', 'network', 'data', 'result']
    );

    state.lastSnapshot = snapshot;
    state.lastScore = rawScore
      ? objectValue(rawScore, ['score', 'data', 'result'])
      : null;

    const metrics = currentMetrics();

    const score = numeric(metrics.score);
    const latency = numeric(metrics.latency);
    const jitter = numeric(metrics.jitter);
    const loss = numeric(metrics.loss);
    const download = numeric(metrics.download);

    // Network health
    setText(
      '#healthScore',
      score === null ? null : Math.round(score)
    );

    setText(
      '#gaugeScore',
      score === null ? null : Math.round(score)
    );

    const healthBar = $('#healthBar');

    if (healthBar) {
      healthBar.style.width = score === null
        ? '0%'
        : `${Math.max(0, Math.min(100, score))}%`;
    }

    // Latency
    setText(
      '#latencyValue',
      latency === null ? null : formattedNumber(latency, 1)
    );

    // Download speed
    setText(
      '#downloadValue',
      download === null ? null : formattedNumber(download, 1)
    );

    // Packet loss
    setText(
      '#lossValue',
      loss === null ? null : formattedNumber(loss, 2)
    );

    // Score gauge
    const gauge = $('#gaugeProgress');

    if (gauge) {
      gauge.setAttribute(
        'stroke-dasharray',
        score === null
          ? '0 100'
          : `${Math.max(0, Math.min(100, score))} 100`
      );
    }

    const gaugeLabel = $('.score-gauge');

    if (gaugeLabel) {
      gaugeLabel.setAttribute(
        'aria-label',
        score === null
          ? 'Connection score unavailable'
          : `Connection score ${Math.round(score)} out of 100`
      );
    }

    const scoreLabel = $('#scoreLabel');

    if (scoreLabel) {
      let label = display(metrics.quality, '');

      if (!label && score !== null) {
        label = score >= 85
          ? 'Excellent'
          : score >= 70
            ? 'Good'
            : score >= 50
              ? 'Fair'
              : 'Poor';
      }

      scoreLabel.textContent = label || 'Waiting for data';

      if (score !== null) {
        scoreLabel.style.color = scoreColor(score);
      } else {
        scoreLabel.style.removeProperty('color');
      }
    }

    // Stability, responsiveness and throughput
    const stability = numeric(metrics.stability);
    const responsiveness = numeric(metrics.responsiveness);
    const throughput = numeric(metrics.throughput);

    setText(
      '#stabilityValue',
      stability === null ? null : `${Math.round(stability)}%`
    );

    setText(
      '#responsivenessValue',
      responsiveness === null
        ? null
        : `${Math.round(responsiveness)}%`
    );

    setText(
      '#throughputValue',
      throughput === null ? null : `${Math.round(throughput)}%`
    );

    const breakdown = $$('.score-breakdown > div');

    const values = [
      stability,
      responsiveness,
      throughput
    ];

    breakdown.forEach((item, index) => {
      const bar = $('.mini-track span', item);
      const value = values[index];

      if (bar) {
        bar.style.width = value === null
          ? '0%'
          : `${Math.max(0, Math.min(100, value))}%`;
      }
    });

    // Jitter is available only when supplied by the API.
    const jitterNode = $('#jitterValue');

    if (jitterNode) {
      jitterNode.textContent = jitter === null
        ? '—'
        : `${jitter.toFixed(1)} ms`;
    }

    updateNetworkRows(metrics);
    setUpdated(
      firstValue(
        snapshot.updated_at,
        snapshot.timestamp,
        snapshot.created_at
      )
    );

    return metrics;
  }

  // ==========================================
  // ACTIVITY EVENT LOG
  // ==========================================

  function addEvent(title, detail, kind = 'info', timestamp = null) {
    const list = $('#eventList');
    if (!list) return;

    const empty = $('.empty-events', list);

    if (empty) {
      empty.remove();
    }

    const iconClass =
      kind === 'success'
        ? 'event-success'
        : kind === 'warn'
          ? 'event-warn'
          : 'event-info';

    const icon =
      kind === 'success'
        ? '✓'
        : kind === 'warn'
          ? '!'
          : '⌁';

    const row = document.createElement('div');
    row.className = 'event-item';

    const iconNode = document.createElement('span');
    iconNode.className = `event-icon ${iconClass}`;
    iconNode.textContent = icon;

    const copy = document.createElement('div');
    copy.className = 'event-copy';

    const heading = document.createElement('strong');
    heading.textContent = title;

    const caption = document.createElement('small');
    caption.textContent = detail;

    copy.append(heading, caption);

    const timeNode = document.createElement('time');

    const date = timestamp ? new Date(timestamp) : new Date();

    timeNode.textContent = Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });

    row.append(iconNode, copy, timeNode);
    list.prepend(row);

    while (list.children.length > 6) {
      list.lastElementChild.remove();
    }
  }

  // ==========================================
  // RENDER EVENT HISTORY
  // ==========================================

  function renderEvents(raw) {
    const list = $('#eventList');
    if (!list) return;

    const events = arrayValue(raw);
    list.replaceChildren();

    if (!events.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-events';
      empty.textContent = 'No saved events available.';
      list.append(empty);
      return;
    }

    events.slice(0, 6).forEach(event => {
      const item = objectValue(event);

      const title = firstValue(
        item.event_type,
        item.title,
        item.type,
        'System event'
      );

      const detail = firstValue(
        item.message,
        item.detail,
        item.description,
        ''
      );

      const level = String(
        firstValue(item.event_level, item.severity, 'info')
      ).toLowerCase();

      const kind = level.includes('error') || level.includes('warning')
        ? 'warn'
        : level.includes('success') || level.includes('info')
          ? 'success'
          : 'info';

      addEvent(
        String(title).replaceAll('_', ' ').toUpperCase(),
        String(detail),
        kind,
        firstValue(item.created_at, item.timestamp, item.time)
      );
    });
  }

  // ==========================================
  // EXTRACT HISTORY
  // ==========================================

  function extractHistory(raw) {
    const items = arrayValue(raw);

    return items.map(item => {
      const row = objectValue(item);

      return {
        timestamp: firstValue(
          row.timestamp,
          row.created_at,
          row.recorded_at
        ),
        latency: numeric(firstValue(
          row.latency_ms,
          row.latency,
          row.ping_ms
        )),
        download: numeric(firstValue(
          row.download_mbps,
          row.download_speed_mbps,
          row.download
        )),
        upload: numeric(firstValue(
          row.upload_mbps,
          row.upload_speed_mbps,
          row.upload
        )),
        network: firstValue(
          row.network_type,
          row.network,
          row.connection_type
        )
      };
    }).filter(row =>
      row.latency !== null || row.download !== null
    );
  }

  // ==========================================
  // RENDER PERFORMANCE CHART
  // ==========================================

  function renderChart(rows) {
    const speedLine = $('#speedLine');
    const speedArea = $('#speedArea');
    const latencyLine = $('#latencyLine');
    const labels = $('#chartLabels');

    if (!speedLine || !speedArea || !latencyLine) return;

    const validRows = Array.isArray(rows)
      ? rows.slice(-12)
      : [];

    if (!validRows.length) {
      speedLine.setAttribute('d', '');
      speedArea.setAttribute('d', '');
      latencyLine.setAttribute('d', '');

      if (labels) {
        labels.replaceChildren();
      }

      const disclaimer = $('.chart-disclaimer');

      if (disclaimer) {
        disclaimer.textContent =
          'No saved historical measurements for this range.';
      }

      return;
    }

    const width = 600;
    const height = 190;
    const maxValue = Math.max(
      100,
      ...validRows.map(row => Math.max(
        row.latency || 0,
        row.download || 0
      ))
    );

    const pointsFor = key => validRows
      .map((row, index) => {
        const value = row[key];

        if (value === null) return null;

        const x = validRows.length === 1
          ? width / 2
          : index * width / (validRows.length - 1);

        const y = height - (value / maxValue) * height;

        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .filter(Boolean);

    const speedPoints = pointsFor('download');
    const latencyPoints = pointsFor('latency');

    speedLine.setAttribute(
      'd',
      speedPoints.length
        ? `M ${speedPoints.join(' L ')}`
        : ''
    );

    speedArea.setAttribute(
      'd',
      speedPoints.length
        ? `M ${speedPoints[0]} L ${speedPoints.slice(1).join(' L ')} L ${width},${height} L 0,${height} Z`
        : ''
    );

    latencyLine.setAttribute(
      'd',
      latencyPoints.length
        ? `M ${latencyPoints.join(' L ')}`
        : ''
    );

    if (labels) {
      labels.replaceChildren();

      validRows.forEach(row => {
        const span = document.createElement('span');

        const date = row.timestamp
          ? new Date(row.timestamp)
          : null;

        span.textContent = date && !Number.isNaN(date.getTime())
          ? date.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '—';

        labels.append(span);
      });
    }

    const disclaimer = $('.chart-disclaimer');

    if (disclaimer) {
      disclaimer.textContent =
        'Chart displays saved API measurements; missing metrics are omitted.';
    }
  // ==========================================
  // LOAD DASHBOARD FROM API
  // ==========================================

  async function loadDashboard() {
    try {
      const result = await apiRequest('/api/v1/dashboard');

      if (!result.ok) {
        throw new Error(
          result.message || 'Dashboard could not be loaded.'
        );
      }

      const data = objectValue(
        result.data,
        ['dashboard', 'data', 'result']
      );

      const snapshot = firstValue(
        data.latest_network,
        data.network,
        data.snapshot,
        {}
      );

      const speedTest = firstValue(
        data.latest_speed_test,
        data.speed_test,
        {}
      );

      const diagnostic = firstValue(
        data.latest_diagnostic,
        data.diagnostic,
        {}
      );

      state.dashboard = data;

      applySnapshot(snapshot);

      const speed = objectValue(speedTest);

      const download = numeric(firstValue(
        speed.download_mbps,
        speed.download_speed_mbps,
        speed.download
      ));

      const upload = numeric(firstValue(
        speed.upload_mbps,
        speed.upload_speed_mbps,
        speed.upload
      ));

      setText(
        '#downloadValue',
        download === null ? null : formattedNumber(download, 1)
      );

      setText(
        '#uploadValue',
        upload === null ? null : formattedNumber(upload, 1)
      );

      if (Object.keys(objectValue(diagnostic)).length) {
        state.latestDiagnostic = diagnostic;
      }

      setText('#apiStatus', 'API REACHABLE');

      $('#apiStatus')?.classList.add('online');
      $('#apiStatus')?.classList.remove('offline');

      return data;
    } catch (error) {
      console.error('[IntelliLink] Dashboard error:', error);

      setText('#apiStatus', 'API UNAVAILABLE');

      $('#apiStatus')?.classList.remove('online');
      $('#apiStatus')?.classList.add('offline');

      showToast(
        'Dashboard API haipatikani. Angalia muunganisho wa backend.'
      );

      return null;
    }
  }

  // ==========================================
  // LOAD NETWORK SNAPSHOT
  // ==========================================

  async function loadNetworkSnapshot() {
    try {
      const result = await apiRequest('/api/v1/network/snapshot');

      if (!result.ok) {
        throw new Error(
          result.message || 'Network snapshot unavailable.'
        );
      }

      const snapshot = objectValue(
        result.data,
        ['snapshot', 'network', 'data', 'result']
      );

      applySnapshot(snapshot);

      return snapshot;
    } catch (error) {
      console.error('[IntelliLink] Snapshot error:', error);
      return null;
    }
  }

  // ==========================================
  // LOAD CONNECTION SCORE
  // ==========================================

  async function loadConnectionScore() {
    try {
      const result = await apiRequest('/api/v1/network/score');

      if (!result.ok) {
        throw new Error(
          result.message || 'Connection score unavailable.'
        );
      }

      const data = objectValue(
        result.data,
        ['score', 'data', 'result']
      );

      state.lastScore = data;

      const score = numeric(firstValue(
        data.score,
        data.network_score,
        data.health_score
      ));

      if (score !== null) {
        setText('#healthScore', Math.round(score));
        setText('#gaugeScore', Math.round(score));

        const bar = $('#healthBar');

        if (bar) {
          bar.style.width =
            `${Math.max(0, Math.min(100, score))}%`;
        }

        const gauge = $('#gaugeProgress');

        if (gauge) {
          gauge.setAttribute(
            'stroke-dasharray',
            `${Math.max(0, Math.min(100, score))} 100`
          );
        }

        setText(
          '#scoreLabel',
          firstValue(
            data.quality,
            data.label,
            score >= 85
              ? 'Excellent'
              : score >= 70
                ? 'Good'
                : score >= 50
                  ? 'Fair'
                  : 'Poor'
          )
        );
      }

      return data;
    } catch (error) {
      console.error('[IntelliLink] Score error:', error);
      return null;
    }
  }

  // ==========================================
  // LOAD NETWORK HISTORY
  // ==========================================

  async function loadNetworkHistory(range = '1h') {
    try {
      const result = await apiRequest(
        `/api/v1/network/history?range=${encodeURIComponent(range)}`
      );

      if (!result.ok) {
        throw new Error(
          result.message || 'Network history unavailable.'
        );
      }

      const rows = extractHistory(result.data);

      state.networkHistory = rows;

      renderChart(rows);

      return rows;
    } catch (error) {
      console.error('[IntelliLink] History error:', error);

      renderChart([]);

      return [];
    }
  }

  // ==========================================
  // LOAD ACTIVITY EVENTS
  // ==========================================

  async function loadEvents() {
    try {
      const result = await apiRequest('/api/v1/events');

      if (!result.ok) {
        throw new Error(
          result.message || 'Event history unavailable.'
        );
      }

      renderEvents(result.data);

      return arrayValue(result.data);
    } catch (error) {
      console.error('[IntelliLink] Events error:', error);
      return [];
    }
  }

  // ==========================================
  // LOAD DEVICE STATUS
  // ==========================================

  async function loadDeviceStatus() {
    try {
      const result = await apiRequest('/api/v1/status');

      if (!result.ok) {
        throw new Error(
          result.message || 'Device status unavailable.'
        );
      }

      const data = objectValue(
        result.data,
        ['status', 'device', 'data', 'result']
      );

      state.deviceStatus = data;

      setText(
        '#deviceName',
        firstValue(
          data.device_name,
          data.name,
          'IntelliLink X1'
        )
      );

      setText(
        '#deviceStatus',
        firstValue(
          data.status,
          data.state,
          'Connected to API'
        )
      );

      setText(
        '#deviceTemperature',
        data.temperature_c === null ||
        data.temperature_c === undefined
          ? 'N/A'
          : `${data.temperature_c}°C`
      );

      setText(
        '#deviceCpu',
        data.cpu_percent === null ||
        data.cpu_percent === undefined
          ? 'N/A'
          : `${data.cpu_percent}%`
      );

      return data;
    } catch (error) {
      console.error('[IntelliLink] Device status error:', error);
      return null;
    }
  }

  // ==========================================
  // REFRESH ALL LIVE DATA
  // ==========================================

  async function refreshDashboard(showMessage = true) {
    if (state.refreshing) return;

    state.refreshing = true;

    const refreshButton = $('#refreshBtn');

    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.setAttribute('aria-busy', 'true');
    }

    try {
      await Promise.allSettled([
        loadDashboard(),
        loadNetworkSnapshot(),
        loadConnectionScore(),
        loadNetworkHistory(
          $('#chartRange')?.value || '1h'
        ),
        loadEvents(),
        loadDeviceStatus()
      ]);

      setUpdated();

      if (showMessage) {
        showToast('Dashboard imesasishwa kutoka kwenye API.');
      }
    } finally {
      state.refreshing = false;

      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.removeAttribute('aria-busy');
      }
    }
  }

  // ==========================================
  // SPEED TEST
  // ==========================================

  async function runSpeedTest() {
    if (state.speedTestRunning) {
      return;
    }

    state.speedTestRunning = true;

    const button = $('#runSpeedTestBtn') || $('#speedTestBtn');

    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }

    const overlay = $('#testOverlay');

    if (overlay) {
      overlay.hidden = false;
    }

    setText('#testTitle', 'Testing connection speed');

    setText(
      '#testDescription',
      'Inapima latency kupitia IntelliLink API. Download na upload zitaonyeshwa tu API ikizirudisha.'
    );

    setText('#testPercent', 'Working…');
    setText('#testStep', 'Measuring latency');

    const progressBar = $('#testProgressBar');

    if (progressBar) {
      progressBar.style.width = '35%';
    }

    try {
      const result = await apiRequest(
        '/api/v1/speed-test',
        {
          method: 'POST'
        }
      );

      if (!result.ok) {
        throw new Error(
          result.message || 'Speed test failed.'
        );
      }

      const data = objectValue(
        result.data,
        ['result', 'speed_test', 'data']
      );

      state.lastSpeedTest = data;

      const latency = numeric(firstValue(
        data.latency_ms,
        data.latency,
        data.ping_ms
      ));

      const download = numeric(firstValue(
        data.download_mbps,
        data.download_speed_mbps,
        data.download
      ));

      const upload = numeric(firstValue(
        data.upload_mbps,
        data.upload_speed_mbps,
        data.upload
      ));

      const loss = numeric(firstValue(
        data.packet_loss_percent,
        data.packet_loss,
        data.loss_percent
      ));

      setText(
        '#latencyValue',
        latency === null ? null : formattedNumber(latency, 1)
      );

      setText(
        '#downloadValue',
        download === null ? null : formattedNumber(download, 1)
      );

      setText(
        '#uploadValue',
        upload === null ? null : formattedNumber(upload, 1)
      );

      setText(
        '#lossValue',
        loss === null ? null : formattedNumber(loss, 2)
      );

      if (progressBar) {
        progressBar.style.width = '100%';
      }

      setText('#testPercent', '100%');
      setText('#testStep', 'Test completed');

      addEvent(
        'Speed test completed',
        `Latency: ${latency === null ? 'N/A' : `${latency} ms`}; download: ${download === null ? 'N/A' : `${download} Mbps`}`,
        'success'
      );

      showToast(
        download === null
          ? 'Latency test imekamilika. Download speed haijarudishwa na API.'
          : `Speed test imekamilika: ${download} Mbps download.`
      );

      setUpdated();

      return data;
    } catch (error) {
      console.error('[IntelliLink] Speed test error:', error);

      addEvent(
        'Speed test failed',
        error.message || 'Unable to complete speed test.',
        'warn'
      );

      showToast(
        'Speed test imeshindwa. Hakikisha API inapatikana.'
      );

      return null;
    } finally {
      state.speedTestRunning = false;

      if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }

      if (overlay) {
        overlay.hidden = true;
      }
    }
  }
  // ==========================================
  // SPLASH SCREEN
  // ==========================================

  function setupSplashScreen() {
    const splash = $('#splashScreen');

    if (!splash) return;

    document.body.classList.add('splash-active');

    const finishSplash = () => {
      splash.classList.add('splash-exit');
      document.body.classList.remove('splash-active');

      setTimeout(() => {
        splash.hidden = true;
        splash.setAttribute('aria-hidden', 'true');
      }, 650);
    };

    // Respect reduced-motion accessibility preferences.
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    setTimeout(
      finishSplash,
      reducedMotion ? 500 : 2400
    );
  }

  // ==========================================
  // SPEED TEST NOTIFICATION SOUND
  // ==========================================

  function playNotificationSound() {
    /*
     * Browser security does not allow a website to copy
     * Samsung's proprietary ringtone automatically.
     *
     * This generates a short original electronic notification
     * tone. A licensed audio file can be used instead.
     */

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (!state.audioContext) {
        state.audioContext = new AudioContextClass();
      }

      const context = state.audioContext;

      if (context.state === 'suspended') {
        context.resume().catch(() => {});
      }

      const playTone = (frequency, startTime, duration) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(
          frequency,
          startTime
        );

        gain.gain.setValueAtTime(0.0001, startTime);

        gain.gain.exponentialRampToValueAtTime(
          0.12,
          startTime + 0.025
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          startTime + duration
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.03);
      };

      const now = context.currentTime;

      playTone(880, now, 0.13);
      playTone(1174.66, now + 0.16, 0.2);
    } catch (error) {
      console.warn(
        '[IntelliLink] Notification sound unavailable:',
        error
      );
    }
  }

  // ==========================================
  // SOUND SETTINGS
  // ==========================================

  function setupSoundSettings() {
    let enabled = true;

    try {
      const saved = localStorage.getItem(
        'intellilink-sound-enabled'
      );

      if (saved !== null) {
        enabled = saved === 'true';
      }
    } catch (_) {
      // Storage may be disabled.
    }

    state.soundEnabled = enabled;

    const toggle = $('#soundToggle');

    if (toggle) {
      toggle.checked = enabled;

      toggle.addEventListener('change', () => {
        state.soundEnabled = toggle.checked;

        try {
          localStorage.setItem(
            'intellilink-sound-enabled',
            String(state.soundEnabled)
          );
        } catch (_) {
          // Ignore unavailable browser storage.
        }

        showToast(
          state.soundEnabled
            ? 'Notification sound enabled.'
            : 'Notification sound disabled.'
        );
      });
    }
  }

  // ==========================================
  // CHART RANGE
  // ==========================================

  function setupChartRange() {
    const selector = $('#chartRange');

    if (!selector) return;

    selector.addEventListener('change', async () => {
      await loadNetworkHistory(selector.value);
    });
  }

  // ==========================================
  // THEME
  // ==========================================

  function setupTheme() {
    let savedTheme = 'dark';

    try {
      savedTheme = localStorage.getItem(
        'intellilink-theme'
      ) || 'dark';
    } catch (_) {
      // Use default theme.
    }

    document.body.classList.toggle(
      'light-theme',
      savedTheme === 'light'
    );

    $('#themeToggle')?.addEventListener('click', () => {
      const isLight = document.body.classList.toggle(
        'light-theme'
      );

      const theme = isLight ? 'light' : 'dark';

      try {
        localStorage.setItem(
          'intellilink-theme',
          theme
        );
      } catch (_) {
        // Ignore unavailable storage.
      }

      showToast(`${theme} theme enabled.`);
    });
  }

  // ==========================================
  // NAVIGATION
  // ==========================================

  function setupNavigation() {
    const titleMap = {
      dashboard: 'Overview',
      monitor: 'Live monitor',
      diagnostics: 'Diagnostics',
      history: 'Test history',
      settings: 'Settings'
    };

    const targetMap = {
      dashboard: '#dashboard',
      monitor: '#monitor',
      diagnostics: '#diagnostics',
      history: '#history',
      settings: '#settings'
    };

    $$('.nav-link').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();

        const view = link.dataset.view;

        $$('.nav-link').forEach(item => {
          item.classList.toggle('active', item === link);
        });

        setText('#pageTitle', titleMap[view] || 'Overview');

        const target = $(targetMap[view]);

        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          showToast(
            'Sehemu hii haijapatikana kwenye index.html.'
          );
        }

        $('#sidebar')?.classList.remove('open');
      });
    });

    $('#menuToggle')?.addEventListener('click', () => {
      $('#sidebar')?.classList.toggle('open');
    });
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================

  function bindEvents() {
    // Refresh dashboard.
    $('#refreshBtn')?.addEventListener('click', async () => {
      await refreshDashboard(true);
    });

    // Run diagnostic.
    $('#runTestBtn')?.addEventListener('click', async () => {
      if (state.running) return;

      state.running = true;

      const overlay = $('#testOverlay');

      if (overlay) {
        overlay.hidden = false;
      }

      setText('#testTitle', 'Running diagnostics');
      setText(
        '#testDescription',
        'Collecting measurements available from the IntelliLink API.'
      );
      setText('#testStep', 'Requesting network snapshot');
      setText('#testPercent', 'Working…');

      const bar = $('#testProgressBar');

      if (bar) {
        bar.style.width = '30%';
      }

      try {
        await loadNetworkSnapshot();
        await loadConnectionScore();

        if (bar) {
          bar.style.width = '100%';
        }

        setText('#testPercent', '100%');
        setText('#testStep', 'Diagnostics completed');

        addEvent(
          'Diagnostics completed',
          'Measurements updated from the API.',
          'success'
        );

        showToast('Diagnostics completed.');
      } catch (error) {
        addEvent(
          'Diagnostics failed',
          error.message || 'Could not complete diagnostics.',
          'warn'
        );
      } finally {
        state.running = false;

        setTimeout(() => {
          if (overlay) {
            overlay.hidden = true;
          }
        }, 700);
      }
    });

    // Run speed test.
    const speedButton =
      $('#runSpeedTestBtn') || $('#speedTestBtn');

    speedButton?.addEventListener('click', async () => {
      if (state.soundEnabled) {
        playNotificationSound();
      }

      await runSpeedTest();
    });

    // Cancel test overlay.
    $('#cancelTest')?.addEventListener('click', () => {
      state.running = false;

      if ($('#testOverlay')) {
        $('#testOverlay').hidden = true;
      }

      showToast('Diagnostic cancelled.');
    });

    // Clear event list.
    $('#clearEvents')?.addEventListener('click', () => {
      const list = $('#eventList');

      if (!list) return;

      list.replaceChildren();

      const empty = document.createElement('div');

      empty.className = 'empty-events';
      empty.textContent = 'No events to display.';

      list.append(empty);

      showToast('Activity log cleared on this page.');
    });

    // Dismiss prototype banner.
    $('#dismissBanner')?.addEventListener('click', () => {
      $('.demo-banner')?.remove();
    });

    // Escape closes overlay.
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && state.running) {
        state.running = false;

        if ($('#testOverlay')) {
          $('#testOverlay').hidden = true;
        }
      }
    });
  }

  // ==========================================
  // INITIALISE APPLICATION
  // ==========================================

  async function init() {
    setupSplashScreen();
    setupSoundSettings();
    setupTheme();
    setupNavigation();
    setupChartRange();
    bindEvents();

    setUpdated();

    // Do not invent network values while waiting for the API.
    setText('#healthScore', null);
    setText('#gaugeScore', null);
    setText('#latencyValue', null);
    setText('#downloadValue', null);
    setText('#lossValue', null);
    setText('#stabilityValue', null);
    setText('#responsivenessValue', null);
    setText('#throughputValue', null);

    await refreshDashboard(false);
  }

  document.addEventListener(
    'DOMContentLoaded',
    init,
    { once: true }
  );

})();

