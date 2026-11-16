'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const NT = require('../js/data.js');
require('../js/cart-core.js');

const { addLine, setQty, totalCents, countItems, money, validateOrder, buildMessage, buildWhatsappUrl, restoreCart, isOpenAt, timeOptions } = NT.core;

const crispy = NT.MENU.find((i) => i.id === 'crispy');
const pepsi = NT.MENU.find((i) => i.id === 'pepsi');

test('addLine agrupa líneas idénticas y no muta el carrito original', () => {
  const empty = [];
  let cart = addLine(empty, crispy, {});
  cart = addLine(cart, crispy, {});
  assert.equal(empty.length, 0);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].qty, 2);
  assert.equal(cart[0].unitCents, 37000);
});

test('setQty con cero elimina la línea', () => {
  const cart = addLine([], pepsi, {});
  assert.deepEqual(setQty(cart, cart[0].key, 0), []);
});

test('totalCents y countItems no acumulan errores', () => {
  let cart = addLine([], pepsi, {});
  cart = setQty(cart, cart[0].key, 3);
  assert.equal(totalCents(cart), 33000);
  assert.equal(countItems(cart), 3);
});

test('money da pesos uruguayos con punto de miles', () => {
  assert.equal(money(48500), '$ 485');
  assert.equal(money(116000), '$ 1.160');
});

test('todos los platos de la carta tienen precio, categoría y foto o son bebidas', () => {
  const cats = new Set(NT.CATEGORIES.map((c) => c.id));
  for (const item of NT.MENU) {
    assert.ok(item.cents > 0, `${item.id} sin precio`);
    assert.ok(cats.has(item.cat), `${item.id} con categoría desconocida`);
    assert.ok(item.cat === 'bebidas' || item.img, `${item.id} sin foto`);
  }
  for (const id of NT.FEATURED) assert.ok(NT.MENU.some((m) => m.id === id), `destacado ${id} no existe`);
});

test('validateOrder rechaza carrito vacío, nombre vacío y domicilio sin dirección', () => {
  assert.ok(validateOrder({ cart: [], mode: 'pickup', name: 'Ana' }).cart);
  const cart = addLine([], crispy, {});
  assert.ok(validateOrder({ cart, mode: 'pickup', name: ' ' }).name);
  assert.ok(validateOrder({ cart, mode: 'delivery', name: 'Ana', address: '' }).address);
  assert.deepEqual(validateOrder({ cart, mode: 'pickup', name: 'Ana' }), {});
});

test('buildMessage incluye líneas, modo, dirección y total', () => {
  const cart = addLine([], crispy, {});
  const msg = buildMessage({ cart, mode: 'delivery', name: 'Ana', address: 'Brito del Pino 1114', time: 'Lo antes posible', pay: 'Efectivo', notes: 'Sin cebolla' });
  for (const s of ['A DOMICILIO', '1 x Hamburguesa Crispy simple', 'Brito del Pino 1114', 'Sin cebolla', 'Ana', '$ 370']) {
    assert.ok(msg.includes(s), `falta ${s}`);
  }
});

test('buildMessage de recogida no pide dirección', () => {
  const msg = buildMessage({ cart: addLine([], pepsi, {}), mode: 'pickup', name: 'Ana', address: 'NO', time: '21:00' });
  assert.ok(msg.includes('RECOGER EN EL LOCAL'));
  assert.ok(!msg.includes('NO'));
});

test('buildWhatsappUrl codifica el texto', () => {
  const url = buildWhatsappUrl('59800000000', 'Hola & adiós\n#1');
  assert.equal(url, 'https://wa.me/59800000000?text=Hola%20%26%20adi%C3%B3s%0A%231');
});

test('restoreCart descarta datos manipulados y recalcula precios desde la carta', () => {
  const saved = [
    { id: 'crispy', qty: 2, choices: {}, unitCents: 1 },
    { id: 'no-existe', qty: 1, choices: {} },
    { id: 'crispy', qty: -4, choices: {} },
    { id: 'crispy', qty: 1, choices: { extras: ['Oro'] } },
  ];
  const cart = restoreCart(saved, NT.MENU);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].unitCents, 37000);
  assert.deepEqual(restoreCart('basura', NT.MENU), []);
});

// 2026-11-11 es miércoles; 2026-11-09 lunes (cerrado); 2026-11-10 martes (cerrado).
test('timeOptions ofrece "Lo antes posible" solo con el local abierto', () => {
  const open = timeOptions(new Date(2026, 10, 11, 20, 30), NT.HOURS);
  assert.equal(open[0], 'Lo antes posible');
  const before = timeOptions(new Date(2026, 10, 11, 18, 0), NT.HOURS);
  assert.notEqual(before[0], 'Lo antes posible');
});

test('timeOptions no llega al minuto de cierre', () => {
  const options = timeOptions(new Date(2026, 10, 11, 18, 0), NT.HOURS);
  assert.ok(options.length > 0);
  assert.ok(options.every((t) => t < '22:45'));
});

test('timeOptions salta los días cerrados y propone el próximo día de apertura', () => {
  const monday = timeOptions(new Date(2026, 10, 9, 12, 0), NT.HOURS);
  assert.ok(monday.length > 0);
  assert.ok(monday[0].startsWith('Miércoles, '));
  const wednesdayLate = timeOptions(new Date(2026, 10, 11, 23, 0), NT.HOURS);
  assert.ok(wednesdayLate[0].startsWith('Mañana, '));
});

test('isOpenAt respeta el horario y los días cerrados', () => {
  assert.equal(isOpenAt(new Date(2026, 10, 9, 21, 0), NT.HOURS), false); // lunes cerrado
  assert.equal(isOpenAt(new Date(2026, 10, 11, 21, 0), NT.HOURS), true); // miércoles
  assert.equal(isOpenAt(new Date(2026, 10, 11, 23, 0), NT.HOURS), false);
  assert.equal(isOpenAt(new Date(2026, 10, 15, 22, 30), NT.HOURS), true); // domingo
});
