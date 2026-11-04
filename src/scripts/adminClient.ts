import {
  loadStore,
  saveStore,
  resetStoreToDefaults,
  subscribeStore,
  addRegistration,
  getSupabaseConfig,
  setSupabaseConfig,
  withBase,
  type BmtStoreData,
  type ActivityItem
} from '../lib/bmtStore';

export function initAdminClient(): void {
  let store: BmtStoreData = loadStore();
  let currentCatFilter = 'all';
  let currentRegFilter = 'all';
  let editingActId: string | null = null;

  const toastEl = document.getElementById('adminToast')!;
  let toastTimer: any = null;
  function showToast(msg: string) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function escapeHtml(s: string): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Fallback for <dialog closedby="any"> per modern-web-guidance dialog guide
  if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
    const outside = (e: PointerEvent, dialog: HTMLDialogElement) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e, dialog)) dialog.close();
      });
    }
  }

  /* ===== TABS NAVIGATION ===== */
  document.querySelectorAll<HTMLButtonElement>('.adm-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab!;
      document.querySelectorAll('.adm-tab').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('on', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      document.querySelectorAll<HTMLElement>('.adm-panel').forEach((p) => {
        p.classList.toggle('on', p.dataset.panel === tab);
      });
    });
  });

  /* ===== KPI RENDER ===== */
  function renderKPIs() {
    const totalActs = store.activities.length;
    const openActs = store.activities.filter((a) => a.status === 'open');
    const freeSeats = openActs.reduce((acc, a) => acc + Math.max(0, (a.capacity || 0) - (a.occupied || 0)), 0);
    const totalRegs = store.registrations.length;
    const availMat = store.materials.reduce((acc, m) => acc + (m.available ? m.stock_available : 0), 0);

    document.getElementById('kpiActs')!.textContent = String(totalActs);
    document.getElementById('kpiSeats')!.textContent = String(freeSeats);
    document.getElementById('kpiRegs')!.textContent = String(totalRegs);
    document.getElementById('kpiMat')!.textContent = String(availMat);
    document.getElementById('tabRegCount')!.textContent = String(totalRegs);

    const supaCfg = getSupabaseConfig();
    const modeBadge = document.getElementById('connBadge')!;
    if (supaCfg) {
      modeBadge.textContent = 'Conectado a Supabase (' + new URL(supaCfg.url).hostname + ')';
      modeBadge.classList.add('supa');
    } else {
      modeBadge.textContent = 'Modo Demo Local · Sincronización en Vivo';
      modeBadge.classList.remove('supa');
    }
  }

  /* ===== TAB 1: ACTIVITIES LIST ===== */
  function renderActivities() {
    const listEl = document.getElementById('admActList')!;
    const filtered = store.activities
      .filter((a) => currentCatFilter === 'all' || a.category === currentCatFilter)
      .sort((a, b) => a.sort_order - b.sort_order);

    listEl.innerHTML = filtered
      .map((a) => {
        const avail = Math.max(0, (a.capacity || 0) - (a.occupied || 0));
        const pct = a.capacity > 0 ? Math.min(100, Math.round(((a.occupied || 0) / a.capacity) * 100)) : 0;
        const catLabel =
          a.category === 'ikastaroa'
            ? 'Ikastaroa / Curso'
            : a.category === 'irteera'
              ? 'Irteera / Salida'
              : a.category === 'jardunaldia'
                ? 'Jardunaldia / Jornada'
                : 'Ekitaldia / Evento';

        return `
        <article class="adm-act-card" data-id="${escapeHtml(a.id)}">
          <div class="adm-act-thumb" style="background-image:url('${escapeHtml(
            withBase(a.image || '/img/hero-bg.jpg')
          )}')">
            <span class="adm-cat-pill">${escapeHtml(catLabel)}</span>
          </div>
          <div class="adm-act-main">
            <div class="adm-act-top">
              <div>
                <span class="adm-date-tag">${escapeHtml(a.date_badge_eu)} · ${escapeHtml(a.date_badge_es)}</span>
                <h3>${escapeHtml(a.title_eu)} <small>/ ${escapeHtml(a.title_es)}</small></h3>
              </div>
              <div class="adm-act-btns">
                <button type="button" class="btn-adm btn-adm--edit js-edit-act" data-id="${escapeHtml(a.id)}">
                  Editar ficha
                </button>
                <button type="button" class="btn-adm btn-adm--del js-del-act" data-id="${escapeHtml(a.id)}" aria-label="Eliminar actividad">
                  Eliminar
                </button>
              </div>
            </div>
            <p class="adm-act-desc">${escapeHtml(a.summary_eu)}</p>

            <div class="adm-controls-row">
              <div class="adm-ctrl-box">
                <label class="adm-ctrl-label" for="status-${escapeHtml(a.id)}">Estado en web</label>
                <select id="status-${escapeHtml(a.id)}" name="status" class="adm-select js-status-sel" data-id="${escapeHtml(a.id)}">
                  <option value="open" ${a.status === 'open' ? 'selected' : ''}>🟢 Inscripción abierta (Plazas visibles)</option>
                  <option value="full" ${a.status === 'full' ? 'selected' : ''}>🔴 Betea / Completo (Sin plazas)</option>
                  <option value="soon" ${a.status === 'soon' ? 'selected' : ''}>🕒 Laster / Próximamente</option>
                  <option value="closed" ${a.status === 'closed' ? 'selected' : ''}>⚪ Itxita / Cerrada</option>
                </select>
              </div>

              <div class="adm-ctrl-box">
                <span class="adm-ctrl-label">Ocupación: <b>${a.occupied}</b> / ${a.capacity} (${avail} libres)</span>
                <div class="adm-seat-stepper">
                  <button type="button" class="js-occ-step" data-id="${escapeHtml(a.id)}" data-delta="-1" aria-label="Restar plaza ocupada">−1 ocupada</button>
                  <div class="adm-progress"><span style="width:${pct}%" class="${avail === 0 ? 'full' : avail <= 5 ? 'warn' : ''}"></span></div>
                  <button type="button" class="js-occ-step" data-id="${escapeHtml(a.id)}" data-delta="1" aria-label="Sumar plaza ocupada">+1 ocupada</button>
                </div>
              </div>

              <div class="adm-ctrl-box adm-ctrl-checks">
                <label class="adm-chk">
                  <input type="checkbox" name="visible_in_cards" class="js-toggle-prop" data-id="${escapeHtml(a.id)}" data-prop="visible_in_cards" ${
                    a.visible_in_cards ? 'checked' : ''
                  }>
                  <span>En Tarjetas</span>
                </label>
                <label class="adm-chk">
                  <input type="checkbox" name="visible_in_calendar" class="js-toggle-prop" data-id="${escapeHtml(a.id)}" data-prop="visible_in_calendar" ${
                    a.visible_in_calendar ? 'checked' : ''
                  }>
                  <span>En Calendario</span>
                </label>
                <label class="adm-chk">
                  <input type="checkbox" name="registration_enabled" class="js-toggle-prop" data-id="${escapeHtml(a.id)}" data-prop="registration_enabled" ${
                    a.registration_enabled ? 'checked' : ''
                  }>
                  <span>Botón Inscribirse</span>
                </label>
              </div>
            </div>
          </div>
        </article>`;
      })
      .join('');

    // Bind events
    listEl.querySelectorAll<HTMLSelectElement>('.js-status-sel').forEach((sel) => {
      sel.onchange = () => {
        const act = store.activities.find((x) => x.id === sel.dataset.id);
        if (!act) return;
        act.status = sel.value as ActivityItem['status'];
        if (act.status === 'open' && !act.registration_enabled) {
          act.registration_enabled = true;
        }
        saveStore(store);
        showToast(`Estado actualizado: ${act.title_eu}`);
      };
    });

    listEl.querySelectorAll<HTMLButtonElement>('.js-occ-step').forEach((btn) => {
      btn.onclick = () => {
        const act = store.activities.find((x) => x.id === btn.dataset.id);
        if (!act) return;
        const delta = Number(btn.dataset.delta || 0);
        act.occupied = Math.max(0, Math.min(act.capacity || 999, (act.occupied || 0) + delta));
        if (act.capacity > 0 && act.occupied >= act.capacity) {
          act.status = 'full';
        } else if (act.status === 'full' && act.occupied < act.capacity) {
          act.status = 'open';
        }
        saveStore(store);
        showToast(`Plazas actualizadas en vivo (${act.occupied}/${act.capacity})`);
      };
    });

    listEl.querySelectorAll<HTMLInputElement>('.js-toggle-prop').forEach((chk) => {
      chk.onchange = () => {
        const act = store.activities.find((x) => x.id === chk.dataset.id) as any;
        if (!act) return;
        const prop = chk.dataset.prop!;
        act[prop] = chk.checked;
        saveStore(store);
        showToast(`Visibilidad actualizada: ${act.title_eu}`);
      };
    });

    listEl.querySelectorAll<HTMLButtonElement>('.js-edit-act').forEach((btn) => {
      btn.onclick = () => openActivityEditor(btn.dataset.id!);
    });

    listEl.querySelectorAll<HTMLButtonElement>('.js-del-act').forEach((btn) => {
      btn.onclick = () => {
        const act = store.activities.find((x) => x.id === btn.dataset.id);
        if (!act) return;
        if (confirm(`¿Seguro que deseas eliminar "${act.title_eu}"?`)) {
          store.activities = store.activities.filter((x) => x.id !== act.id);
          saveStore(store);
          showToast('Actividad eliminada');
        }
      };
    });
  }

  document.querySelectorAll<HTMLButtonElement>('.js-cat-filter').forEach((btn) => {
    btn.onclick = () => {
      currentCatFilter = btn.dataset.cat!;
      document.querySelectorAll('.js-cat-filter').forEach((b) => b.classList.toggle('on', b === btn));
      renderActivities();
    };
  });

  /* ===== ACTIVITY MODAL EDITOR (<dialog>) ===== */
  const actDialog = document.getElementById('actEditorDialog') as HTMLDialogElement;
  const actForm = document.getElementById('actEditorForm') as HTMLFormElement;

  actDialog.addEventListener('close', () => {
    actDialog.returnValue = '';
  });

  function openActivityEditor(actId: string | null) {
    editingActId = actId;
    const isNew = !actId;
    document.getElementById('actEditorTitle')!.textContent = isNew
      ? 'Crear nueva actividad'
      : 'Editar actividad';

    const a: ActivityItem = actId
      ? structuredClone(store.activities.find((x) => x.id === actId)!)
      : {
          id: 'ir-berria-' + Date.now().toString().slice(-4),
          category: 'irteera',
          sort_order: store.activities.length + 1,
          visible_in_cards: true,
          visible_in_calendar: true,
          title_eu: '',
          title_es: '',
          summary_eu: '',
          summary_es: '',
          date_badge_eu: 'Urria 18',
          date_badge_es: '18 de octubre',
          cal_day: '18',
          cal_month_eu: 'Urria',
          cal_month_es: 'Octubre',
          cal_subtitle_eu: 'Irteera',
          cal_subtitle_es: 'Salida',
          image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80&auto=format&fit=crop',
          capacity: 40,
          occupied: 0,
          status: 'open',
          registration_enabled: true,
          days: 1,
          level_eu: 'Ertaina',
          level_es: 'Media',
          info: {
            noiz: '',
            non: '',
            zer: '',
            geltokiak: ['07:00 Bilbo (Abando)', '07:15 Basauri (Miradores)'],
            prezioa: ['Bazkidea: 15 €', 'Ez-bazkidea: 20 €']
          }
        };

    (document.getElementById('ed-category') as HTMLSelectElement).value = a.category;
    (document.getElementById('ed-status') as HTMLSelectElement).value = a.status;
    (document.getElementById('ed-title-eu') as HTMLInputElement).value = a.title_eu;
    (document.getElementById('ed-title-es') as HTMLInputElement).value = a.title_es;
    (document.getElementById('ed-summary-eu') as HTMLTextAreaElement).value = a.summary_eu;
    (document.getElementById('ed-summary-es') as HTMLTextAreaElement).value = a.summary_es;
    (document.getElementById('ed-date-eu') as HTMLInputElement).value = a.date_badge_eu;
    (document.getElementById('ed-date-es') as HTMLInputElement).value = a.date_badge_es;
    (document.getElementById('ed-cal-day') as HTMLInputElement).value = a.cal_day;
    (document.getElementById('ed-cal-month-eu') as HTMLInputElement).value = a.cal_month_eu;
    (document.getElementById('ed-cal-month-es') as HTMLInputElement).value = a.cal_month_es;
    (document.getElementById('ed-capacity') as HTMLInputElement).value = String(a.capacity);
    (document.getElementById('ed-occupied') as HTMLInputElement).value = String(a.occupied);
    (document.getElementById('ed-days') as HTMLInputElement).value = String(a.days ?? 1);
    (document.getElementById('ed-level-eu') as HTMLInputElement).value = a.level_eu || 'Ertaina';
    (document.getElementById('ed-level-es') as HTMLInputElement).value = a.level_es || 'Media';
    (document.getElementById('ed-image') as HTMLInputElement).value = a.image || '';
    (document.getElementById('ed-non') as HTMLInputElement).value = a.info?.non || '';
    (document.getElementById('ed-ordutegia') as HTMLInputElement).value = a.info?.ordutegia || '';
    (document.getElementById('ed-geltokiak') as HTMLTextAreaElement).value = (a.info?.geltokiak || []).join('\n');
    (document.getElementById('ed-prezioa') as HTMLTextAreaElement).value = (a.info?.prezioa || []).join('\n');
    (document.getElementById('ed-cards') as HTMLInputElement).checked = a.visible_in_cards;
    (document.getElementById('ed-cal') as HTMLInputElement).checked = a.visible_in_calendar;
    (document.getElementById('ed-reg') as HTMLInputElement).checked = a.registration_enabled;

    actDialog.showModal();
  }

  document.getElementById('newActBtn')!.onclick = () => openActivityEditor(null);
  document.getElementById('closeActDialogBtn')!.onclick = () => actDialog.close('cancel');

  actForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleEu = (document.getElementById('ed-title-eu') as HTMLInputElement).value.trim();
    const titleEs = (document.getElementById('ed-title-es') as HTMLInputElement).value.trim() || titleEu;
    if (!titleEu) return;

    const category = (document.getElementById('ed-category') as HTMLSelectElement).value as ActivityItem['category'];
    const status = (document.getElementById('ed-status') as HTMLSelectElement).value as ActivityItem['status'];
    const summaryEu = (document.getElementById('ed-summary-eu') as HTMLTextAreaElement).value.trim();
    const summaryEs = (document.getElementById('ed-summary-es') as HTMLTextAreaElement).value.trim() || summaryEu;
    const dateEu = (document.getElementById('ed-date-eu') as HTMLInputElement).value.trim();
    const dateEs = (document.getElementById('ed-date-es') as HTMLInputElement).value.trim() || dateEu;
    const calDay = (document.getElementById('ed-cal-day') as HTMLInputElement).value.trim();
    const calMonthEu = (document.getElementById('ed-cal-month-eu') as HTMLInputElement).value.trim();
    const calMonthEs = (document.getElementById('ed-cal-month-es') as HTMLInputElement).value.trim() || calMonthEu;
    const capacity = Math.max(0, Number((document.getElementById('ed-capacity') as HTMLInputElement).value || 0));
    const occupied = Math.max(0, Number((document.getElementById('ed-occupied') as HTMLInputElement).value || 0));
    const days = Math.max(1, Number((document.getElementById('ed-days') as HTMLInputElement).value || 1));
    const levelEu = (document.getElementById('ed-level-eu') as HTMLInputElement).value.trim();
    const levelEs = (document.getElementById('ed-level-es') as HTMLInputElement).value.trim() || levelEu;
    const image = (document.getElementById('ed-image') as HTMLInputElement).value.trim();
    const non = (document.getElementById('ed-non') as HTMLInputElement).value.trim();
    const ordutegia = (document.getElementById('ed-ordutegia') as HTMLInputElement).value.trim();
    const geltokiak = (document.getElementById('ed-geltokiak') as HTMLTextAreaElement).value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const prezioa = (document.getElementById('ed-prezioa') as HTMLTextAreaElement).value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const visible_in_cards = (document.getElementById('ed-cards') as HTMLInputElement).checked;
    const visible_in_calendar = (document.getElementById('ed-cal') as HTMLInputElement).checked;
    const registration_enabled = (document.getElementById('ed-reg') as HTMLInputElement).checked;

    const existing = editingActId ? store.activities.find((x) => x.id === editingActId) : null;
    const updated: ActivityItem = {
      id: existing ? existing.id : 'act-' + Date.now().toString(36),
      category,
      sort_order: existing ? existing.sort_order : store.activities.length + 1,
      visible_in_cards,
      visible_in_calendar,
      title_eu: titleEu,
      title_es: titleEs,
      summary_eu: summaryEu,
      summary_es: summaryEs,
      date_badge_eu: dateEu,
      date_badge_es: dateEs,
      cal_day: calDay,
      cal_month_eu: calMonthEu,
      cal_month_es: calMonthEs,
      cal_subtitle_eu: existing?.cal_subtitle_eu || non || (category === 'ikastaroa' ? 'Ikastaroa' : 'Irteera'),
      cal_subtitle_es: existing?.cal_subtitle_es || non || (category === 'ikastaroa' ? 'Curso' : 'Salida'),
      image: image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80&auto=format&fit=crop',
      capacity,
      occupied,
      status,
      registration_enabled,
      days,
      level_eu: levelEu,
      level_es: levelEs,
      info: {
        ...(existing?.info || {}),
        noiz: dateEu,
        ordutegia: ordutegia || existing?.info?.ordutegia,
        non: non || existing?.info?.non,
        zer: summaryEu,
        zailtasuna: levelEu,
        plazak: String(capacity),
        geltokiak,
        prezioa
      }
    };

    if (existing) {
      const idx = store.activities.findIndex((x) => x.id === existing.id);
      store.activities[idx] = updated;
    } else {
      store.activities.push(updated);
    }

    saveStore(store);
    actDialog.close('saved');
    showToast(existing ? `Actividad "${titleEu}" guardada` : `Nueva actividad "${titleEu}" publicada`);
  });

  /* ===== TAB 2: REGISTRATIONS ===== */
  function renderRegistrations() {
    const sel = document.getElementById('regActFilter') as HTMLSelectElement;
    const prevVal = currentRegFilter;
    sel.innerHTML =
      `<option value="all">Todas las actividades (${store.registrations.length})</option>` +
      store.activities
        .map((a) => {
          const cnt = store.registrations.filter((r) => r.activity_key === a.id).length;
          return `<option value="${escapeHtml(a.id)}" ${prevVal === a.id ? 'selected' : ''}>${escapeHtml(
            a.title_eu
          )} (${cnt})</option>`;
        })
        .join('');

    const rows = store.registrations.filter(
      (r) => currentRegFilter === 'all' || r.activity_key === currentRegFilter
    );

    const tbody = document.getElementById('regTableBody')!;
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted)">No hay inscripciones para este filtro. Prueba a inscribirte desde la web pública o pulsa "+ Simular inscripción".</td></tr>`;
      return;
    }

    tbody.innerHTML = rows
      .map((r) => {
        const dt = new Date(r.created_at).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
        return `
        <tr>
          <td><b>${escapeHtml(r.izena)} ${escapeHtml(r.abizenak)}</b><br><small>${escapeHtml(r.nan || '—')}</small></td>
          <td>${escapeHtml(r.activity_title)}</td>
          <td>${
            r.bazkidea
              ? `<span class="adm-badge ok">Bazkidea #${escapeHtml(r.bazkide_zenbakia || '—')}</span>`
              : `<span class="adm-badge">Ez-bazkidea</span>`
          }</td>
          <td><a href="tel:${escapeHtml(r.telefonoa)}">${escapeHtml(r.telefonoa || '—')}</a><br><small>${escapeHtml(
            r.eposta
          )}</small></td>
          <td>${escapeHtml(r.oharrak || '—')}</td>
          <td><small>${escapeHtml(dt)}</small></td>
          <td>
            <button type="button" class="btn-adm btn-adm--del js-del-reg" data-id="${escapeHtml(r.id)}">Dar de baja</button>
          </td>
        </tr>`;
      })
      .join('');

    tbody.querySelectorAll<HTMLButtonElement>('.js-del-reg').forEach((btn) => {
      btn.onclick = () => {
        const reg = store.registrations.find((x) => x.id === btn.dataset.id);
        if (!reg) return;
        store.registrations = store.registrations.filter((x) => x.id !== reg.id);
        const act = store.activities.find((a) => a.id === reg.activity_key);
        if (act && act.occupied > 0) {
          act.occupied--;
          if (act.status === 'full' && act.occupied < act.capacity) act.status = 'open';
        }
        saveStore(store);
        showToast(`Inscripción de ${reg.izena} eliminada (plaza liberada)`);
      };
    });
  }

  document.getElementById('regActFilter')!.addEventListener('change', (e) => {
    currentRegFilter = (e.target as HTMLSelectElement).value;
    renderRegistrations();
  });

  document.getElementById('simRegBtn')!.onclick = async () => {
    const names = [
      ['Leire', 'Mendieta Orozko', '78945123Z', '514', 'Miradores geltokian'],
      ['Iker', 'Zubizarreta Arana', '16077412B', '208', 'Menu begetarianoa'],
      ['Maialen', 'Urrutia Landa', '45892311X', '619', 'Kalero geltokian 06:40']
    ];
    const pick = names[Math.floor(Math.random() * names.length)];
    const targetAct =
      store.activities.find((a) => a.id === (currentRegFilter !== 'all' ? currentRegFilter : 'ir-bardenak-2026')) ||
      store.activities[0];

    await addRegistration({
      activity_key: targetAct.id,
      activity_title: targetAct.title_eu,
      izena: pick[0],
      abizenak: pick[1],
      nan: pick[2],
      jaiotza: '1992-07-15',
      telefonoa: '688 554 433',
      eposta: pick[0].toLowerCase() + '@baskoniamt-demo.eus',
      bazkidea: true,
      bazkide_zenbakia: pick[3],
      oharrak: pick[4]
    });
    showToast(`Nueva inscripción recibida en "${targetAct.title_eu}" (-1 plaza libre)`);
  };

  document.getElementById('exportCsvBtn')!.onclick = () => {
    const rows = store.registrations.filter(
      (r) => currentRegFilter === 'all' || r.activity_key === currentRegFilter
    );
    const headers = [
      'Actividad',
      'Nombre',
      'Apellidos',
      'DNI',
      'Fecha Nacimiento',
      'Telefono',
      'Email',
      'Socio',
      'Num Socio',
      'Observaciones',
      'Fecha Inscripcion'
    ];
    const csvLines = [
      headers.join(';'),
      ...rows.map((r) =>
        [
          r.activity_title,
          r.izena,
          r.abizenak,
          r.nan,
          r.jaiotza,
          r.telefonoa,
          r.eposta,
          r.bazkidea ? 'SI' : 'NO',
          r.bazkide_zenbakia,
          (r.oharrak || '').replace(/;/g, ','),
          r.created_at
        ]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(';')
      )
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `BMT-inscripciones-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Archivo CSV (compatible con Excel) descargado');
  };

  /* ===== TAB 3: MATERIAL & SHOP ===== */
  function renderMaterialsAndShop() {
    const matBox = document.getElementById('admMatGrid')!;
    matBox.innerHTML = store.materials
      .map(
        (m) => `
      <div class="adm-mat-card">
        <img src="${escapeHtml(withBase(m.image))}" alt="${escapeHtml(m.name_eu)}">
        <div class="adm-mat-body">
          <h3>${escapeHtml(m.name_eu)} <small>/ ${escapeHtml(m.name_es)}</small></h3>
          <div class="adm-mat-row">
            <label for="mat-price-${escapeHtml(m.id)}">Precio (€ / ${escapeHtml(m.unit_es)})</label>
            <input id="mat-price-${escapeHtml(m.id)}" name="price_eur" type="number" min="0" step="0.5" value="${
              m.price_eur
            }" class="adm-in-sm js-mat-price" data-id="${escapeHtml(m.id)}">
          </div>
          <div class="adm-mat-row">
            <span>Unidades disponibles: <b>${m.stock_available}</b> / ${m.stock_total}</span>
            <div class="adm-seat-stepper">
              <button type="button" class="js-mat-step" data-id="${escapeHtml(m.id)}" data-delta="-1">−1</button>
              <button type="button" class="js-mat-step" data-id="${escapeHtml(m.id)}" data-delta="1">+1</button>
            </div>
          </div>
          <label class="adm-chk" style="margin-top:.5rem">
            <input type="checkbox" name="available" class="js-mat-avail" data-id="${escapeHtml(m.id)}" ${
              m.available && m.stock_available > 0 ? 'checked' : ''
            }>
            <span>Mostrar como disponible en la web</span>
          </label>
        </div>
      </div>`
      )
      .join('');

    matBox.querySelectorAll<HTMLInputElement>('.js-mat-price').forEach((inp) => {
      inp.onchange = () => {
        const m = store.materials.find((x) => x.id === inp.dataset.id);
        if (!m) return;
        m.price_eur = Math.max(0, Number(inp.value || 0));
        saveStore(store);
        showToast(`Precio de ${m.name_eu} actualizado a ${m.price_eur} €`);
      };
    });

    matBox.querySelectorAll<HTMLButtonElement>('.js-mat-step').forEach((btn) => {
      btn.onclick = () => {
        const m = store.materials.find((x) => x.id === btn.dataset.id);
        if (!m) return;
        const d = Number(btn.dataset.delta || 0);
        m.stock_available = Math.max(0, Math.min(m.stock_total, m.stock_available + d));
        m.available = m.stock_available > 0;
        saveStore(store);
        showToast(`Stock de ${m.name_eu}: ${m.stock_available} disponibles`);
      };
    });

    matBox.querySelectorAll<HTMLInputElement>('.js-mat-avail').forEach((chk) => {
      chk.onchange = () => {
        const m = store.materials.find((x) => x.id === chk.dataset.id);
        if (!m) return;
        m.available = chk.checked;
        if (!m.available) m.stock_available = 0;
        else if (m.stock_available === 0) m.stock_available = m.stock_total;
        saveStore(store);
        showToast(`Estado de ${m.name_eu} actualizado`);
      };
    });

    // Club & Shop settings inputs
    (document.getElementById('set-office-eu') as HTMLInputElement).value = store.settings.office_hours_eu;
    (document.getElementById('set-office-es') as HTMLInputElement).value = store.settings.office_hours_es;
    (document.getElementById('set-shirt-price') as HTMLInputElement).value = String(store.settings.shirt_price_eur);
    (document.getElementById('set-shirt-sizes') as HTMLInputElement).value = store.settings.shirt_sizes.join(', ');
    (document.getElementById('set-shirt-where-eu') as HTMLInputElement).value = store.settings.shirt_where_eu;
    (document.getElementById('set-shirt-where-es') as HTMLInputElement).value = store.settings.shirt_where_es;
  }

  document.getElementById('shopSettingsForm')!.addEventListener('submit', (e) => {
    e.preventDefault();
    store.settings.office_hours_eu = (document.getElementById('set-office-eu') as HTMLInputElement).value.trim();
    store.settings.office_hours_es = (document.getElementById('set-office-es') as HTMLInputElement).value.trim();
    store.settings.shirt_price_eur = Number(
      (document.getElementById('set-shirt-price') as HTMLInputElement).value || 18
    );
    store.settings.shirt_sizes = (document.getElementById('set-shirt-sizes') as HTMLInputElement).value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    store.settings.shirt_where_eu = (document.getElementById('set-shirt-where-eu') as HTMLInputElement).value.trim();
    store.settings.shirt_where_es = (document.getElementById('set-shirt-where-es') as HTMLInputElement).value.trim();
    saveStore(store);
    showToast('Horario de oficina y tienda actualizados en vivo');
  });

  /* ===== TAB 4: WIKILOC & SUPABASE ===== */
  function renderWikiloc() {
    const wlList = document.getElementById('admWikiList')!;
    wlList.innerHTML = store.wikiloc
      .map(
        (w) => `
      <div class="adm-wl-row">
        <div>
          <b>${escapeHtml(w.title_eu)}</b> <small>(${escapeHtml(w.title_es)})</small>
          <div class="adm-wl-meta">Dificultad: ${escapeHtml(w.difficulty.toUpperCase())} · ${escapeHtml(
            w.km
          )} km · +${escapeHtml(w.up_m)} m</div>
        </div>
        <div style="display:flex;gap:.5rem;align-items:center">
          <a href="${escapeHtml(w.url)}" target="_blank" rel="noopener" class="btn-adm btn-adm--edit">Ver Track ↗</a>
          <button type="button" class="btn-adm btn-adm--del js-del-wl" data-id="${escapeHtml(w.id)}">Eliminar</button>
        </div>
      </div>`
      )
      .join('');

    wlList.querySelectorAll<HTMLButtonElement>('.js-del-wl').forEach((btn) => {
      btn.onclick = () => {
        store.wikiloc = store.wikiloc.filter((x) => x.id !== btn.dataset.id);
        saveStore(store);
        showToast('Ruta de Wikiloc eliminada');
      };
    });

    const cfg = getSupabaseConfig();
    if (cfg) {
      (document.getElementById('supa-url') as HTMLInputElement).value = cfg.url;
      (document.getElementById('supa-key') as HTMLInputElement).value = cfg.anonKey;
    }
  }

  document.getElementById('newWikiForm')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const tEu = (document.getElementById('wl-title-eu') as HTMLInputElement).value.trim();
    const tEs = (document.getElementById('wl-title-es') as HTMLInputElement).value.trim() || tEu;
    const diff = (document.getElementById('wl-diff') as HTMLSelectElement).value as 'erraza' | 'ertaina' | 'zaila';
    const km = (document.getElementById('wl-km') as HTMLInputElement).value.trim() || '—';
    const up = (document.getElementById('wl-up') as HTMLInputElement).value.trim() || '—';
    const down = (document.getElementById('wl-down') as HTMLInputElement).value.trim() || '—';
    const url = (document.getElementById('wl-url') as HTMLInputElement).value.trim();
    if (!tEu || !url) return;

    store.wikiloc.unshift({
      id: 'wl-' + Date.now().toString(36),
      title_eu: tEu,
      title_es: tEs,
      difficulty: diff,
      km,
      up_m: up,
      down_m: down,
      url
    });
    saveStore(store);
    (e.target as HTMLFormElement).reset();
    showToast(`Ruta "${tEu}" añadida al carrusel de Wikiloc`);
  });

  document.getElementById('supaConfigForm')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = (document.getElementById('supa-url') as HTMLInputElement).value.trim();
    const key = (document.getElementById('supa-key') as HTMLInputElement).value.trim();
    setSupabaseConfig(url, key);
    renderKPIs();
    showToast(url ? 'Conexión a Supabase guardada' : 'Modo Demo Local activado');
  });

  /* ===== RESET DEMO BUTTON ===== */
  document.getElementById('resetDemoBtn')!.onclick = () => {
    if (confirm('¿Quieres restaurar todos los datos originales de la demo (salidas, plazas, inscripciones y material)?')) {
      store = resetStoreToDefaults();
      renderAll();
      showToast('Datos originales de Baskonia Mendi Taldea restaurados');
    }
  };

  function renderAll() {
    store = loadStore();
    renderKPIs();
    renderActivities();
    renderRegistrations();
    renderMaterialsAndShop();
    renderWikiloc();
  }

  renderAll();
  subscribeStore(() => {
    renderAll();
  });
}
