/* ============================================================
   エコリース site — shared interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Theme variant (案A / 案B) ---------- */
  var THEMES = {
    a: { en: 'PLAN A', jp: '静かな明朝' },
    b: { en: 'PLAN B', jp: 'のびやか若葉' }
  };
  function getTheme() {
    var t = localStorage.getItem('eco-theme');
    return (t === 'a' || t === 'b') ? t : 'a';
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('eco-theme', t);
    document.querySelectorAll('.vd-btns button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.theme === t);
    });
  }
  // apply ASAP
  applyTheme(getTheme());

  function buildDock() {
    if (document.querySelector('.variant-dock')) return;
    var dock = document.createElement('div');
    dock.className = 'variant-dock';
    dock.innerHTML =
      '<div class="vd-label"><span>DESIGN VARIANT</span><span class="vd-min" title="折りたたむ">—</span></div>' +
      '<div class="vd-title">比較したいデザイン案を切り替え</div>' +
      '<div class="vd-btns">' +
        '<button data-theme="a"><span class="b-en">案 A</span><span class="b-jp">静かな明朝</span></button>' +
        '<button data-theme="b"><span class="b-en">案 B</span><span class="b-jp">のびやか若葉</span></button>' +
      '</div>';
    document.body.appendChild(dock);
    dock.querySelectorAll('.vd-btns button').forEach(function (b) {
      b.addEventListener('click', function () { applyTheme(b.dataset.theme); });
    });
    var min = dock.querySelector('.vd-min');
    min.addEventListener('click', function () {
      dock.classList.toggle('min');
      min.textContent = dock.classList.contains('min') ? '⊕' : '—';
    });
    applyTheme(getTheme());
  }

  /* ---------- Header scroll state ---------- */
  function header() {
    var h = document.querySelector('.site-header');
    if (!h) return;
    var on = function () { h.classList.toggle('scrolled', window.scrollY > 30); };
    on(); window.addEventListener('scroll', on, { passive: true });
  }

  /* ---------- Mobile drawer ---------- */
  function drawer() {
    var burger = document.querySelector('.hamburger');
    var dr = document.querySelector('.drawer');
    if (!burger || !dr) return;
    var toggle = function () {
      var open = dr.classList.toggle('open');
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', toggle);
    dr.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        dr.classList.remove('open'); burger.classList.remove('open'); document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Reveal on scroll (position-based; gated by a motion
     probe so content is never left hidden where CSS motion is paused) ---------- */
  function reveal() {
    var els = [].slice.call(document.querySelectorAll('.reveal'));
    if (!els.length) return;

    function startReveal() {
      document.documentElement.classList.add('anim');
      var list = els.slice();
      function vh() { return window.innerHeight || document.documentElement.clientHeight; }
      function check() {
        var h = vh();
        list = list.filter(function (e) {
          if (e.getBoundingClientRect().top < h * 0.92) { e.classList.add('in'); return false; }
          return true;
        });
        if (!list.length) detach();
      }
      var ticking = false;
      function onScroll() {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () { check(); ticking = false; });
      }
      function detach() {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      check();
      window.addEventListener('load', check);
      // safety net: never leave anything hidden
      setTimeout(function () { list.forEach(function (e) { e.classList.add('in'); }); detach(); }, 2600);
    }

    // Probe: does CSS motion actually advance here? If a transition
    // completes, enable the staged reveal; otherwise leave content visible.
    var p = document.createElement('div');
    p.style.cssText = 'position:fixed;left:-9999px;top:0;width:4px;height:4px;opacity:0.01;transition:opacity .06s linear;pointer-events:none';
    document.body.appendChild(p);
    var settled = false;
    function done(motion) {
      if (settled) return; settled = true;
      try { p.remove(); } catch (e) {}
      if (motion) startReveal();
    }
    p.addEventListener('transitionend', function () { done(true); });
    requestAnimationFrame(function () { p.style.opacity = '1'; });
    setTimeout(function () { p.style.opacity = '1'; }, 24);
    setTimeout(function () { done(false); }, 450); // no motion -> content stays visible
  }

  /* ---------- Shared field validation ---------- */
  function validateRow(row) {
    var f = row.querySelector('input,textarea,select');
    if (!f || !f.hasAttribute('data-required')) return true;
    var v = (f.value || '').trim();
    var ok = !!v;
    if (ok && f.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (ok && f.type === 'tel') ok = /^[0-9０-９\-\(\)\s]{8,}$/.test(v);
    row.classList.toggle('invalid', !ok);
    return ok;
  }

  /* ---------- Step wizard (お問い合わせ) ---------- */
  function wizardForm() {
    var wiz = document.getElementById('wizard');
    if (!wiz) return;
    var step1 = document.getElementById('step1');
    var step2 = document.getElementById('step2');
    var stepper = document.getElementById('stepper');
    var success = document.getElementById('formSuccess');

    // chip selection
    wiz.querySelectorAll('.chip-group').forEach(function (g) {
      var multi = g.dataset.multi === '1';
      g.querySelectorAll('.chip').forEach(function (c) {
        c.addEventListener('click', function () {
          if (multi) {
            c.classList.toggle('sel');
          } else {
            g.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('sel'); });
            c.classList.add('sel');
          }
          var block = g.closest('.field-block');
          if (block) block.classList.remove('err-show');
        });
      });
    });

    function groupSelected(id) {
      var g = document.getElementById(id);
      return g.querySelectorAll('.chip.sel').length > 0;
    }
    function scrollToWiz() {
      window.scrollTo({ top: wiz.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
    }

    // step 1 -> 2
    document.getElementById('toStep2').addEventListener('click', function () {
      var groups = [['fb-use', 'g-use'], ['fb-equip', 'g-equip'], ['fb-term', 'g-term']];
      var ok = true, firstBad = null;
      groups.forEach(function (pair) {
        var good = groupSelected(pair[1]);
        var block = document.getElementById(pair[0]);
        block.classList.toggle('err-show', !good);
        if (!good && !firstBad) firstBad = block;
        ok = ok && good;
      });
      if (!ok) {
        if (firstBad) window.scrollTo({ top: firstBad.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
        return;
      }
      step1.classList.remove('on-step');
      step2.classList.add('on-step');
      document.getElementById('sp1').className = 'st done';
      document.getElementById('sp2').className = 'st on';
      stepper.classList.add('at2');
      scrollToWiz();
    });

    // back
    document.getElementById('backStep1').addEventListener('click', function () {
      step2.classList.remove('on-step');
      step1.classList.add('on-step');
      document.getElementById('sp1').className = 'st on';
      document.getElementById('sp2').className = 'st';
      stepper.classList.remove('at2');
      scrollToWiz();
    });

    // live re-validate
    step2.querySelectorAll('.form-row').forEach(function (row) {
      var f = row.querySelector('input,textarea,select');
      if (f) ['blur', 'input'].forEach(function (ev) {
        f.addEventListener(ev, function () { if (row.classList.contains('invalid')) validateRow(row); });
      });
    });
    var privacy = document.getElementById('privacy');
    if (privacy) privacy.addEventListener('change', function () {
      document.getElementById('privacyRow').classList.toggle('invalid', !privacy.checked);
    });

    // submit
    step2.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      step2.querySelectorAll('.form-row').forEach(function (row) {
        var v = validateRow(row);
        if (!v && !first) first = row;
        ok = ok && v;
      });
      var prow = document.getElementById('privacyRow');
      if (!privacy.checked) { prow.classList.add('invalid'); ok = false; if (!first) first = prow; }
      else prow.classList.remove('invalid');
      if (!ok) {
        if (first) window.scrollTo({ top: first.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
        return;
      }
      wiz.style.display = 'none';
      if (success) {
        success.classList.add('show');
        window.scrollTo({ top: success.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth' });
      }
    });
  }

  /* ---------- Footer year ---------- */
  function year() {
    var y = document.getElementById('yr');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- AI chat widget ---------- */
  function aiChat() {
    if (document.querySelector('.chat-panel')) return;
    var PREAMBLE =
      'あなたは「株式会社エコリース」公式サイトのAIアシスタント、エコリースAIガイドです。' +
      '丁寧で親しみやすい日本語で、3〜4文程度の簡潔な回答をします。\n' +
      '【会社情報】株式会社エコリースは徳島県板野郡板野町の設備リース会社（創立40周年）。' +
      '「捨てないというビジネスモデル」を掲げ、役目を終えた設備を回収・洗浄・整備して再生し、再びリース／レンタルします。\n' +
      '【3つの事業】①設備リース（長期・大型設備対応）②設備レンタル（短期・スピード対応）③ビルメンテナンス（点検・清掃・修繕）。\n' +
      '【取扱設備】受水槽・パネルタンク、受変電設備・キュービクル、変圧器、浄化槽、空調設備（パッケージエアコン）、消防設備など。\n' +
      '【対応】全国44都道府県。名古屋・大阪に拠点。TEL 088-672-0441（平日9:00-17:30）。\n' +
      '【案内】概算費用は「簡易見積り」ページ、正式なご相談は「お問い合わせ」ページへ誘導してください。' +
      'わからないこと・個別の価格や在庫は断定せず、お問い合わせを案内します。会社と無関係な話題には丁寧にお断りします。';

    var FAQ = [
      { k: ['リース', 'レンタル', '違い', 'ちがい'], a: '設備リースは仮設施設などへ長期で計画的にご利用いただくサービス、設備レンタルはイベントや短期工事など必要な期間だけお使いいただくサービスです。どちらも再生設備を活用するため、コストと環境負荷を抑えられます。詳しくは各事業ページをご覧ください。' },
      { k: ['設備', '取扱', '種類', 'なに', '何が'], a: '受水槽・パネルタンク、受変電設備・キュービクル、変圧器、浄化槽、空調設備、消防設備など幅広く取り扱っています。浄化槽・受水槽・キュービクル等の大型設備にも対応可能です。' },
      { k: ['見積', 'みつ', '料金', '費用', '価格', 'いくら', '値段'], a: '「簡易見積り」ページで、事業区分・設備・台数・利用期間を選ぶと概算費用を試算できます。正式なお見積りは内容をうかがって作成しますので、お問い合わせください。' },
      { k: ['エリア', '地域', '対応', '全国', '場所', 'どこ'], a: '全国44都道府県で施工実績があります。徳島の本社に加え名古屋・大阪にも拠点があり、輸送から施工・保守までワンストップで対応します。' },
      { k: ['ビルメン', 'メンテ', '点検', '清掃', '修繕', '保守'], a: 'ビルメンテナンスでは、設備の点検・清掃・保守から修繕まで、施設の価値を保つ業務をワンストップでお引き受けします。電気・給排水・空調・防災まで幅広く対応します。' },
      { k: ['捨て', '環境', 'エコ', 'sdgs', 'co2', '二酸化'], a: 'エコリースは設備を「使い捨て」にせず、回収・洗浄・整備して再活用する循環をつくっています。企業活動そのものが資源の有効活用とCO₂削減につながる——それが「捨てないというビジネスモデル」です。' },
      { k: ['問い合', 'といあわ', '連絡', '電話', 'tel', 'メール', '相談'], a: 'お電話は 088-672-0441（平日9:00-17:30）、またはサイトの「お問い合わせ」フォームから承ります。用途・期間・地域をお知らせいただくとご案内がスムーズです。' },
      { k: ['期間', '何ヶ月', '短期', '長期', 'いつまで'], a: 'ご利用期間は短期（数日〜数ヶ月）から長期（年単位）まで柔軟に対応します。短期はレンタル、長期はリースが目安です。' }
    ];
    function fallbackReply(text) {
      var t = (text || '').toLowerCase();
      for (var i = 0; i < FAQ.length; i++) {
        for (var j = 0; j < FAQ[i].k.length; j++) {
          if (t.indexOf(FAQ[i].k[j].toLowerCase()) > -1) return FAQ[i].a;
        }
      }
      return 'ご質問ありがとうございます。設備リース・レンタル・ビルメンテナンスに関することでしたら、できる範囲でお答えします。詳しいご相談は「お問い合わせ」（TEL 088-672-0441）、概算費用は「簡易見積り」ページもご利用ください。';
    }

    var ICON = '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>';

    var fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.innerHTML = '<span class="av">' + ICON + '</span><span class="t">AIに質問する</span>';
    document.body.appendChild(fab);

    var panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.innerHTML =
      '<div class="chat-head"><span class="av">' + ICON + '</span>' +
      '<div class="ht"><b>エコリース AIガイド</b><span>オンライン</span></div>' +
      '<button class="x" aria-label="閉じる">×</button></div>' +
      '<div class="chat-body" id="chatBody"></div>' +
      '<div class="chat-sugg" id="chatSugg"></div>' +
      '<form class="chat-input" id="chatForm"><input id="chatText" type="text" placeholder="メッセージを入力…" autocomplete="off">' +
      '<button type="submit" aria-label="送信"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></form>' +
      '<div class="chat-disc">AIによる自動応答です。正確な情報はお問い合わせください。</div>';
    document.body.appendChild(panel);

    var body = panel.querySelector('#chatBody');
    var sugg = panel.querySelector('#chatSugg');
    var form = panel.querySelector('#chatForm');
    var input = panel.querySelector('#chatText');
    var history = [];
    var busy = false;

    function scroll() { body.scrollTop = body.scrollHeight; }
    function addMsg(role, text) {
      var d = document.createElement('div');
      d.className = 'chat-msg ' + (role === 'user' ? 'user' : 'bot');
      if (role !== 'user') {
        text = String(text).replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1').replace(/^\s*#{1,6}\s*/gm, '').replace(/^\s*[-*]\s+/gm, '・');
      }
      d.textContent = text;
      body.appendChild(d); scroll();
    }
    function typing(on) {
      var ex = body.querySelector('.chat-typing');
      if (on && !ex) {
        var t = document.createElement('div');
        t.className = 'chat-typing'; t.innerHTML = '<i></i><i></i><i></i>';
        body.appendChild(t); scroll();
      } else if (!on && ex) ex.remove();
    }

    async function respond(text) {
      typing(true); busy = true;
      var reply = '';
      try {
        if (window.claude && window.claude.complete) {
          var msgs = history.map(function (m) { return { role: m.role, content: m.content }; });
          if (msgs.length && msgs[0].role === 'user') {
            msgs[0] = { role: 'user', content: PREAMBLE + '\n\n----\n# ユーザーからの質問\n' + msgs[0].content };
          }
          reply = await window.claude.complete({ messages: msgs });
        }
      } catch (e) { reply = ''; }
      if (!reply || !reply.trim()) reply = fallbackReply(text);
      typing(false);
      history.push({ role: 'assistant', content: reply });
      addMsg('assistant', reply);
      busy = false;
    }

    function send(text) {
      text = (text || '').trim();
      if (!text || busy) return;
      history.push({ role: 'user', content: text });
      addMsg('user', text);
      input.value = '';
      respond(text);
    }

    var suggestions = ['リースとレンタルの違いは？', '取扱設備を教えて', '対応エリアは？', '見積りしたい'];
    suggestions.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = s;
      b.addEventListener('click', function () { send(s); });
      sugg.appendChild(b);
    });

    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });

    function open() {
      panel.classList.add('open'); fab.classList.add('hide');
      if (!history.length && !body.querySelector('.chat-msg')) {
        addMsg('assistant', 'こんにちは！エコリースAIガイドです。設備リース・レンタル・ビルメンテナンスについて、お気軽にご質問ください。');
      }
      setTimeout(function () { input.focus(); }, 300);
    }
    function close() { panel.classList.remove('open'); fab.classList.remove('hide'); }
    fab.addEventListener('click', open);
    panel.querySelector('.x').addEventListener('click', close);
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildDock(); header(); drawer(); reveal(); wizardForm(); year(); aiChat();
  });
})();
