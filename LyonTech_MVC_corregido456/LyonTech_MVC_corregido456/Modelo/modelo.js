/* ============================================================
  Modelo/modelo.js — ÚNICO punto de comunicación con la API
  Métodos: get · post · put · del · usuarioActual
  ✓ Detecta automáticamente si corre desde la raíz (index.php/sistema.php)
    o desde Vista/ y ajusta la ruta de api/
  ✓ BLINDAJE: cualquier fallo del servidor produce un mensaje
    legible (código HTTP + fragmento de la respuesta), nunca un
    error genérico.
============================================================ */
const Modelo = {
    usuario: null,

    /* ---------- Ruta base hacia api/ ---------- */
    base() {
        const p = location.pathname.toLowerCase();
        return p.includes('/vista/') ? '../api/' : 'api/';
    },

    /* ---------- Núcleo de peticiones ---------- */
    async req(ruta, metodo = 'GET', cuerpo = null) {
        const op = { method: metodo, headers: {} };
        if (cuerpo !== null) {
            op.headers['Content-Type'] = 'application/json';
            op.body = JSON.stringify(cuerpo);
        }

        let r;
        try {
            r = await fetch(Modelo.base() + ruta, op);
        } catch {
            throw new Error('Sin conexión con el servidor (¿XAMPP encendido?).');
        }

        /* --- Leer la respuesta como texto SIEMPRE (una sola vez) --- */
        let texto = '';
        try { texto = await r.text(); } catch { texto = ''; }
        const fragmento = texto.trim().slice(0, 180);

        /* --- ¿El servidor respondió algo que no es JSON?
               (404 de archivo faltante, error fatal de PHP, etc.) --- */
        let j = null;
        try { j = JSON.parse(texto); }
        catch {
            if (r.status === 404) {
                throw new Error('Endpoint no encontrado (404): ' + ruta +
                    '. Verifica que el archivo exista en api/.');
            }
            throw new Error('HTTP ' + r.status + ' — ' +
                (fragmento || 'respuesta vacía del servidor.'));
        }

        /* --- Respuesta JSON pero con formato inesperado --- */
        if (typeof j !== 'object' || j === null || !('ok' in j)) {
            throw new Error('HTTP ' + r.status + ' — formato inesperado: ' + fragmento);
        }

        /* --- Respuesta JSON de error controlado de la API --- */
        if (!j.ok) throw new Error(j.error || 'Error desconocido.');

        return j.data;
    },

    /* ---------- Atajos CRUD ---------- */
    get:  p       => Modelo.req(p),
    post: (p, b)  => Modelo.req(p, 'POST',   b || {}),
    put:  (p, b)  => Modelo.req(p, 'PUT',    b || {}),
    del:  p       => Modelo.req(p, 'DELETE'),

    /* ---------- Usuario de la sesión actual (nunca lanza) ---------- */
    async usuarioActual() {
        try {
            Modelo.usuario = await Modelo.get('auth.php?action=current');
        } catch {
            Modelo.usuario = null;
        }
        return Modelo.usuario;
    }
};