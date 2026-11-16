/* Arranque de la página y bloque de horario. */
(function (root) {
  'use strict';
  const NT = root.NT;
  const { isOpenAt, toClock } = NT.core;
  const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

  const formatSlots = (slots) => slots.map(([a, b]) => `${toClock(a)}–${toClock(b)}`).join(' / ');

  function renderHours(now) {
    const { el } = NT.menuUI;
    const table = document.querySelector('[data-hours]');
    const body = el('tbody', {}, MONDAY_FIRST.map((d) => el('tr', { class: d === now.getDay() ? 'is-today' : '' }, [
      el('th', { scope: 'row', text: NT.HOURS[d].day }),
      el('td', { text: NT.HOURS[d].slots.length ? formatSlots(NT.HOURS[d].slots) : 'Cerrado' }),
    ])));
    table.append(body);
  }

  function nextOpening(now) {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = NT.HOURS[now.getDay()].slots.find(([from]) => from > minutes);
    if (today) return `hoy a las ${toClock(today[0])}`;
    for (let ahead = 1; ahead <= 7; ahead += 1) {
      const day = NT.HOURS[(now.getDay() + ahead) % 7];
      if (day.slots.length) return `${ahead === 1 ? 'mañana' : `el ${day.day.toLowerCase()}`} a las ${toClock(day.slots[0][0])}`;
    }
    return 'pronto';
  }

  function renderStatus(now) {
    const node = document.querySelector('[data-open-status]');
    const open = isOpenAt(now, NT.HOURS);
    node.classList.toggle('is-open', open);
    node.classList.toggle('is-closed', !open);
    node.querySelector('span').textContent = open ? 'Abierto ahora' : `Cerrado · Abrimos ${nextOpening(now)}`;
  }

  function init() {
    const now = new Date();
    NT.menuUI.init((item, choices) => NT.orderUI.add(item, choices));
    NT.orderUI.init();
    renderHours(now);
    renderStatus(now);
    NT.motion.init();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(globalThis);
