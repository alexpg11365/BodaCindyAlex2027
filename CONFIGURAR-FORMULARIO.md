# Conectar el formulario con Google Sheets

Las confirmaciones de la web se guardan en una hoja de Google Sheets vuestra y os llega un email con cada respuesta. Se configura una sola vez y se tarda unos 10 minutos. Mejor hacerlo desde el ordenador.

## 1. Crear la hoja

1. Con vuestra cuenta de Google iniciada, abrid <https://sheets.new>.
2. Ponedle de nombre, por ejemplo, **Confirmaciones boda Cindy & Alex**.

## 2. Pegar el código

1. En la hoja, menú **Extensiones → Apps Script**. Se abre el editor en otra pestaña.
2. Borrad todo lo que haya en `Código.gs`.
3. Abrid <https://raw.githubusercontent.com/alexpg11365/BodaCindyAlex2027/main/apps-script/Code.gs>, seleccionad todo, copiadlo y pegadlo en el editor.
4. Opcional: si el email de aviso tiene que llegar también a otra cuenta (por ejemplo, la de Cindy), escribidla en esta línea:
   ```js
   const AVISAR_TAMBIEN_A = ['cindy@ejemplo.com'];
   ```
5. Pulsad el icono de guardar (💾).

## 3. Preparar la hoja y dar permisos

1. En la barra de arriba del editor, en el desplegable de funciones, elegid **configurar** y pulsad **Ejecutar**.
2. Google pedirá permisos: **Revisar permisos** → elegid vuestra cuenta.
3. Saldrá "Google no ha verificado esta aplicación". Es normal, porque el script es vuestro: pulsad **Configuración avanzada** → **Ir a … (no seguro)** → **Permitir**.
4. Volved a la hoja: ahora tiene las pestañas **Confirmaciones** y **Resumen**.

## 4. Publicarlo como aplicación web

1. En el editor, botón azul **Implementar → Nueva implementación**.
2. En el engranaje de "Seleccionar tipo", elegid **Aplicación web**.
3. Rellenad:
   - **Descripción:** Formulario boda
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier usuario
4. Pulsad **Implementar** y copiad la **URL de la aplicación web**. Termina en `/exec`.

"Cualquier usuario" significa que cualquiera puede *enviar* una respuesta desde la web, como un buzón. Nadie más puede *ver* la hoja: solo vosotros.

## 5. Conectar la web

Pasad esa URL a Claude, o pegadla en `index.html`, en la línea:

```js
const RSVP_URL = '';
```

Al subir el cambio desaparece el aviso de "Formulario en pruebas" y las respuestas empiezan a llegar a la hoja.

## Qué recibís

- **Pestaña Confirmaciones:** una fila por invitado, con nombre, si viene, número de personas, alergias, menú, acompañante, canción y mensaje.
- **Pestaña Resumen:** totales de personas, respuestas sí/no, menús especiales y alergias.
- **Email** con cada respuesta nueva o cambiada.

Si un invitado cambia su respuesta desde el mismo móvil, se actualiza su fila en vez de crear otra.

## Si cambiáis el código más adelante

**Implementar → Gestionar implementaciones** → lápiz ✏️ → **Versión: Nueva versión** → **Implementar**. La URL no cambia.
