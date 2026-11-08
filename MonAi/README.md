# Mis gastos

Registro de gastos con IA, de uso personal, inspirado en el estilo de MonAi. HTML, CSS y JavaScript puro; la sincronización opcional usa Supabase JS desde CDN.

## Estructura

```
MonAi/                              raíz del repositorio
├─ .github/workflows/
│  └─ deploy-pages.yml              publica monai-gastos/ en GitHub Pages
├─ supabase/
│  └─ setup.sql                     tabla y políticas (RLS) para la sincronización
├─ .gitignore
├─ README.md
└─ monai-gastos/                    la app (es lo único que se publica)
   ├─ index.html                    marcado de la app
   ├─ manifest.json                 datos para instalarla como PWA
   ├─ service-worker.js             caché para uso sin conexión
   ├─ icons/                        íconos 192 y 512
   ├─ css/
   │  ├─ base.css                   variables, reset, tipografía
   │  ├─ components.css             pantalla principal
   │  └─ sheets.css                 hojas de agregar, configuración y cuentas
   └─ js/
      ├─ main.js                    punto de entrada
      ├─ state.js                   estado y localStorage
      ├─ sync.js                    sincronización con Supabase
      ├─ utils.js                   formato, toast, helpers
      ├─ parser.js                  "almuerzo 25 mil" sin IA
      ├─ ai.js                      Gemini
      ├─ voice.js                   dictado
      └─ ui/
         ├─ home.js                 pantalla principal
         ├─ addSheet.js             agregar movimiento
         ├─ settings.js             configuración
         └─ cash.js                 Mi dinero: cuentas, saldos y transferencias
```

## Cómo correrlo

Abre `monai-gastos/index.html` con doble clic y funciona en modo local. La biblioteca de Supabase se carga desde CDN para activar la sincronización.

Para instalarla como app en el celular y tener uso sin conexión, sírvela por HTTPS o `localhost` (`npx serve monai-gastos` o `python3 -m http.server 8000 --directory monai-gastos`): el service worker no se registra al abrir el archivo directamente.

## Sincronización entre dispositivos

La sincronización es opcional y usa Supabase. Crea un proyecto, ejecuta `supabase/setup.sql` en SQL Editor y copia la URL del proyecto junto con su clave publicable en Configuración. Nunca uses la `service_role` key en la app. Crea la cuenta desde el dispositivo que tenga los datos más completos; inicia sesión en los demás con el mismo correo y contraseña. Si Supabase exige confirmar el correo, confirma desde el mensaje antes de iniciar sesión.

Los movimientos, cuentas, transferencias y categorías se guardan en la tabla protegida `monai_user_data`. La clave de Gemini y la preferencia de modelo siguen siendo locales en cada dispositivo. En el plan gratuito de Supabase, los proyectos pueden pausarse tras una semana de inactividad; vuelve a activarlo desde Supabase si deja de responder.

Si agregas un archivo JS nuevo, añade su `<script>` en `monai-gastos/index.html`, antes de `main.js`, y su ruta en `FILES` de `service-worker.js`.

## Notas

- Los datos viven en `localStorage` del navegador. Exporta a CSV desde Configuración para respaldarlos.
- La API key de Gemini se guarda en el mismo `localStorage`; no publiques la app con tu clave dentro.
- Al cambiar archivos, sube `VERSION` en `monai-gastos/service-worker.js`.

## Publicar en GitHub Pages

En el repositorio: Settings → Pages → Source: **GitHub Actions**. Cada `git push` a `main` ejecuta `deploy-pages.yml` y publica solo la carpeta `monai-gastos/`. Todo lo que subas al repo es público: no guardes claves en los archivos.
