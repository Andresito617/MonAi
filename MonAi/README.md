# MonAi
Registro de gastos con IA, de uso personal, inspirado en el estilo de MonAi. HTML, CSS y JavaScript puro (módulos ES), sin dependencias.

## Estructura

```
monai-gastos/
├─ index.html            marcado de la app
├─ manifest.json         datos para instalarla como PWA
├─ service-worker.js     caché para uso sin conexión
├─ icons/                íconos 192 y 512
├─ css/
│  ├─ base.css           variables, reset, tipografía
│  ├─ components.css     pantalla principal
│  └─ sheets.css         hojas de agregar y configuración
└─ js/
   ├─ main.js            punto de entrada
   ├─ state.js           estado y localStorage
   ├─ utils.js           formato, toast, helpers
   ├─ parser.js          "almuerzo 25 mil" sin IA
   ├─ ai.js              Gemini
   ├─ voice.js           dictado
   └─ ui/
      ├─ home.js         pantalla principal
      ├─ addSheet.js     agregar movimiento
      ├─ settings.js     configuración
      └─ cash.js         Mi dinero: cuentas, saldos y transferencias
```

## Cómo correrlo

Abre `index.html` con doble clic y funciona. Los scripts se cargan en orden desde `index.html` (utils, state, parser, ai, voice, ui/home, addSheet, settings, cash, main), por eso no hacen falta módulos ni servidor.

Para instalarla como app en el celular y tener uso sin conexión, sírvela por HTTPS o `localhost` (`npx serve .` o `python3 -m http.server 8000`): el service worker no se registra al abrir el archivo directamente.

Si agregas un archivo JS nuevo, añade su `<script>` en `index.html`, antes de `main.js`.

## Notas

- Los datos viven en `localStorage` del navegador. Exporta a CSV desde Configuración para respaldarlos.
- La API key de Gemini se guarda en el mismo `localStorage`; no publiques la app con tu clave dentro.
- Al cambiar archivos, sube `VERSION` en `service-worker.js`.
