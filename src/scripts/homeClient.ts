import { I18N_ES } from '../data/i18n';
import {
  loadStore,
  subscribeStore,
  addRegistration,
  withBase,
  type BmtStoreData,
  type ActivityItem
} from '../lib/bmtStore';

declare global {
  interface Window {
    T: (s: string) => string;
    BMT_LANG: () => 'eu' | 'es';
    setLang: (l: 'eu' | 'es', save?: boolean) => void;
    i18nApply: (root?: Node) => void;
    pickMod: (id: string) => void;
    pickScope: (id: string) => void;
    pickAdd: (id: string) => void;
    jspdf?: any;
  }
}

export function initHomeClient(): void {
  const KEY = 'bmt-lang';
  let LANG: 'eu' | 'es' = (() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s === 'eu' || s === 'es') return s;
    } catch {
      // ignore
    }
    return 'eu';
  })();

  let currentStore: BmtStoreData = loadStore();

  function escapeHtml(s: string): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ===== I18N HELPERS ===== */
  function core(raw: string) {
    const m = raw.match(/^([\s\u00A0]*)([\s\S]*?)([\s\u00A0]*)$/);
    return m ? { pre: m[1], txt: m[2], post: m[3] } : { pre: '', txt: raw, post: '' };
  }
  function lookup(t: string): string | undefined {
    let v = I18N_ES[t];
    if (v === undefined) {
      const m = t.match(/^(\d+)\s+plaza$/);
      if (m) v = m[1] + ' plazas';
    }
    if (v === undefined) {
      const m2 = t.match(/^Lekuak:\s*(.+)$/);
      if (m2) v = 'Plazas: ' + m2[1];
    }
    return v;
  }
  function translate(raw: string): string | null {
    const c = core(raw);
    if (!c.txt) return null;
    const v = lookup(c.txt);
    return v === undefined ? null : c.pre + v + c.post;
  }

  window.T = (s: string) => {
    if (LANG !== 'es') return s;
    const v = lookup(String(s).trim());
    return v === undefined ? s : v;
  };
  window.BMT_LANG = () => LANG;

  const ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];
  function applyTo(root: Node = document.body) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentNode as HTMLElement | null;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA')
          return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-i18n-skip]')) return NodeFilter.FILTER_REJECT;
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes: any[] = [];
    let n: Node | null;
    while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach((node) => {
      if (node.__eu === undefined) node.__eu = node.nodeValue;
      if (LANG === 'eu') {
        if (node.nodeValue !== node.__eu) node.nodeValue = node.__eu;
        return;
      }
      const t = translate(node.__eu);
      if (t !== null && node.nodeValue !== t) node.nodeValue = t;
    });

    const rootEl = root as Element;
    if (rootEl.querySelectorAll) {
      const sel = ATTRS.map((a) => '[' + a + ']').join(',');
      rootEl.querySelectorAll(sel).forEach((el: any) => {
        if (el.closest('[data-i18n-skip]')) return;
        ATTRS.forEach((a) => {
          if (!el.hasAttribute(a)) return;
          const k = '__eu_' + a;
          if (el[k] === undefined) el[k] = el.getAttribute(a);
          if (LANG === 'eu') {
            el.setAttribute(a, el[k]);
            return;
          }
          const t = translate(el[k]);
          if (t !== null) el.setAttribute(a, t);
        });
      });
    }
  }

  function refreshSwitches() {
    document.querySelectorAll('.langsw').forEach((sw) => {
      sw.querySelectorAll('button').forEach((b) => {
        const btn = b as HTMLButtonElement;
        const on = btn.dataset.lang === LANG;
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
  }

  /* ===== HEADER & DRAWER ===== */
  const header = document.getElementById('header')!;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  const drawer = document.getElementById('drawer')!;
  document.getElementById('burger')!.onclick = () => drawer.classList.add('open');
  document.getElementById('drawerClose')!.onclick = () => drawer.classList.remove('open');
  drawer.querySelectorAll('a').forEach((a) => {
    (a as HTMLElement).onclick = () => drawer.classList.remove('open');
  });

  /* ===== INTERSECTION OBSERVERS ===== */
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 }
  );
  function observeReveals(root: ParentNode = document) {
    root.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
  }
  observeReveals();

  const cAnim = (el: HTMLElement) => {
    const t = +(el.dataset.target || 0);
    const s = el.dataset.suffix || '';
    const d = 1400;
    const st = performance.now();
    const yr = t > 1900;
    const fr = yr ? t - 60 : 0;
    const step = (n: number) => {
      const p = Math.min((n - st) / d, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(fr + (t - fr) * e);
      el.textContent = v.toLocaleString('eu') + s;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const sIO = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          cAnim(e.target as HTMLElement);
          sIO.unobserve(e.target);
        }
      }),
    { threshold: 0.6 }
  );
  document.querySelectorAll('.stat__num').forEach((el) => sIO.observe(el));

  /* ===== LIGHTBOX ===== */
  const lb = document.getElementById('lightbox')!;
  const lbImg = document.getElementById('lbImg') as HTMLImageElement;
  document.getElementById('lbClose')!.onclick = () => lb.classList.remove('open');
  lb.onclick = (e) => {
    if (e.target === lb) lb.classList.remove('open');
  };

  /* ===== REGISTRATION MODAL (#ficha) ===== */
  const ficha = document.getElementById('ficha')!;
  const fForm = document.getElementById('fichaForm')!;
  const fOk = document.getElementById('fichaOk')!;
  const bazkideSel = document.getElementById('f-bazkide') as HTMLSelectElement;
  const zbkWrap = document.getElementById('f-bazkidezbk-wrap')!;

  function toggleZbk() {
    zbkWrap.style.display = bazkideSel.value === 'bai' ? 'flex' : 'none';
  }
  bazkideSel.onchange = toggleZbk;
  let curAct: string | null = null;

  function openFicha(actId: string, title: string) {
    curAct = actId;
    document.getElementById('fichaTitle')!.textContent = title;
    fForm.style.display = 'block';
    fOk.style.display = 'none';
    bazkideSel.value = 'bai';
    toggleZbk();
    ['f-izena', 'f-abizenak', 'f-nan', 'f-jaiotza', 'f-tel', 'f-eposta', 'f-bazkidezbk', 'f-oharrak'].forEach(
      (id) => ((document.getElementById(id) as HTMLInputElement).value = '')
    );
    document.getElementById('detail')!.classList.remove('open');
    ficha.classList.add('open');
  }

  document.getElementById('fichaSubmit')!.onclick = async () => {
    const izena = (document.getElementById('f-izena') as HTMLInputElement).value.trim();
    const abizenak = (document.getElementById('f-abizenak') as HTMLInputElement).value.trim();
    const eposta = (document.getElementById('f-eposta') as HTMLInputElement).value.trim();
    if (!izena || !abizenak || !eposta) {
      alert(window.T('Bete izena, abizenak eta e-posta mesedez.'));
      return;
    }
    const bazkidea = bazkideSel.value === 'bai';
    const btn = document.getElementById('fichaSubmit') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = window.T('Bidaltzen…');
    try {
      const res = await addRegistration({
        activity_key: curAct || 'general',
        activity_title: document.getElementById('fichaTitle')!.textContent || '',
        izena,
        abizenak,
        nan: (document.getElementById('f-nan') as HTMLInputElement).value.trim(),
        jaiotza: (document.getElementById('f-jaiotza') as HTMLInputElement).value || '',
        telefonoa: (document.getElementById('f-tel') as HTMLInputElement).value.trim(),
        eposta,
        bazkidea,
        bazkide_zenbakia: bazkidea ? (document.getElementById('f-bazkidezbk') as HTMLInputElement).value.trim() : '',
        oharrak: (document.getElementById('f-oharrak') as HTMLTextAreaElement).value.trim()
      });
      fForm.style.display = 'none';
      fOk.style.display = 'block';
      const subEl = document.querySelector('#fichaOk .sub');
      if (subEl) {
        subEl.textContent =
          res.mode === 'supabase'
            ? window.T('Zure izen-ematea jaso dugu. Eskerrik asko.')
            : LANG === 'es'
              ? '¡Inscripción registrada en vivo! Ya puedes verla en el Backoffice (/admin) y ver cómo se ha descontado 1 plaza.'
              : 'Izen-ematea zuzenean gorde da! Dagoeneko Backoffice-an (/admin) ikus dezakezu eta plaza 1 jaitsi da.';
      }
    } catch (e: any) {
      alert('Errorea: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = window.T('Bidali izen-ematea');
    }
  };

  /* ===== ACTIVITY DETAIL MODAL (#detail) ===== */
  function actInfo(i: ActivityItem['info']) {
    if (!i) return '';
    const tStr = (s: string) => window.T(s);
    const val = (v: any) =>
      Array.isArray(v)
        ? '<ul class="dt-ul">' + v.map((x) => '<li>' + tStr(String(x)) + '</li>').join('') + '</ul>'
        : tStr(String(v));
    const row = (ic: string, k: string, v: any) =>
      v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)
        ? ''
        : '<div class="dt-row"><span class="dt-k"><i>' +
          ic +
          '</i>' +
          tStr(k) +
          '</span><span class="dt-v">' +
          val(v) +
          '</span></div>';
    const wl =
      i.wikiloc && i.wikiloc.length
        ? '<ul class="dt-ul">' +
          i.wikiloc
            .map((w) => '<li><a href="' + escapeHtml(w.u) + '" target="_blank" rel="noopener">' + escapeHtml(tStr(w.t)) + '</a></li>')
            .join('') +
          '</ul>'
        : '';
    return (
      '<div class="dt-sec"><h4>' +
      tStr('Informazioa') +
      '</h4><div class="dt-info">' +
      row('&#128197;', 'Noiz', i.noiz) +
      row('&#128347;', 'Ordutegia', i.ordutegia) +
      row('&#128205;', 'Non', i.non) +
      row('&#127956;', 'Zer', i.zer) +
      row('&#128506;', 'Planninga', i.planninga) +
      row('&#9968;', 'Zailtasuna', i.zailtasuna) +
      row('&#128652;', 'Irteera-orduak', i.geltokiak) +
      row('&#128101;', 'Plazak', i.plazak) +
      row('&#128181;', 'Prezioa', i.prezioa) +
      row('&#128179;', 'Ordainketa', i.ordainketa) +
      row('&#128221;', 'Izena ematea', i.izena) +
      row('&#127968;', 'Bulegoa', i.bulegoa) +
      row('&#128100;', 'Antolatzailea', i.antolatzailea) +
      row('&#128222;', 'Telefonoa', i.telefonoa) +
      row('&#128279;', 'Wikiloc', wl) +
      '</div></div>'
    );
  }

  function actLaster() {
    return (
      '<div class="dt-laster"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/></svg>' +
      '<div><b>' +
      window.T('Laster, informazio gehiago') +
      '</b><span>' +
      window.T(
        'Jarduera honen xehetasunak (ordutegia, prezioa, izen-ematea eta plazak) laster argitaratuko ditugu hemen bertan.'
      ) +
      '</span></div></div>'
    );
  }

  function getCategoryLabel(cat: ActivityItem['category']): string {
    if (LANG === 'es') {
      if (cat === 'ikastaroa') return 'Curso';
      if (cat === 'irteera') return 'Salida';
      if (cat === 'jardunaldia') return 'Jornada';
      return 'Evento';
    }
    if (cat === 'ikastaroa') return 'Ikastaroa';
    if (cat === 'irteera') return 'Irteera';
    if (cat === 'jardunaldia') return 'Jardunaldia';
    return 'Ekitaldia';
  }

  function formatSeatBadge(a: ActivityItem): { text: string; cls: string; available: number } {
    const available = Math.max(0, (a.capacity || 0) - (a.occupied || 0));
    if (a.status === 'soon') {
      return {
        text: LANG === 'es' ? 'Próximamente' : 'Laster',
        cls: 'lekuak laster-badge',
        available: 0
      };
    }
    if (a.status === 'closed') {
      return {
        text: LANG === 'es' ? 'Cerrado' : 'Itxita',
        cls: 'lekuak betea',
        available: 0
      };
    }
    if (a.status === 'full' || (a.capacity > 0 && available === 0)) {
      return {
        text: LANG === 'es' ? 'Completo (0 plazas)' : 'Betea (0 plaza)',
        cls: 'lekuak betea',
        available: 0
      };
    }
    if (a.capacity > 0) {
      const warn = available <= 6 ? ' warn' : '';
      const txt =
        a.occupied > 0
          ? LANG === 'es'
            ? `${available} / ${a.capacity} plazas libres`
            : `${available} / ${a.capacity} plaza libre`
          : LANG === 'es'
            ? `${a.capacity} plazas`
            : `${a.capacity} plaza`;
      return { text: txt, cls: 'lekuak' + warn, available };
    }
    return { text: '', cls: 'lekuak', available: 0 };
  }

  function openDetail(actId: string) {
    const a = currentStore.activities.find((x) => x.id === actId);
    if (!a) return;
    const title = LANG === 'es' ? a.title_es || a.title_eu : a.title_eu;
    const summary = LANG === 'es' ? a.summary_es || a.summary_eu : a.summary_eu;
    const dateBadge = LANG === 'es' ? a.date_badge_es || a.date_badge_eu : a.date_badge_eu;
    const level = LANG === 'es' ? a.level_es || a.level_eu : a.level_eu;
    const badge = formatSeatBadge(a);

    let stats = '';
    if (a.days != null || a.capacity > 0) {
      stats =
        '<div class="dt-stats">' +
        (a.days != null
          ? '<div class="dt-stat"><b>' + a.days + '</b><span>' + (LANG === 'es' ? 'días' : 'egun') + '</span></div>'
          : '') +
        (a.capacity > 0
          ? '<div class="dt-stat"><b>' +
            Math.max(0, a.capacity - (a.occupied || 0)) +
            ' / ' +
            a.capacity +
            '</b><span>' +
            (LANG === 'es' ? 'plazas libres' : 'plaza libre') +
            '</span></div>'
          : '') +
        '</div>';
    }

    const hasInfo = a.info && Object.keys(a.info).length > 0 && a.status !== 'soon';
    const s = hasInfo ? actInfo(a.info) : actLaster();
    const canRegister = a.registration_enabled && a.status === 'open' && badge.available > 0;
    const footBtn = canRegister
      ? `<div class="dt-foot"><button type="button" class="btn btn--primary" id="detailRegisterBtn">${
          LANG === 'es' ? 'Inscribirse ahora' : 'Izena eman orain'
        }</button></div>`
      : '';

    const detailBody = document.getElementById('detailBody')!;
    detailBody.setAttribute('data-i18n-skip', 'true');
    detailBody.innerHTML =
      '<div class="dt-head"><div class="dt-tags"><span class="dt-tag mota">' +
      escapeHtml(getCategoryLabel(a.category)) +
      '</span>' +
      (dateBadge ? '<span class="dt-tag">' + escapeHtml(dateBadge) + '</span>' : '') +
      (level ? '<span class="dt-tag">' + escapeHtml(level) + '</span>' : '') +
      (badge.text ? `<span class="${badge.cls}">${escapeHtml(badge.text)}</span>` : '') +
      '</div>' +
      '<h3>' +
      escapeHtml(title) +
      '</h3>' +
      (summary ? '<p class="dt-lead">' + escapeHtml(summary) + '</p>' : '') +
      stats +
      '</div>' +
      s +
      footBtn;

    const regBtn = document.getElementById('detailRegisterBtn');
    if (regBtn) {
      regBtn.onclick = () => openFicha(a.id, title);
    }

    document.getElementById('detail')!.classList.add('open');
  }

  /* ===== RENDER DYNAMIC STORE SECTIONS ===== */
  function renderStoreSections() {
    currentStore = loadStore();

    // 1. Office hours & Shop settings
    const officeSpan = document.getElementById('heroOfficeText');
    if (officeSpan) {
      const label = LANG === 'es' ? 'Oficina' : 'Bulegoa';
      const hrs = LANG === 'es' ? currentStore.settings.office_hours_es : currentStore.settings.office_hours_eu;
      officeSpan.innerHTML = `<b>${escapeHtml(label)}</b> ${escapeHtml(hrs)}`;
    }

    const dendaPrice = document.getElementById('dendaPriceVal');
    if (dendaPrice) {
      dendaPrice.textContent = `${currentStore.settings.shirt_price_eur} €`;
    }
    const dendaWhere = document.getElementById('dendaWhereVal');
    if (dendaWhere) {
      dendaWhere.textContent = LANG === 'es' ? currentStore.settings.shirt_where_es : currentStore.settings.shirt_where_eu;
    }
    const dendaSizes = document.getElementById('dendaSizesBox');
    if (dendaSizes) {
      dendaSizes.innerHTML = currentStore.settings.shirt_sizes
        .map((sz) => `<span>${escapeHtml(sz)}</span>`)
        .join('');
    }

    // 2. Ikastaroak (#ikastaroakGrid)
    const ikGrid = document.getElementById('ikastaroakGrid');
    if (ikGrid) {
      const courses = currentStore.activities
        .filter((a) => a.category === 'ikastaroa' && a.visible_in_cards)
        .sort((a, b) => a.sort_order - b.sort_order);

      ikGrid.innerHTML = courses
        .map((c) => {
          const title = LANG === 'es' ? c.title_es || c.title_eu : c.title_eu;
          const summary = LANG === 'es' ? c.summary_es || c.summary_eu : c.summary_eu;
          const badge = formatSeatBadge(c);
          const canReg = c.registration_enabled && c.status === 'open' && badge.available > 0;
          return `
          <article class="card reveal in" data-act="${escapeHtml(c.id)}" data-i18n-skip="true" style="cursor:pointer">
            <div class="card__img" style="background-image:url('${escapeHtml(withBase(c.image))}')"></div>
            <div class="card__body">
              <h3>${escapeHtml(title)}</h3>
              <p>${escapeHtml(summary)}</p>
              <div class="card__actions">
                ${badge.text ? `<span class="${badge.cls}" data-act="${escapeHtml(c.id)}">${escapeHtml(badge.text)}</span>` : '<span></span>'}
                ${
                  canReg
                    ? `<button type="button" class="btn btn--primary btn--sm js-reg-btn" data-act="${escapeHtml(c.id)}" data-title="${escapeHtml(title)}">${
                        LANG === 'es' ? 'Inscribirse' : 'Izena eman'
                      }</button>`
                    : ''
                }
              </div>
            </div>
          </article>`;
        })
        .join('');

      ikGrid.querySelectorAll('article[data-act]').forEach((card) => {
        card.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('.js-reg-btn')) return;
          openDetail((card as HTMLElement).dataset.act!);
        });
      });
    }

    // 3. Irteerak (#irteerakGrid)
    const irGrid = document.getElementById('irteerakGrid');
    if (irGrid) {
      const outings = currentStore.activities
        .filter((a) => a.category === 'irteera' && a.visible_in_cards)
        .sort((a, b) => a.sort_order - b.sort_order);

      irGrid.innerHTML = outings
        .map((r) => {
          const title = LANG === 'es' ? r.title_es || r.title_eu : r.title_eu;
          const summary = LANG === 'es' ? r.summary_es || r.summary_eu : r.summary_eu;
          const dateTag = LANG === 'es' ? r.date_badge_es || r.date_badge_eu : r.date_badge_eu;
          const badge = formatSeatBadge(r);
          const canReg = r.registration_enabled && r.status === 'open' && badge.available > 0;
          const statsHtml =
            r.days != null
              ? `<div class="route__stats">
                  <div class="route__stat"><b>${r.days}</b><span>${LANG === 'es' ? 'días' : 'egun'}</span></div>
                  ${r.km ? `<div class="route__stat"><b>${escapeHtml(r.km)}</b><span>km</span></div>` : ''}
                  ${r.elevation ? `<div class="route__stat"><b>${escapeHtml(r.elevation)}</b><span>m &#8597;</span></div>` : ''}
                </div>`
              : '';
          return `
          <article class="route reveal in" data-act="${escapeHtml(r.id)}" data-i18n-skip="true" style="background-image:url('${escapeHtml(withBase(r.image))}');cursor:pointer">
            <div class="route__top">
              <span class="route__tag">${escapeHtml(dateTag)}</span>
              ${badge.text ? `<span class="${badge.cls}">${escapeHtml(badge.text)}</span>` : ''}
            </div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(summary)}</p>
            ${statsHtml}
            ${
              canReg
                ? `<div class="route__actions"><button type="button" class="btn btn--primary btn--sm js-reg-btn" data-act="${escapeHtml(r.id)}" data-title="${escapeHtml(title)}">${
                    LANG === 'es' ? 'Inscribirse' : 'Izena eman'
                  }</button></div>`
                : ''
            }
          </article>`;
        })
        .join('');

      irGrid.querySelectorAll('article[data-act]').forEach((card) => {
        card.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('.js-reg-btn')) return;
          openDetail((card as HTMLElement).dataset.act!);
        });
      });
    }

    // 4. Jardunaldiak (#jardunaldiakGrid)
    const jaGrid = document.getElementById('jardunaldiakGrid');
    if (jaGrid) {
      const jard = currentStore.activities
        .filter((a) => a.category === 'jardunaldia' && a.visible_in_cards)
        .sort((a, b) => a.sort_order - b.sort_order);

      jaGrid.innerHTML = jard
        .map((j) => {
          const title = LANG === 'es' ? j.title_es || j.title_eu : j.title_eu;
          const summary = LANG === 'es' ? j.summary_es || j.summary_eu : j.summary_eu;
          const dateTag = LANG === 'es' ? j.date_badge_es || j.date_badge_eu : j.date_badge_eu;
          const badge = formatSeatBadge(j);
          return `
          <article class="route reveal in" data-act="${escapeHtml(j.id)}" data-i18n-skip="true" style="background-image:url('${escapeHtml(withBase(j.image))}');cursor:pointer">
            <div class="route__top">
              <span class="route__tag">${escapeHtml(dateTag)}</span>
              ${badge.text ? `<span class="${badge.cls}">${escapeHtml(badge.text)}</span>` : ''}
            </div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(summary)}</p>
          </article>`;
        })
        .join('');

      jaGrid.querySelectorAll('article[data-act]').forEach((card) => {
        card.addEventListener('click', () => openDetail((card as HTMLElement).dataset.act!));
      });
    }

    // Bind all .js-reg-btn buttons
    document.querySelectorAll('.js-reg-btn').forEach((btn) => {
      (btn as HTMLButtonElement).onclick = (e) => {
        e.stopPropagation();
        const el = e.currentTarget as HTMLElement;
        openFicha(el.dataset.act!, el.dataset.title!);
      };
    });

    // 5. Calendar rows (#egutegiaList)
    const calList = document.getElementById('egutegiaList');
    if (calList) {
      const calItems = currentStore.activities
        .filter((a) => a.visible_in_calendar)
        .sort((a, b) => a.sort_order - b.sort_order);

      calList.innerHTML = calItems
        .map((c) => {
          const title = LANG === 'es' ? c.title_es || c.title_eu : c.title_eu;
          const month = LANG === 'es' ? c.cal_month_es || c.cal_month_eu : c.cal_month_eu;
          const sub = LANG === 'es' ? c.cal_subtitle_es || c.cal_subtitle_eu : c.cal_subtitle_eu;
          const isJa = c.category === 'jardunaldia';
          const badge = formatSeatBadge(c);
          return `
          <div class="cal-row" data-act="${escapeHtml(c.id)}" data-i18n-skip="true">
            <div class="date">${escapeHtml(c.cal_day)}<small>${escapeHtml(month)}</small></div>
            <div class="what">${escapeHtml(title)}<span>${escapeHtml(sub)}${badge.text ? ` · ${escapeHtml(badge.text)}` : ''}</span></div>
            <div class="lvl ${isJa ? 'ja' : 'ir'}">${escapeHtml(getCategoryLabel(c.category))}</div>
          </div>`;
        })
        .join('');

      calList.querySelectorAll('.cal-row[data-act]').forEach((row) => {
        row.addEventListener('click', () => openDetail((row as HTMLElement).dataset.act!));
      });
    }

    // 6. Wikiloc routes (#wikiGrid)
    const wikiGrid = document.getElementById('wikiGrid');
    if (wikiGrid) {
      wikiGrid.innerHTML = currentStore.wikiloc
        .map((w) => {
          const title = LANG === 'es' ? w.title_es || w.title_eu : w.title_eu;
          const diffLabel =
            w.difficulty === 'erraza'
              ? LANG === 'es'
                ? 'Fácil'
                : 'Erraza'
              : w.difficulty === 'zaila'
                ? LANG === 'es'
                  ? 'Difícil'
                  : 'Zaila'
                : LANG === 'es'
                  ? 'Media'
                  : 'Ertaina';
          return `
          <article class="wiki-card reveal in" data-wtitle="${escapeHtml((w.title_eu + ' ' + w.title_es).toLowerCase())}" data-i18n-skip="true">
            <div class="wiki-card__map">
              <svg class="wiki-topo" viewBox="0 0 400 88" preserveAspectRatio="none" aria-hidden="true">
                <path d="M-10,60 C60,40 120,66 200,48 C280,32 340,58 410,42"/>
                <path d="M-10,72 C60,54 120,80 200,60 C280,46 340,70 410,56"/>
              </svg>
              <span class="wiki-diff ${w.difficulty}">${escapeHtml(diffLabel)}</span>
            </div>
            <div class="wiki-card__b">
              <h3>${escapeHtml(title)}</h3>
              <div class="wiki-meta">
                <span class="wiki-lvl ${w.difficulty}">${LANG === 'es' ? 'Dificultad:' : 'Zailtasuna:'} <b>${escapeHtml(diffLabel)}</b></span>
                <span class="wiki-num"><b>${escapeHtml(w.km)}</b> km</span>
                <span class="wiki-num up"><b>${escapeHtml(w.up_m)}</b> m &#8593;</span>
                <span class="wiki-num down"><b>${escapeHtml(w.down_m)}</b> m &#8595;</span>
              </div>
              <a class="btn btn--ghost-dark" href="${escapeHtml(w.url)}" target="_blank" rel="noopener">${
                LANG === 'es' ? 'Ver en Wikiloc' : 'Wikiloc-en ikusi'
              }</a>
            </div>
          </article>`;
        })
        .join('');
    }

    // 7. Material grid (#materialGrid)
    const matGrid = document.getElementById('materialGrid');
    if (matGrid) {
      matGrid.innerHTML = currentStore.materials
        .map((m) => {
          const name = LANG === 'es' ? m.name_es || m.name_eu : m.name_eu;
          const unit = LANG === 'es' ? m.unit_es || m.unit_eu : m.unit_eu;
          const isAvail = m.available && m.stock_available > 0;
          const stockText = isAvail
            ? LANG === 'es'
              ? `${m.stock_available} disponibles`
              : `${m.stock_available} eskuragarri`
            : LANG === 'es'
              ? 'Agotado'
              : 'Agortuta';
          return `
          <div class="mat-card" data-i18n-skip="true">
            <img src="${escapeHtml(withBase(m.image))}" alt="${escapeHtml(name)}">
            <div class="mat-card__b">
              <div>
                <h3>${escapeHtml(name)}</h3>
                <span class="mat-stock ${isAvail ? '' : 'out'}">${escapeHtml(stockText)}</span>
              </div>
              <div class="mat-card__price">${m.price_eur} €<small>${escapeHtml(unit)}</small></div>
            </div>
          </div>`;
        })
        .join('');
    }
  }

  window.i18nApply = (root?: Node) => applyTo(root || document.body);
  window.setLang = (l: 'eu' | 'es', save?: boolean) => {
    if (l !== LANG) {
      LANG = l;
      if (save !== false) {
        try {
          localStorage.setItem(KEY, l);
        } catch {
          // ignore
        }
      }
    }
    document.documentElement.setAttribute('lang', LANG);
    applyTo(document.body);
    renderStoreSections();
    refreshSwitches();
  };

  /* ===== STATIC MODALS & BUTTONS ===== */
  document.getElementById('historyBtn')!.onclick = () => document.getElementById('history')!.classList.add('open');
  document.getElementById('armarriaBtn')!.onclick = () => document.getElementById('armarria')!.classList.add('open');
  document.getElementById('egutegiaBtn')!.onclick = () =>
    document.getElementById('egutegiaModal')!.classList.add('open');

  /* ===== PWA INSTALL ===== */
  (function () {
    const btn = document.getElementById('installBtn') as HTMLButtonElement | null;
    const help = document.getElementById('installHelp');
    const note = document.getElementById('installNote');
    const modal = document.getElementById('installModal');
    if (help && modal) help.onclick = () => modal.classList.add('open');

    const standalone =
      matchMedia('(display-mode: standalone)').matches ||
      matchMedia('(display-mode: window-controls-overlay)').matches ||
      matchMedia('(display-mode: minimal-ui)').matches ||
      (navigator as any).standalone === true;
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const touch = navigator.maxTouchPoints > 0;
    let deferred: any = null;

    if (standalone) {
      if (btn) btn.style.display = 'none';
      if (help) help.style.display = 'none';
      if (note) note.textContent = 'Aplikazioa instalatuta duzu. Ondo etorri!';
      return;
    }

    addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      if (btn) {
        btn.disabled = false;
        btn.textContent = touch ? 'Instalatu aplikazioa' : 'Instalatu ordenagailuan';
      }
      if (note) note.textContent = '';
    });

    if (btn)
      btn.onclick = async () => {
        if (deferred) {
          deferred.prompt();
          let outcome = 'dismissed';
          try {
            outcome = (await deferred.userChoice).outcome;
          } catch {
            // ignore
          }
          deferred = null;
          if (note)
            note.textContent =
              outcome === 'accepted'
                ? 'Instalatzen… ikonoa zure pantailan agertuko da.'
                : 'Noiznahi instala dezakezu, botoi honetatik.';
          return;
        }
        if (modal) modal.classList.add('open');
      };

    if (ios && note) {
      note.textContent = 'iPhone eta iPaden, sakatu «Nola egin?» eta jarraitu Safariko urratsak.';
    } else if (!touch && btn) {
      btn.textContent = 'Instalatu ordenagailuan';
    }

    addEventListener('appinstalled', () => {
      if (btn) btn.style.display = 'none';
      if (note) note.textContent = 'Aplikazioa ondo instalatu da. Eskerrik asko!';
    });

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      addEventListener('load', () => navigator.serviceWorker.register(withBase('/sw.js')).catch(() => {}));
    }
  })();

  const fpb = document.getElementById('fedPrezioakBtn');
  if (fpb) fpb.onclick = () => document.getElementById('fedPrezioak')!.classList.add('open');
  [
    ['aterpeHistoriaBtn', 'aterpeHistoria'],
    ['aterpeTarifakBtn', 'aterpeTarifak'],
    ['aterpeArauakBtn', 'aterpeArauak']
  ].forEach(([b, m]) => {
    const el = document.getElementById(b);
    if (el) el.onclick = () => document.getElementById(m)!.classList.add('open');
  });

  const calBtn = document.getElementById('calDownloadAll');
  if (calBtn)
    calBtn.onclick = () => {
      const names = [
        'BMT-egutegia-2026.jpg',
        'BMT-bilerak-formazioak-jardunaldiak-2026.jpg',
        'BMT-irteerak-2026.jpg'
      ];
      document.querySelectorAll('.cal-page img').forEach((im, i) => {
        const img = im as HTMLImageElement;
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = img.src;
          a.download = names[i] || 'BMT-egutegia-' + (i + 1) + '.jpg';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, i * 350);
      });
    };

  document.querySelectorAll('.cal-page img, .zona-img, .armarri-fig img').forEach((el) => {
    el.addEventListener('click', () => {
      const img = el as HTMLImageElement;
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lb.classList.add('open');
    });
  });

  document.querySelectorAll('.gyear-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const y = (tab as HTMLElement).dataset.year;
      document.querySelectorAll('.gyear-tab').forEach((t) => t.classList.toggle('on', t === tab));
      document
        .querySelectorAll('.gyear-panel')
        .forEach((p) => p.classList.toggle('on', (p as HTMLElement).dataset.year === y));
    });
  });

  document.querySelectorAll('.gphoto').forEach((fg) => {
    fg.addEventListener('click', () => {
      const im = fg.querySelector('img');
      if (im) {
        lbImg.src = im.src;
        lbImg.alt = im.alt;
        lb.classList.add('open');
      }
    });
  });

  document.querySelectorAll('[data-close]').forEach((b) => {
    (b as HTMLElement).onclick = () => b.closest('.modal')!.classList.remove('open');
  });
  document.querySelectorAll('.modal').forEach((m) => {
    (m as HTMLElement).onclick = (e) => {
      if (e.target === m) m.classList.remove('open');
    };
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open,.lightbox.open').forEach((x) => x.classList.remove('open'));
      drawer.classList.remove('open');
    }
  });

  /* ===== WIKILOC SEARCH & RAIL ===== */
  (function () {
    const rail = document.getElementById('wikiGrid');
    if (!rail) return;
    const inp = document.getElementById('wikiSearch') as HTMLInputElement | null;
    const empty = document.getElementById('wikiEmpty');
    const prev = document.getElementById('wikiPrev') as HTMLButtonElement | null;
    const next = document.getElementById('wikiNext') as HTMLButtonElement | null;
    const cards = () => [...rail.querySelectorAll('.wiki-card')] as HTMLElement[];
    function step() {
      const c = rail!.querySelector('.wiki-card:not([hidden])');
      return c ? c.getBoundingClientRect().width + 19 : 300;
    }
    function upd() {
      if (!prev || !next) return;
      prev.disabled = rail!.scrollLeft <= 4;
      next.disabled = rail!.scrollLeft >= rail!.scrollWidth - rail!.clientWidth - 4;
    }
    if (prev) prev.onclick = () => rail.scrollBy({ left: -step(), behavior: 'smooth' });
    if (next) next.onclick = () => rail.scrollBy({ left: step(), behavior: 'smooth' });
    rail.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);

    let down = false,
      sx = 0,
      sl = 0,
      moved = false;
    rail.addEventListener('pointerdown', (e) => {
      down = true;
      moved = false;
      sx = e.clientX;
      sl = rail.scrollLeft;
      rail.classList.add('dragging');
    });
    rail.addEventListener('pointermove', (e) => {
      if (!down) return;
      const d = e.clientX - sx;
      if (Math.abs(d) > 4) moved = true;
      rail.scrollLeft = sl - d;
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
      rail.addEventListener(ev, () => {
        down = false;
        rail.classList.remove('dragging');
        upd();
      })
    );
    rail.addEventListener(
      'click',
      (e) => {
        if (moved) e.preventDefault();
      },
      true
    );

    if (inp)
      inp.addEventListener('input', () => {
        const q = inp.value.trim().toLowerCase();
        let n = 0;
        cards().forEach((c) => {
          const ok = !q || (c.dataset.wtitle || '').includes(q);
          c.hidden = !ok;
          c.style.display = ok ? '' : 'none';
          if (ok) n++;
        });
        if (empty) empty.classList.toggle('on', n === 0);
        rail.scrollLeft = 0;
        upd();
      });
    setTimeout(upd, 50);
  })();

  /* ===== FEDERATION SIMULATOR ===== */
  const FED: any = {
    mod: [
      { id: 'errekreatiboa', izena: 'Aisialdi-txartela', desc: '2013/01/01 ondoren jaiotakoak.' },
      {
        id: 'haurra',
        izena: 'Haurra',
        desc: '2013/01/01 – 2019/12/31 bitartean jaiotakoak. Foru Aldundiko baimenarekin.'
      },
      { id: 'gaztea', izena: 'Gaztea', desc: '2009/01/01 – 2012/12/31 bitartean jaiotakoak.' },
      { id: 'heldua', izena: 'Heldua', desc: '1962/01/01 – 2008/12/31 bitartean jaiotakoak.' },
      {
        id: 'onuraduna',
        izena: 'Onuraduna',
        desc: 'Nagusia edo 65 urtetik gorako kategoriakoak izanik, bizileku berean beste federatu batekin bizi diren federatuak.'
      },
      { id: 'nagusi65', izena: '65 urtetik gorakoa', desc: '1961/12/31 baino lehen jaiotakoak.' },
      {
        id: 'onuraduna65',
        izena: 'Onuraduna +65',
        desc: '65 urtetik gorakoa izanik, bizileku berean beste federatu batekin bizi dena.'
      }
    ],
    scope: [
      {
        id: 'estatua',
        izena: 'Estatua',
        desc: 'Espainiako lurraldea.',
        p: {
          errekreatiboa: 25.67,
          haurra: 25.67,
          gaztea: 31.39,
          heldua: 95.91,
          onuraduna: 87.55,
          nagusi65: 71.56,
          onuraduna65: 63.2
        }
      },
      {
        id: 'pirinioak',
        izena: 'Estatua + Pirinioak',
        desc: 'Espainia gehi Pirinioak (Frantzia/Andorra mugakideak).',
        p: {
          errekreatiboa: 44.66,
          haurra: 44.66,
          gaztea: 50.38,
          heldua: 114.9,
          onuraduna: 106.54,
          nagusi65: 90.55,
          onuraduna65: 82.19
        }
      },
      {
        id: 'mundua',
        izena: 'Mundua',
        desc: 'Mundu osoko estaldura.',
        p: {
          errekreatiboa: 91.58,
          haurra: 91.58,
          gaztea: 97.3,
          heldua: 161.82,
          onuraduna: 153.46,
          nagusi65: 137.47,
          onuraduna65: 129.11
        }
      },
      {
        id: 'fedme',
        izena: 'FEDME',
        desc: 'Estatuko federazioaren estaldura osagarria.',
        p: {
          errekreatiboa: 25.73,
          haurra: 25.73,
          gaztea: 28.59,
          heldua: 14.82,
          onuraduna: 14.82,
          nagusi65: 14.82,
          onuraduna65: 14.82
        }
      }
    ],
    addons: [
      { id: 'eski', izena: 'Eski alpinoa', p: 38.44, desc: 'Eski alpinoaren estaldura.' },
      { id: 'snow', izena: 'Snowboard', p: 50.99, desc: 'Snowboard-aren estaldura.' },
      { id: 'btt', izena: 'BTT (mendiko bizikleta)', p: 21.56, desc: 'Mendiko bizikletaren estaldura.' },
      { id: 'espedizioak', izena: 'Espedizioak', p: 2065.62, desc: 'Espedizio handietarako estaldura.' }
    ],
    kuota: { izena: 'Klubeko kuota', p: 2.0 }
  };

  let selMod = 'errekreatiboa',
    selScope = 'estatua';
  const selAdd = new Set<string>();
  function money(n: number) {
    return n.toLocaleString('eu', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }
  function calcTotal() {
    let t = FED.scope.find((s: any) => s.id === selScope).p[selMod] + FED.kuota.p;
    selAdd.forEach((id) => (t += FED.addons.find((a: any) => a.id === id).p));
    return t;
  }
  function renderCalc() {
    document.getElementById('calcMod')!.innerHTML = FED.mod
      .map(
        (m: any) =>
          `<label class="opt ${m.id === selMod ? 'sel' : ''}"><span class="t"><span><input type="radio" name="m" ${
            m.id === selMod ? 'checked' : ''
          } onchange="pickMod('${m.id}')">${window.T(m.izena)}</span></span>${
            m.desc ? `<span class="d">${window.T(m.desc)}</span>` : ''
          }</label>`
      )
      .join('');
    document.getElementById('calcScope')!.innerHTML = FED.scope
      .map((s: any) => {
        const pz = s.p[selMod];
        return `<label class="opt ${s.id === selScope ? 'sel' : ''}"><span class="t"><span><input type="radio" name="s" ${
          s.id === selScope ? 'checked' : ''
        } onchange="pickScope('${s.id}')">${window.T(s.izena)}</span><span class="pz">${money(
          pz
        )}</span></span><span class="d">${window.T(s.desc)}</span></label>`;
      })
      .join('');
    document.getElementById('calcAddons')!.innerHTML = FED.addons
      .map(
        (a: any) =>
          `<label class="opt ${selAdd.has(a.id) ? 'sel' : ''}"><span class="t"><span><input type="checkbox" ${
            selAdd.has(a.id) ? 'checked' : ''
          } onchange="pickAdd('${a.id}')">${window.T(a.izena)}</span><span class="pz">+${money(
            a.p
          )}</span></span><span class="d">${window.T(a.desc)}</span></label>`
      )
      .join('');
    document.getElementById('calcTotal')!.textContent = money(calcTotal());
  }
  window.pickMod = (id: string) => {
    selMod = id;
    renderCalc();
  };
  window.pickScope = (id: string) => {
    selScope = id;
    renderCalc();
  };
  window.pickAdd = (id: string) => {
    selAdd.has(id) ? selAdd.delete(id) : selAdd.add(id);
    renderCalc();
  };
  document.getElementById('openCalc')!.onclick = () => {
    renderCalc();
    document.getElementById('calc')!.classList.add('open');
  };

  document.getElementById('calcPdf')!.onclick = () => {
    const izInput = document.getElementById('c-izena') as HTMLInputElement;
    if (!izInput.value.trim()) {
      izInput.focus();
      izInput.reportValidity ? izInput.reportValidity() : alert(window.T('Mesedez, idatzi zure izena.'));
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const Y = [247, 196, 12],
      B = [23, 21, 19];
    let y = 20;
    doc.setFillColor(...B);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setFillColor(...Y);
    doc.rect(0, 26, 210, 2, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BASKONIA MENDI TALDEA', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(window.T('Federazio-simulazioa · 2026'), 14, 20);
    y = 40;
    doc.setTextColor(...B);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(window.T('Zure federazio-simulazioa'), 14, y);
    const cIz = ((document.getElementById('c-izena') as HTMLInputElement).value || '').trim();
    const cNan = ((document.getElementById('c-nan') as HTMLInputElement).value || '').trim();
    const cBz = ((document.getElementById('c-bazkide') as HTMLInputElement).value || '').trim();
    if (cIz || cNan || cBz) {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90);
      y += 6;
      if (cIz) {
        doc.text(window.T('Izen-abizenak: ') + cIz, 14, y);
        y += 5;
      }
      if (cNan) {
        doc.text(window.T('NAN / NIF: ') + cNan, 14, y);
        y += 5;
      }
      if (cBz) {
        doc.text(window.T('Bazkide zenbakia: ') + cBz, 14, y);
        y += 5;
      }
    }
    const mod = FED.mod.find((m: any) => m.id === selMod);
    const sc = FED.scope.find((s: any) => s.id === selScope);
    const rows = [
      [window.T('Lizentzia mota'), window.T(mod.izena), ''],
      [window.T('Estaldura-eremua'), window.T(sc.izena), money(sc.p[selMod])]
    ];
    selAdd.forEach((id) => {
      const a = FED.addons.find((x: any) => x.id === id);
      rows.push([window.T('Gehigarria'), window.T(a.izena), '+' + money(a.p)]);
    });
    rows.push([window.T(FED.kuota.izena), '', money(FED.kuota.p)]);
    y += 8;
    doc.setFontSize(10);
    rows.forEach((r) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...B);
      doc.text(String(r[0]), 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(r[1]), 70, y);
      doc.text(String(r[2]), 196, y, { align: 'right' });
      y += 6;
      doc.setDrawColor(220);
      doc.line(14, y - 2, 196, y - 2);
    });
    y += 4;
    doc.setFillColor(...B);
    doc.rect(14, y, 182, 11, 'F');
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(window.T('GUZTIRA (gutxi gorabehera)'), 18, y + 7);
    doc.setTextColor(...Y);
    doc.setFontSize(13);
    doc.text(money(calcTotal()), 192, y + 7.5, { align: 'right' });
    y += 20;
    doc.setTextColor(90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const txt = window.T(
      'Simulazio honek gutxi gorabeherako prezioak erakusten ditu, informazio-helburuetarako soilik. Federatzea klubaren egoitzan egiten da: Fleming doktorea 2, 48970 Basauri (Bizkaia).'
    );
    doc.text(doc.splitTextToSize(txt, 182), 14, y);
    doc.save('BMT-federazio-simulazioa.pdf');
  };

  /* ===== ACCORDIONS & REFUGE CALCULATOR ===== */
  const matBtn = document.getElementById('materialArauakBtn');
  const matPanel = document.getElementById('materialArauakPanel');
  if (matBtn && matPanel) {
    matBtn.addEventListener('click', () => {
      const o = matPanel.classList.toggle('open');
      matBtn.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  }

  const AC = { bazkide: 5, fede: 7, nag: 11, txiki: 7, gordailua: 12 };
  function acNum(id: string) {
    return Math.max(0, +(document.getElementById(id) as HTMLInputElement).value || 0);
  }
  function acCalc() {
    const g = Math.max(1, +(document.getElementById('ac-gauak') as HTMLInputElement).value || 1);
    const nB = acNum('ac-bazkide'),
      nF = acNum('ac-fede'),
      nN = acNum('ac-nag'),
      nT = acNum('ac-txiki');
    const ostatua = (nB * AC.bazkide + nF * AC.fede + nN * AC.nag + nT * AC.txiki) * g;
    const egurra = +(document.getElementById('ac-egurra') as HTMLSelectElement).value || 0;
    return { g, nB, nF, nN, nT, ostatua, egurra, gord: AC.gordailua, total: ostatua + egurra };
  }
  function acRender() {
    document.getElementById('acTotal')!.textContent = money(acCalc().total);
  }
  ['ac-gauak', 'ac-bazkide', 'ac-fede', 'ac-nag', 'ac-txiki', 'ac-egurra'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', acRender);
      el.addEventListener('change', acRender);
    }
  });
  const openAc = document.getElementById('openAterpeCalc');
  if (openAc)
    openAc.onclick = () => {
      acRender();
      document.getElementById('aterpeCalc')!.classList.add('open');
    };
  const acPdfBtn = document.getElementById('acPdf');
  if (acPdfBtn)
    acPdfBtn.onclick = () => {
      const acIz = document.getElementById('ac-izena') as HTMLInputElement;
      if (!acIz.value.trim()) {
        acIz.focus();
        acIz.reportValidity ? acIz.reportValidity() : alert(window.T('Mesedez, idatzi zure izena.'));
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const Y = [247, 196, 12],
        B = [23, 21, 19];
      let y = 20;
      doc.setFillColor(...B);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setFillColor(...Y);
      doc.rect(0, 26, 210, 2, 'F');
      doc.setTextColor(255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('BASKONIA MENDI TALDEA', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(window.T('Aterpearen erreserba · aurrekontua'), 14, 20);
      const r = acCalc();
      y = 40;
      doc.setTextColor(...B);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(window.T('Zure egonaldiaren aurrekontua'), 14, y);
      const izena = ((document.getElementById('ac-izena') as HTMLInputElement).value || '').trim();
      const datak = ((document.getElementById('ac-data') as HTMLInputElement).value || '').trim();
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90);
      if (izena) {
        y += 6;
        doc.text(window.T('Izen-abizenak: ') + izena, 14, y);
      }
      if (datak) {
        y += 5;
        doc.text(window.T('Datak: ') + datak, 14, y);
      }
      y += 5;
      doc.text(window.T('Gau kopurua: ') + r.g, 14, y);
      const rows: [string, string][] = [];
      if (r.nB) rows.push([window.T('Bazkideak') + ' (' + r.nB + ' x 5 EUR x ' + r.g + ' gau)', money(r.nB * 5 * r.g)]);
      if (r.nF)
        rows.push([window.T('Federatuak') + ' (' + r.nF + ' x 7 EUR x ' + r.g + ' gau)', money(r.nF * 7 * r.g)]);
      if (r.nN)
        rows.push([
          window.T('Bazkide ez, adin nagusiak') + ' (' + r.nN + ' x 11 EUR x ' + r.g + ' gau)',
          money(r.nN * 11 * r.g)
        ]);
      if (r.nT)
        rows.push([
          window.T('Bazkide ez, adin txikikoak') + ' (' + r.nT + ' x 7 EUR x ' + r.g + ' gau)',
          money(r.nT * 7 * r.g)
        ]);
      if (r.egurra) rows.push(['Egurra', money(r.egurra)]);
      if (!rows.length) rows.push([window.T('Ez da lagunik sartu'), '—']);
      y += 8;
      doc.setFontSize(10);
      rows.forEach((rw) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...B);
        doc.text(String(rw[0]), 14, y);
        doc.text(String(rw[1]), 196, y, { align: 'right' });
        y += 6;
        doc.setDrawColor(220);
        doc.line(14, y - 2, 196, y - 2);
      });
      y += 4;
      doc.setFillColor(...B);
      doc.rect(14, y, 182, 11, 'F');
      doc.setTextColor(255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(window.T('GUZTIRA (gutxi gorabehera)'), 18, y + 7);
      doc.setTextColor(...Y);
      doc.setFontSize(13);
      doc.text(money(r.total), 192, y + 7.5, { align: 'right' });
      y += 18;
      doc.setTextColor(...B);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(window.T('+ Diru gordailua: 12 EUR (derrigorrezkoa, erreserba-egunean ordaintzekoa eta itzulgarria).'), 14, y);
      doc.save('BMT-aterpea-aurrekontua.pdf');
    };

  /* ===== CAROUSELS ===== */
  document.querySelectorAll('.carousel').forEach((carEl) => {
    const car = carEl as HTMLElement;
    const track = car.querySelector('.carousel__track') as HTMLElement | null;
    const slides = [...car.querySelectorAll('.carousel__slide')] as HTMLElement[];
    const dots = [...car.querySelectorAll('.carousel__dots span')] as HTMLElement[];
    if (!track || slides.length < 2) return;
    let idx = 0,
      startX = 0,
      dx = 0,
      dragging = false,
      moved = false;
    const w = () => car.clientWidth;
    function go(i: number) {
      idx = Math.max(0, Math.min(slides.length - 1, i));
      track!.style.transform = 'translateX(' + -idx * 100 + '%)';
      dots.forEach((d, k) => d.classList.toggle('on', k === idx));
    }
    dots.forEach((d, k) =>
      d.addEventListener('click', (ev) => {
        ev.stopPropagation();
        go(k);
      })
    );
    const prev = car.querySelector('.prev'),
      next = car.querySelector('.next');
    if (prev)
      prev.addEventListener('click', (ev) => {
        ev.stopPropagation();
        go(idx - 1);
      });
    if (next)
      next.addEventListener('click', (ev) => {
        ev.stopPropagation();
        go(idx + 1);
      });
    car.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.carousel__nav,.carousel__dots')) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      dx = 0;
      track.classList.add('drag');
      if (car.setPointerCapture) car.setPointerCapture(e.pointerId);
    });
    car.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      track.style.transform = 'translateX(' + (-idx * 100 + (dx / w()) * 100) + '%)';
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      track!.classList.remove('drag');
      if (Math.abs(dx) > w() * 0.18) go(idx + (dx < 0 ? 1 : -1));
      else go(idx);
    }
    car.addEventListener('pointerup', end);
    car.addEventListener('pointercancel', end);
    slides.forEach((s) =>
      s.addEventListener('click', () => {
        if (moved) return;
        const m = s.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        if (m) {
          lbImg.src = m[1];
          lb.classList.add('open');
        }
      })
    );
  });

  /* ===== LANGUAGE SWITCHER INIT & LIVE STORE SUBSCRIPTION ===== */
  document.querySelectorAll('.langsw button').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      window.setLang(((b as HTMLElement).dataset.lang as 'eu' | 'es') || 'eu');
    });
  });

  window.setLang(LANG, false);
  subscribeStore(() => {
    renderStoreSections();
  });
}
