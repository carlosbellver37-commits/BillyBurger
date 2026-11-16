/* Pinta la colección destacada, la carta por categorías y el diálogo de personalización. */
(function (root) {
  'use strict';
  const NT = root.NT;
  const { money, groupsOf } = NT.core;

  const imgPath = (name) => `assets/cut/${name}.webp`;
  const byId = (id) => NT.MENU.find((m) => m.id === id);

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'text') node.textContent = v;
      else if (k === 'class') node.className = v;
      else if (v !== undefined && v !== null) node.setAttribute(k, v);
    });
    children.forEach((c) => c && node.append(c));
    return node;
  }

  /* ---------- Colección ---------- */
  const TONES = ['cheddar', 'paper', 'ketchup', 'ink', 'cheddar', 'ketchup'];

  function featuredPanel(item, i) {
    return el('article', { class: 'panel', 'data-tone': TONES[i % TONES.length], 'data-panel-item': '' }, [
      el('span', { class: 'panel__ghost', 'aria-hidden': 'true', text: item.name.split(' ')[0] }),
      el('p', { class: 'panel__num micro', text: `${String(i + 1).padStart(2, '0')} / ${String(NT.FEATURED.length).padStart(2, '0')}` }),
      el('div', { class: 'panel__copy' }, [
        el('h3', { class: 'panel__name', text: item.name }),
        el('p', { class: 'panel__desc', text: item.desc }),
        el('div', { class: 'panel__buy' }, [
          el('span', { class: 'panel__price', text: money(item.cents) }),
          el('button', { class: 'panel__add', type: 'button', 'data-add': item.id, text: 'La quiero', 'aria-label': `Añadir ${item.name}` }),
        ]),
      ]),
      el('div', { class: 'panel__img' }, [
        el('img', { src: imgPath(item.img), alt: item.name, loading: 'lazy', 'data-panel-img': '' }),
      ]),
    ]);
  }

  function renderFeatured() {
    document.querySelector('[data-featured]').replaceChildren(...NT.FEATURED.map((id, i) => featuredPanel(byId(id), i)));
  }

  /* ---------- Carta ---------- */
  function card(item) {
    const media = item.img
      ? el('div', { class: 'card__media' }, [el('img', { src: imgPath(item.img), alt: '', loading: 'lazy' })])
      : el('div', { class: 'card__media card__media--type', 'aria-hidden': 'true', text: item.name.split(' ')[0] });
    return el('button', { class: 'card', type: 'button', 'data-add': item.id, 'aria-label': `Añadir ${item.name}, ${money(item.cents)}` }, [
      item.tag ? el('span', { class: 'card__tag', text: item.tag }) : null,
      media,
      el('span', { class: 'card__body' }, [
        el('span', { class: 'card__name', text: item.name }),
        item.desc ? el('span', { class: 'card__desc', text: item.desc }) : null,
        el('span', { class: 'card__foot' }, [
          el('span', { class: 'card__price', text: money(item.cents) }),
          el('span', { class: 'card__plus', 'aria-hidden': 'true', text: '+' }),
        ]),
      ]),
    ]);
  }

  function drinkRows(items) {
    const subs = [...new Set(items.map((i) => i.sub))];
    return el('div', { class: 'rows' }, subs.map((sub) => el('section', { class: 'rows__group' }, [
      el('h3', { class: 'rows__title micro', text: sub }),
      ...items.filter((i) => i.sub === sub).map((i) => el('button', { class: 'row', type: 'button', 'data-add': i.id }, [
        el('span', { text: i.name }),
        el('span', {}, [el('b', { text: money(i.cents), style: 'font-weight:400' }), el('i', { 'aria-hidden': 'true', text: '+' })]),
      ])),
    ])));
  }

  function renderPanel(catId) {
    const category = NT.CATEGORIES.find((c) => c.id === catId);
    const items = NT.MENU.filter((m) => m.cat === catId);
    const panel = document.querySelector('[data-panel]');
    const content = category.layout === 'rows' ? drinkRows(items) : el('div', { class: 'grid' }, items.map(card));
    panel.replaceChildren(content);
    panel.setAttribute('aria-labelledby', `tab-${catId}`);
    if (NT.motion) NT.motion.staggerIn(content.children);
  }

  function selectTab(catId, focus) {
    document.querySelectorAll('.tab').forEach((t) => {
      const on = t.dataset.cat === catId;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
      if (on) t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    });
    renderPanel(catId);
  }

  function initTabs() {
    const list = document.querySelector('[data-tabs]');
    list.replaceChildren(...NT.CATEGORIES.map((c) => el('button', {
      class: 'tab', type: 'button', role: 'tab', id: `tab-${c.id}`, 'data-cat': c.id, 'aria-selected': 'false', text: c.name,
    })));
    list.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab) selectTab(tab.dataset.cat);
    });
    list.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const ids = NT.CATEGORIES.map((c) => c.id);
      const i = ids.indexOf(document.activeElement.dataset.cat);
      if (i < 0) return;
      e.preventDefault();
      selectTab(ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length], true);
    });
    selectTab(NT.CATEGORIES[0].id);
  }

  /* ---------- Personalizar ---------- */
  const custom = {};

  function optionNode(group, opt, index) {
    const input = el('input', { type: group.type === 'one' ? 'radio' : 'checkbox', name: group.id, value: opt.name, 'data-cents': opt.cents });
    if (group.type === 'one' && index === 0) input.checked = true;
    return el('label', { class: 'opt' }, [
      input,
      el('span', {}, [document.createTextNode(opt.name), opt.cents ? el('em', { text: `+${money(opt.cents)}` }) : null]),
    ]);
  }

  function groupNode(group) {
    const legend = el('legend', { text: group.name });
    if (!group.required) legend.append(el('small', { text: 'opcional' }));
    return el('fieldset', { class: 'opt-group' }, [legend, el('div', { class: 'opts' }, group.options.map((o, i) => optionNode(group, o, i)))]);
  }

  function readChoices(item) {
    const data = new FormData(custom.form);
    return Object.fromEntries(groupsOf(item).map((g) => [g.id, data.getAll(g.id)]));
  }

  function updateCustomPrice() {
    const extra = [...custom.form.querySelectorAll('input:checked')].reduce((s, i) => s + Number(i.dataset.cents), 0);
    custom.price.textContent = money(custom.item.cents + extra);
  }

  function openCustom(item) {
    custom.item = item;
    custom.name.textContent = item.name;
    custom.desc.textContent = item.desc;
    custom.img.replaceChildren(...(item.img ? [el('img', { src: imgPath(item.img), alt: '' })] : []));
    custom.groups.replaceChildren(...groupsOf(item).map(groupNode));
    updateCustomPrice();
    custom.dialog.showModal();
  }

  function initCustom(onConfirm) {
    const q = (s) => document.querySelector(s);
    Object.assign(custom, {
      dialog: q('[data-custom]'), form: q('[data-custom-form]'), name: q('[data-custom-name]'), desc: q('[data-custom-desc]'),
      img: q('[data-custom-img]'), groups: q('[data-custom-groups]'), price: q('[data-custom-price]'),
    });
    custom.form.addEventListener('change', updateCustomPrice);
    custom.form.addEventListener('submit', (e) => {
      e.preventDefault();
      onConfirm(custom.item, readChoices(custom.item));
      custom.dialog.close();
    });
  }

  /* Un clic en cualquier [data-add]: directo al pedido o a personalizar si hay opciones. */
  function bindAddButtons(onAdd) {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-add]');
      if (!trigger) return;
      const item = byId(trigger.dataset.add);
      if (!item) return;
      if (item.groups.length) openCustom(item);
      else onAdd(item, {});
    });
  }

  function init(onAdd) {
    renderFeatured();
    initTabs();
    initCustom(onAdd);
    bindAddButtons(onAdd);
  }

  NT.menuUI = Object.freeze({ init, el, imgPath });
})(globalThis);
