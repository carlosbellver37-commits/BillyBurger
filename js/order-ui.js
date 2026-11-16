/* Carrito, formulario y envío por WhatsApp. */
(function (root) {
  'use strict';
  const NT = root.NT;
  const { money, addLine, setQty, totalCents, countItems, validateOrder, buildMessage, buildWhatsappUrl, restoreCart, describeChoices, timeOptions, isOpenAt } = NT.core;
  const STORAGE_KEY = 'newtates.cart.v1';

  let cart = [];
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  function loadCart() {
    try {
      return restoreCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'), NT.MENU);
    } catch {
      return []; // Almacenamiento bloqueado o corrupto: se empieza con pedido vacío.
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.map(({ id, qty, choices }) => ({ id, qty, choices }))));
    } catch {
      /* Sin almacenamiento el pedido sigue funcionando en esta visita. */
    }
  }

  function lineNode(line) {
    const { el, imgPath } = NT.menuUI;
    const media = line.img ? el('img', { class: 'line__img', src: imgPath(line.img), alt: '' }) : el('span', { class: 'line__ph', 'aria-hidden': 'true', text: 'NT' });
    const qtyBtn = (delta, label, text) => el('button', { type: 'button', 'data-qty': delta, 'data-key': line.key, 'aria-label': `${label} ${line.name}`, text });
    return el('li', { class: 'line' }, [
      media,
      el('div', {}, [
        el('p', { class: 'line__name', text: line.name }),
        el('p', { class: 'line__opts', text: describeChoices(line) }),
      ]),
      el('div', { class: 'line__end' }, [
        el('span', { class: 'line__price', text: money(line.unitCents * line.qty) }),
        el('div', { class: 'qty' }, [qtyBtn(-1, 'Quitar uno de', '−'), el('output', { text: String(line.qty) }), qtyBtn(1, 'Añadir uno de', '+')]),
      ]),
    ]);
  }

  function render() {
    const count = countItems(cart);
    $('[data-lines]').replaceChildren(...cart.map(lineNode));
    $$('[data-cart-total]').forEach((n) => { n.textContent = money(totalCents(cart)); });
    $$('[data-cart-count]').forEach((n) => { n.textContent = String(count); });
    $('.pill__count').hidden = count === 0;
    $('[data-mobilebar]').hidden = count === 0;
    $('[data-empty]').hidden = count > 0;
    $('[data-order]').hidden = count === 0;
    $('.drawer__foot').hidden = count === 0;
    saveCart();
  }

  function commit(next) {
    cart = next;
    render();
  }

  function toast(text) {
    const node = $('[data-toast]');
    node.textContent = text;
    node.classList.add('is-on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('is-on'), 2200);
  }

  function add(item, choices) {
    commit(addLine(cart, item, choices));
    toast(`${item.name} va al pedido`);
    if (NT.motion) NT.motion.bump('.pill--order');
  }

  function fillTimes() {
    const { el } = NT.menuUI;
    const now = new Date();
    $('[data-time]').replaceChildren(...timeOptions(now, NT.HOURS).map((t) => el('option', { text: t })));
    $('[data-closed-hint]').hidden = isOpenAt(now, NT.HOURS);
  }

  function currentMode() {
    return new FormData($('[data-order]')).get('mode');
  }

  function syncMode() {
    const isDelivery = currentMode() === 'delivery';
    $('[data-address-field]').hidden = !isDelivery;
    $('[data-address-field]').style.display = isDelivery ? '' : 'none';
    $('[data-mode-hint]').textContent = isDelivery
      ? (NT.CONFIG.minDeliveryCents ? `Pedido mínimo a domicilio: ${money(NT.CONFIG.minDeliveryCents)}.` : 'Te lo llevamos. El local confirma el costo de envío.')
      : `Lo recoges en ${NT.CONFIG.address}.`;
    $('[data-time-label]').textContent = isDelivery ? '¿Para cuándo?' : '¿A qué hora vienes?';
    showErrors({});
  }

  function showErrors(errors) {
    $$('[data-error]').forEach((n) => { n.textContent = errors[n.dataset.error] || ''; });
    ['name', 'address'].forEach((f) => {
      const input = $(`[name="${f}"]`);
      if (errors[f]) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    });
    const first = ['name', 'address'].find((f) => errors[f]);
    if (first) $(`[name="${first}"]`).focus();
  }

  function readOrder() {
    const data = Object.fromEntries(new FormData($('[data-order]')));
    return { ...data, cart };
  }

  function send() {
    const order = readOrder();
    const errors = validateOrder(order);
    showErrors(errors);
    if (Object.keys(errors).length) return;
    const url = buildWhatsappUrl(NT.CONFIG.whatsapp, buildMessage(order));
    // Sin la opción 'noopener': con ella window.open devuelve siempre null y no se distingue un bloqueo.
    const win = window.open(url, '_blank');
    if (win) win.opener = null;
    else window.location.href = url; // Si el navegador bloquea la ventana, se abre aquí mismo.
    toast('Te llevamos a WhatsApp');
  }

  function openCart(mode) {
    if (mode) {
      const radio = $(`[name="mode"][value="${mode}"]`);
      if (radio) radio.checked = true;
      syncMode();
    }
    fillTimes();
    $('[data-cart]').showModal();
  }

  /* La lista se repinta en cada cambio: devuelve el foco al mismo botón o, si la línea ya no está, a uno cercano. */
  function restoreQtyFocus(key, delta) {
    const same = $$('[data-lines] [data-qty]').find((b) => b.dataset.key === key && b.dataset.qty === delta);
    const fallback = $('[data-lines] [data-qty]') || $('[data-cart] [data-close]');
    (same || fallback).focus();
  }

  function closeOnBackdrop(dialog) {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  function bindEvents() {
    $$('[data-open-cart]').forEach((b) => b.addEventListener('click', () => openCart()));
    $$('[data-start-mode]').forEach((b) => b.addEventListener('click', () => openCart(b.dataset.startMode)));
    $('[data-lines]').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-qty]');
      if (!btn) return;
      const line = cart.find((l) => l.key === btn.dataset.key);
      if (!line) return;
      const delta = btn.dataset.qty;
      commit(setQty(cart, line.key, line.qty + Number(delta)));
      restoreQtyFocus(line.key, delta);
    });
    $('[data-order]').addEventListener('change', (e) => { if (e.target.name === 'mode') syncMode(); });
    $('[data-order]').addEventListener('submit', (e) => { e.preventDefault(); send(); });
    $$('dialog').forEach((d) => {
      closeOnBackdrop(d);
      d.querySelectorAll('[data-close]').forEach((c) => c.addEventListener('click', () => d.close()));
      d.addEventListener('close', () => NT.motion && NT.motion.setScrollLock(!!document.querySelector('dialog[open]')));
    });
    $$('dialog').forEach((d) => new MutationObserver(() => {
      if (NT.motion) NT.motion.setScrollLock(!!document.querySelector('dialog[open]'));
    }).observe(d, { attributes: true, attributeFilter: ['open'] }));
  }

  function init() {
    cart = loadCart();
    bindEvents();
    syncMode();
    render();
  }

  NT.orderUI = Object.freeze({ init, add });
})(globalThis);
