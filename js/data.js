/* Datos del local y carta. Fuente: Take App de Billy Burgers (billyburgers, noviembre de 2026).
   Para cambiar precios o platos, edita solo este archivo. Precios en pesos uruguayos, guardados x100. */
(function (root) {
  'use strict';

  const CONFIG = Object.freeze({
    name: 'Billy Burgers',
    // Teléfono publicado en la ficha de Take App del local de Pocitos. CONFIRMAR que es el WhatsApp de pedidos.
    whatsapp: '59892780230',
    phone: '+59892780230',
    phoneLabel: '092 780 230',
    address: 'Brito del Pino 1114, Pocitos, Montevideo',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-34.9097409,-56.1592403',
    takeUrl: 'https://take.app/billyburgers',
    minDeliveryCents: 0, // CONFIRMAR: pedido mínimo a domicilio, si lo hay.
  });

  /* Horario de Pocitos (Take App), en minutos desde las 00:00. Índice 0 = domingo. Lunes y martes cerrado. */
  const hm = (h, m) => h * 60 + m;
  const HOURS = Object.freeze([
    { day: 'Domingo', slots: [[hm(19, 45), hm(23, 0)]] },
    { day: 'Lunes', slots: [] },
    { day: 'Martes', slots: [] },
    { day: 'Miércoles', slots: [[hm(20, 0), hm(22, 45)]] },
    { day: 'Jueves', slots: [[hm(20, 0), hm(22, 45)]] },
    { day: 'Viernes', slots: [[hm(20, 0), hm(22, 45)]] },
    { day: 'Sábado', slots: [[hm(19, 45), hm(22, 45)]] },
  ]);

  /* Los tres locales de Billy Burgers. */
  const LOCALES = Object.freeze([
    { name: 'Pocitos', address: 'Brito del Pino 1114', phone: '092 780 230', take: 'https://take.app/billyburgers' },
    { name: 'Prado', address: 'Av. Millán 4426', phone: '095 457 200', take: 'https://take.app/billyburgersprado' },
    { name: 'Punta Gorda', address: 'Av. Gral. José María Paz 1428, Galería Shopping Punta Gorda', phone: '092 780 230', take: 'https://take.app/billyburgerspuntagorda' },
  ]);

  const GROUPS = Object.freeze({});

  const CATEGORIES = Object.freeze([
    { id: 'ofertas', name: 'Ofertas', layout: 'cards' },
    { id: 'combos', name: 'Combos', layout: 'cards' },
    { id: 'burgers', name: 'Hamburguesas', layout: 'cards' },
    { id: 'papas', name: 'Papas', layout: 'cards' },
    { id: 'bebidas', name: 'Bebidas', layout: 'rows' },
  ]);

  const peso = (n) => n * 100;
  const dish = (cat, id, name, price, img, desc, tag, was) => ({ id, cat, name, cents: peso(price), img, desc: desc || '', groups: [], tag, wasCents: was ? peso(was) : 0 });
  const drink = (id, name, price, sub) => ({ id, cat: 'bebidas', name, cents: peso(price), img: null, desc: '', groups: [], sub });

  const MENU = Object.freeze([
    dish('ofertas', 'dobledeal', 'Doble Billy Deal', 799, 'doble-deal', 'Perfecto para compartir: dos deliciosas Billys con las mejores papas.', 'Oferta', 1160),
    dish('ofertas', 'crispy2', 'Crispy 2.0', 450, 'crispy2', 'Llegó la Crispy 2.0: ahora con doble carne y una cebolla aún más crocante y sabrosa que nunca.', 'Nuevo', 490),

    dish('combos', 'combo-americana', 'Americana + Papas Fritas', 485, 'combo-americana', 'Medallón de carne, queso cheddar, lechuga, tomate, cebolla y nuestra salsa Billy.'),
    dish('combos', 'combo-crispy', 'Crispy + Papas Fritas', 490, 'combo-crispy', 'Medallón de carne, queso cheddar, bacon y la cebolla crispy más crujiente.'),
    dish('combos', 'combo-cheese', 'CheeseBurger + Papas Fritas', 485, 'combo-cheese', 'Medallón de carne, queso cheddar, toque de cebolla y la combinación de ketchup y mostaza.'),
    dish('combos', 'combo-bigbilly', 'BigBilly + Papas Fritas', 490, 'combo-bigbilly', 'Medallón de carne, queso cheddar, pepinillos y un balance perfecto de lechuga.'),
    dish('combos', 'combo-chicken', 'BillyChicken + Papas', 499, 'combo-chicken', 'Pechuga de pollo crocante, queso cheddar, lechuga y mayonesa.'),

    dish('burgers', 'crispy', 'Hamburguesa Crispy simple', 370, 'crispy', 'Medallón de carne, queso cheddar, bacon y la cebolla crispy más crujiente.', 'Favorita'),
    dish('burgers', 'americana', 'Hamburguesa Americana simple', 360, 'americana', 'Medallón de carne, queso cheddar, lechuga, tomate, cebolla y nuestra salsa Billy.'),
    dish('burgers', 'cheese', 'Hamburguesa CheeseBurger simple', 360, 'cheese', 'Medallón de carne, queso cheddar, toque de cebolla y la combinación de ketchup y mostaza.'),
    dish('burgers', 'bigbilly', 'Hamburguesa BigBilly simple', 370, 'bigbilly', 'Medallón de carne, queso cheddar, pepinillos y un balance perfecto de lechuga.'),
    dish('burgers', 'chicken', 'BillyChicken', 380, 'chicken', 'Pechuga de pollo crocante, queso cheddar, lechuga y mayonesa.'),

    dish('papas', 'papas', 'Papas Fritas', 140, 'papas', 'Abundantes papas crujientes y deliciosas.'),

    drink('pepsi', 'Pepsi 500 ml', 110, 'Refrescos'),
    drink('sevenup', 'Seven Up sin azúcar 500 ml', 110, 'Refrescos'),
    drink('pepsiblack', 'Pepsi Black 500 ml', 110, 'Refrescos'),
    drink('salus', 'Agua Salus sin gas 600 ml', 110, 'Aguas'),
    drink('corona', 'Corona 355 ml', 180, 'Cervezas'),
  ]);

  const FEATURED = Object.freeze(['dobledeal', 'crispy2', 'combo-bigbilly', 'cheese', 'chicken', 'americana']);

  root.NT = Object.assign(root.NT || {}, { CONFIG, HOURS, LOCALES, GROUPS, CATEGORIES, MENU, FEATURED });
  if (typeof module !== 'undefined') module.exports = root.NT;
})(typeof globalThis !== 'undefined' ? globalThis : this);
