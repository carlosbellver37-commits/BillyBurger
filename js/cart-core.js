/* Lógica pura del pedido: sin DOM, con datos inmutables y precios en céntimos. */
(function (root) {
  'use strict';
  const NT = root.NT;
  const MAX_QTY = 50;

  const money = (cents) => `$ ${String(Math.round(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

  const groupsOf = (item) => item.groups.map((id) => NT.GROUPS[id]);

  function extrasCents(item, choices) {
    return groupsOf(item).reduce((sum, group) => {
      const picked = choices[group.id] || [];
      return sum + group.options.filter((o) => picked.includes(o.name)).reduce((s, o) => s + o.cents, 0);
    }, 0);
  }

  function lineKey(id, choices) {
    const parts = Object.keys(choices).sort().map((k) => `${k}=${[...choices[k]].sort().join('+')}`);
    return `${id}|${parts.join('|')}`;
  }

  function addLine(cart, item, choices, qty = 1) {
    const clean = Object.fromEntries(Object.entries(choices).filter(([, v]) => v && v.length));
    const key = lineKey(item.id, clean);
    if (cart.some((l) => l.key === key)) {
      return cart.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l));
    }
    return [...cart, { key, id: item.id, name: item.name, img: item.img, choices: clean, qty, unitCents: item.cents + extrasCents(item, clean) }];
  }

  function setQty(cart, key, qty) {
    if (qty <= 0) return cart.filter((l) => l.key !== key);
    return cart.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, MAX_QTY) } : l));
  }

  const totalCents = (cart) => cart.reduce((s, l) => s + l.unitCents * l.qty, 0);
  const countItems = (cart) => cart.reduce((s, l) => s + l.qty, 0);

  /* Devuelve un objeto campo → mensaje. Vacío significa pedido válido. */
  function validateOrder(order) {
    const errors = {};
    const isDelivery = order.mode === 'delivery';
    if (!order.cart.length) errors.cart = 'Añade algo a tu pedido.';
    else if (isDelivery && totalCents(order.cart) < NT.CONFIG.minDeliveryCents) {
      errors.cart = `El pedido mínimo a domicilio es de ${money(NT.CONFIG.minDeliveryCents)}.`;
    }
    if (!(order.name || '').trim()) errors.name = 'Dinos tu nombre.';
    if (isDelivery && !(order.address || '').trim()) errors.address = 'Necesitamos la dirección de entrega.';
    return errors;
  }

  const describeChoices = (line) => Object.values(line.choices).flat().join(', ');

  function buildMessage(order) {
    const isDelivery = order.mode === 'delivery';
    const lines = order.cart.map((l) => {
      const detail = describeChoices(l);
      return `• ${l.qty} x ${l.name} (${money(l.unitCents * l.qty)})${detail ? `\n   ${detail}` : ''}`;
    });
    const out = [
      `🍔 *NUEVO PEDIDO · ${NT.CONFIG.name}*`,
      `*${isDelivery ? 'A DOMICILIO' : 'RECOGER EN EL LOCAL'}*`,
      '',
      ...lines,
      '',
      `*Total: ${money(totalCents(order.cart))}*`,
      '',
      `Nombre: ${order.name.trim()}`,
    ];
    if (isDelivery) out.push(`Dirección: ${order.address.trim()}`);
    if (order.time) out.push(`${isDelivery ? 'Entrega' : 'Recogida'}: ${order.time}`);
    if (order.pay) out.push(`Pago: ${order.pay}`);
    if ((order.notes || '').trim()) out.push(`Notas: ${order.notes.trim()}`);
    return out.join('\n');
  }

  const buildWhatsappUrl = (phone, text) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

  function validChoices(item, choices) {
    if (!choices || typeof choices !== 'object') return false;
    const groups = groupsOf(item);
    return Object.entries(choices).every(([id, picked]) => {
      const group = groups.find((g) => g.id === id);
      return group && Array.isArray(picked) && picked.every((p) => group.options.some((o) => o.name === p));
    });
  }

  /* El carrito guardado no es de fiar: se reconstruye siempre desde la carta. */
  function restoreCart(saved, menu) {
    if (!Array.isArray(saved)) return [];
    return saved.reduce((cart, entry) => {
      const item = entry && menu.find((m) => m.id === entry.id);
      if (!item || !Number.isInteger(entry.qty) || entry.qty < 1 || !validChoices(item, entry.choices)) return cart;
      return addLine(cart, item, entry.choices, Math.min(entry.qty, MAX_QTY));
    }, []);
  }

  function isOpenAt(date, hours) {
    const minutes = date.getHours() * 60 + date.getMinutes();
    return hours[date.getDay()].slots.some(([from, to]) => minutes >= from && minutes < to);
  }

  const toClock = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  /* Minutos en los que se puede pedir dentro de un día: desde la apertura + margen de cocina y antes del cierre. */
  function daySlots(day, earliest, lead, step) {
    return day.slots.flatMap(([from, to]) => {
      const list = [];
      for (let m = from + lead; m < to; m += step) if (m >= earliest) list.push(m);
      return list;
    });
  }

  /* Horas ofrecidas al cliente. Con el local cerrado y sin horas hoy, propone las del próximo día de apertura. */
  function timeOptions(now, hours, lead = 30, step = 15) {
    const earliest = now.getHours() * 60 + now.getMinutes() + lead;
    const today = daySlots(hours[now.getDay()], earliest, lead, step).map(toClock);
    const asap = isOpenAt(now, hours) ? ['Lo antes posible'] : [];
    if (today.length || asap.length) return [...asap, ...today];
    for (let ahead = 1; ahead <= 7; ahead += 1) {
      const day = hours[(now.getDay() + ahead) % 7];
      const slots = daySlots(day, 0, lead, step);
      if (slots.length) return slots.map((m) => `${ahead === 1 ? 'Mañana' : day.day}, ${toClock(m)}`);
    }
    return [];
  }

  NT.core = Object.freeze({ money, addLine, setQty, totalCents, countItems, validateOrder, buildMessage, buildWhatsappUrl, restoreCart, isOpenAt, timeOptions, toClock, describeChoices, groupsOf });
})(typeof globalThis !== 'undefined' ? globalThis : this);
