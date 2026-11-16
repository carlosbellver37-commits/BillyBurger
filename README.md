# Billy Burgers · Web

Web estática, sin paso de compilación: se puede subir tal cual a cualquier hosting (Vercel, Netlify, GitHub Pages…).
Es una adaptación del diseño de New Tates BRGR con la marca, la carta y los locales de Billy Burgers (Montevideo).

- **Ver en local:** sirve la carpeta con `python3 -m http.server 4173` y abre `http://localhost:4173`.
- **Pruebas:** `node --test "tests/*.test.js"`.
- **Cambiar carta, precios, WhatsApp u horario:** todo está en `js/data.js`.
- **Colores y tipografía:** `css/billy.css` (azul de marca `#0063C6` sobre crema `#FFF1E6`, tipografía Caprasimo).

## Antes de publicar

1. Confirmar el WhatsApp de pedidos (`whatsapp` en `js/data.js`). Ahora es el teléfono de la ficha de Take App de Pocitos.
2. Confirmar los precios. Salen de la página de Take App (precio con descuento, no el tachado) y pueden ser distintos en el local o en PedidosYa.
3. Confirmar el pedido mínimo a domicilio (`minDeliveryCents`, ahora 0), la zona de reparto y las formas de pago.
4. El horario y el mapa son los de Pocitos. Prado y Punta Gorda aparecen con dirección y enlace a su Take App.
5. Pedir permiso al local para usar sus fotos y su logo, y añadir aviso legal y política de privacidad.

## Origen de los recursos

- `assets/cut/`: fotos de producto de la tienda de Take App de Billy Burgers.
- `assets/brand/`: logo de Billy Burgers (de su ficha en Take App), recortado y convertido a silueta.
- `assets/vendor/`: GSAP, ScrollTrigger y Lenis.
