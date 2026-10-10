/* Mubader: renders the editable sections from site.json (or the admin's live draft). */
(function () {
  var AR_M = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function url(s) { return esc(String(s || '').replace(/[()'"\\]/g, encodeURIComponent)); }
  function fdate(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? (+p[2]) + ' ' + AR_M[(+p[1]) - 1] + ' ' + p[0] : esc(iso); }
  function $(id) { return document.getElementById(id); }
  var ARROW = '<svg width="18" height="18"><use href="#arrow"/></svg>', UP = '<svg width="18" height="18"><use href="#arrow-up"/></svg>';
  var PAT = '<svg class="pat" aria-hidden="true"><rect width="100%" height="100%" fill="url(#chevw)"/></svg>';
  function initial(n) { return esc(String(n || '').replace(/^(د\.|م\.|صاحبة السمو الملكي الأميرة)\s*/, '').charAt(0)); }

  function tabs(gid, label, items) {
    var b = '', p = '';
    items.forEach(function (it, i) {
      b += '<button class="tab" role="tab" type="button" id="' + gid + '-t' + i + '" aria-controls="' + gid + '-p' + i + '" aria-selected="' + (i ? 'false' : 'true') + '" tabindex="' + (i ? -1 : 0) + '"><span>' + esc(it[0]) + '</span></button>';
      p += '<div class="panel" role="tabpanel" id="' + gid + '-p' + i + '" aria-labelledby="' + gid + '-t' + i + '"' + (i ? ' hidden' : '') + '>' + it[1] + '</div>';
    });
    return '<div class="tabset"><div class="tabs" role="tablist" aria-label="' + esc(label) + '">' + b + '</div>' + p + '</div>';
  }
  function initTabs(root) {
    [].slice.call(root.querySelectorAll('.tabset')).forEach(function (set) {
      var ts = [].slice.call(set.querySelectorAll(':scope > .tabs > .tab'));
      function sel(tb) { ts.forEach(function (x) { var on = x === tb; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); }
      ts.forEach(function (tb, i) {
        tb.addEventListener('click', function () { sel(tb); });
        tb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { var fwd = (e.key === 'ArrowLeft') === (document.documentElement.dir === 'rtl'); var n = ts[(i + (fwd ? 1 : ts.length - 1)) % ts.length]; sel(n); n.focus(); e.preventDefault(); } });
      });
    });
  }
  function person(p, lead) {
    var pic = p.photo ? '<div class="ph" style="background-image:url(' + url(p.photo) + ')" role="img" aria-label="' + esc(p.name) + '"></div>' : '<div class="mono" aria-hidden="true">' + initial(p.name) + '</div>';
    return '<div class="person bezel' + (lead ? ' lead' : '') + '"><div class="core">' + pic + '<div class="who"><h3>' + esc(p.name) + '</h3>' + (p.role ? '<p>' + esc(p.role) + '</p>' : '') + '</div></div></div>';
  }
  function people(list) { list = list || []; return '<div class="people" style="--cols:' + Math.min(Math.max(list.length, 1), 6) + '">' + list.map(function (p, i) { return person(p, i === 0); }).join('') + '</div>'; }

  var R = {
    hero: function (h) {
      var s = document.querySelector('[data-slot="hero"]'); if (!s || !h) return;
      var pill = s.querySelector('.hero-copy .pill > span'); if (pill) pill.textContent = h.eyebrow || '';
      var h1 = s.querySelector('h1'); if (h1) h1.innerHTML = esc(h.title) + ' <strong>' + esc(h.titleStrong) + '</strong>';
      var lead = s.querySelector('.lead'); if (lead) lead.textContent = h.lead || '';
      var ph = s.querySelector('.hero-media .ph'); if (ph && h.image) ph.style.backgroundImage = 'url(' + h.image + ')';
      var cap = s.querySelector('.hero-media .cap'); if (cap) cap.innerHTML = '<b>' + esc(h.capTitle) + '</b><span>' + esc(h.capSub) + '</span>';
      var hl = s.querySelectorAll('.hl');
      if (hl[0]) hl[0].querySelector('div').innerHTML = '<b class="num">' + esc(h.hl1Num) + '<small>' + esc(h.hl1Unit) + '</small></b><span>' + esc(h.hl1Text) + '</span>';
      if (hl[1]) hl[1].querySelector('div').innerHTML = '<b>' + esc(h.hl2Title) + '</b><span>' + esc(h.hl2Text) + '</span>';
    },
    stats: function (list) {
      var el = $('slot-stats'); if (!el || !list) return;
      el.innerHTML = list.map(function (s, i) {
        return '<div class="bezel' + (i === 0 ? ' hi' : '') + '"><div class="core">' + (i === 0 ? PAT : '') + '<span class="si"><svg width="24" height="24"><use href="#i-' + esc(s.icon || 'star') + '"/></svg></span><span class="v num">' + esc(s.num) + (s.unit ? '<small>' + esc(s.unit) + '</small>' : '') + '</span><span class="k">' + esc(s.label) + '</span></div></div>';
      }).join('');
    },
    news: function (list) {
      var el = $('slot-news'); if (!el || !list || !list.length) return;
      var f = list[0];
      var feat = '<a class="feature bezel" href="' + esc(f.link || '#news') + '" target="_blank" rel="noopener"><div class="core"><div class="ph" style="background-image:url(' + url(f.image) + ')"></div><div class="txt">' + (f.tag ? '<span class="chip">' + esc(f.tag) + '</span>' : '') + '<h3>' + esc(f.title) + '</h3>' + (f.body ? '<p class="fbody">' + esc(f.body) + '</p>' : '') + '<span class="date">' + fdate(f.date) + '</span></div></div></a>';
      var rest = list.slice(1).map(function (n) {
        var th = n.image ? '<div class="th" style="background-image:url(' + url(n.image) + ')"></div>' : '<div class="th">' + PAT.replace('class="pat"', '') + '</div>';
        return '<a class="nitem" href="' + esc(n.link || '#news') + '" target="_blank" rel="noopener">' + th + '<div><span class="date">' + fdate(n.date) + '</span><h4>' + esc(n.title) + '</h4></div><svg class="arr" width="20" height="20"><use href="#arrow"/></svg></a>';
      }).join('');
      el.innerHTML = feat + '<div class="nlist">' + rest + '</div>';
    },
    films: function (list) {
      var el = $('slot-films'); if (!el || !list) return;
      el.innerHTML = list.map(function (v) {
        var id = String(v.youtube || '').replace(/.*(?:v=|youtu\.be\/|embed\/)/, '').replace(/[?&].*/, '');
        return '<a class="vid" href="https://www.youtube.com/watch?v=' + esc(id) + '" target="_blank" rel="noopener"><span class="vcover" style="background-image:url(' + url(v.cover) + ')">' + PAT + '<span class="play" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 14 14"><path d="M3.5 1.5v11l9-5.5z" fill="currentColor"/></svg></span><span class="vkind">' + esc(v.kind || 'فيلم') + '</span></span><span class="vt">' + esc(v.title) + '</span><span class="vsrc">شاهد على يوتيوب</span></a>';
      }).join('');
    },
    ads: function (list) {
      var el = $('slot-ads'); if (!el || !list) return;
      var rot = [-1.6, 1.2, -0.6, 1.8, -1.1];
      el.innerHTML = list.map(function (a, i) { return '<button class="poster' + (a.x ? ' from-x' : '') + '" type="button" style="--r:' + rot[i % 5] + 'deg" aria-label="' + esc(a.title) + '"><img src="' + url(a.image) + '" alt="' + esc(a.title) + '"><span class="pin" aria-hidden="true"></span>' + (a.x ? '<span class="xbadge" aria-hidden="true"><svg width="14" height="14"><use href="#s-x"/></svg></span>' : '') + '</button>'; }).join('');
    },
    xposts: function (list) {
      var el = $('slot-xfeed'), box = $('xfeed'); if (!el || !box) return;
      var ids = (list || []).map(function (p) { var m = /status(?:es)?\/(\d{5,})/.exec(p && p.url || ''); return m && m[1]; }).filter(Boolean);
      box.hidden = !ids.length; if (!ids.length) { el.innerHTML = ''; return; }
      var key = ids.join(','); if (el.dataset.key === key) return; el.dataset.key = key;
      el.innerHTML = ids.map(function (id) { return '<div class="xp"><blockquote class="twitter-tweet" data-lang="ar" data-dnt="true"><a href="https://twitter.com/i/status/' + id + '"></a></blockquote></div>'; }).join('');
      // X's official embed: shows the post with its photos and playable video, no login needed
      if (window.twttr && window.twttr.widgets) window.twttr.widgets.load(el);
      else if (!document.getElementById('x-wjs')) { var s = document.createElement('script'); s.id = 'x-wjs'; s.async = true; s.src = 'https://platform.twitter.com/widgets.js'; document.body.appendChild(s); }
    },
    partners: function (list) {
      var el = $('slot-ticker'); if (!el || !list) return;
      var sep = '<span class="tsep" aria-hidden="true"><svg viewBox="158 118 292 214"><use href="#mbd-logo"/></svg></span>';
      var one = list.map(function (p) { return '<span class="tl"><img src="' + url(p.image) + '" alt="' + esc(p.name) + '"></span>' + sep; }).join('');
      el.innerHTML = one + one;
    },
    annual: function (a) {
      var el = $('slot-annual'); if (!el || !a) return;
      el.href = a.url || '#'; var h = el.querySelector('h3'); if (h) h.textContent = a.title || '';
    },
    gov: function (list) {
      var el = $('slot-gov'); if (!el || !list) return;
      el.innerHTML = tabs('gov', 'أقسام الحوكمة', list.map(function (g) {
        return [g.section, '<div class="docs">' + (g.docs || []).map(function (d) { return '<a class="doc" href="' + esc(d.url) + '" target="_blank" rel="noopener"><span class="pdf">PDF</span><span class="dt">' + esc(d.title) + '</span>' + UP + '</a>'; }).join('') + '</div>'];
      }));
      initTabs(el);
    },
    board: function (b) {
      var el = $('slot-board'); if (!el || !b) return;
      el.innerHTML = tabs('board', 'دورات مجلس الإدارة', [['الدورة الثانية · 2026–2031', people(b.term2)], ['الدورة الأولى', people(b.term1)]]);
      initTabs(el);
    },
    team: function (t) {
      var el = $('slot-team'); if (!el || !t) return;
      el.innerHTML = tabs('team', 'الفريق واللجان', [['اللجنة التنفيذية', people(t.exec)], ['فريق العمل', people(t.staff)], ['لجنة تنمية الموارد المالية', people(t.fin)]]);
      initTabs(el);
    },
    assembly: function (a) {
      if (!a) return;
      var o = $('slot-orgs');
      if (o) o.innerHTML = (a.orgs || []).map(function (g) {
        return g.logo ? '<div class="org has-logo"><span class="ologo"><img src="' + url(g.logo) + '" alt=""></span><span>' + esc(g.name) + '</span></div>'
                      : '<div class="org"><span class="oi"><svg width="20" height="20"><use href="#i-flag"/></svg></span><span>' + esc(g.name) + '</span></div>';
      }).join('');
      var p = $('slot-gpeople');
      if (p) p.innerHTML = (a.people || []).map(function (x) {
        return '<div class="gp">' + (x.photo ? '<div class="ph" style="background-image:url(' + url(x.photo) + ')"></div>' : '<div class="mono">' + initial(x.name) + '</div>') + '<span class="gn">' + esc(x.name) + '</span></div>';
      }).join('');
    },
    contact: function (c) {
      var el = $('slot-contact'); if (!el || !c) return;
      el.innerHTML = '<div><small>العنوان</small><p>' + esc(c.address) + '</p></div><div><small>البريد الإلكتروني</small><p class="sel" dir="ltr">' + esc(c.email) + '</p></div><div><small>الهاتف</small><p class="sel num" dir="ltr">' + esc(c.phone) + '</p></div><div><small>الترخيص</small><p>ترخيص رقم ' + esc(c.license) + '</p></div><div class=\"socials\" style=\"margin-top:0\" aria-label=\"حساباتنا\"></div>';
    },
    social: function (so) {
      if (!so) return;
      var L = [['x', 'إكس'], ['instagram', 'إنستغرام'], ['youtube', 'يوتيوب'], ['whatsapp', 'واتساب']];
      var h = L.filter(function (k) { return so[k[0]]; }).map(function (k) { return '<a href="' + esc(so[k[0]]) + '" target="_blank" rel="noopener" aria-label="' + k[1] + '"><svg><use href="#s-' + k[0] + '"/></svg></a>'; }).join('');
      [].slice.call(document.querySelectorAll('.socials')).forEach(function (el) { el.innerHTML = h; });
    },
    applyUrl: function (u) {
      if (!u) return;
      [].slice.call(document.querySelectorAll('a[href*="docs.google.com/forms"]')).forEach(function (a) { a.href = u; });
    }
  };
  function render(site) {
    if (!site) return;
    Object.keys(R).forEach(function (k) { try { R[k](site[k]); } catch (e) { if (window.console) console.warn('render', k, e); } });
  }
  window.mbdRender = render;

  var draft = /[?&]draft=1/.test(location.search);
  if (draft) {
    try { var d = localStorage.getItem('mbd.draft'); if (d) render(JSON.parse(d)); } catch (e) {}
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data || e.data.type !== 'mbd-draft') return;
      render(e.data.site);
      if (e.data.focus) {
        var go = function (smooth) { var t = document.getElementById(e.data.focus) || document.querySelector(e.data.focus); if (t && !t.hidden) t.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }); };
        // images and embeds above the target keep loading, so settle on it again once they have
        go(true); setTimeout(go, 900); setTimeout(go, 2200);
      }
    });
  } else {
    fetch('site.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(render).catch(function () {});
  }
})();
