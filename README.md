# Mi Entreno

App personal de ejercicios en casa: rutinas con temporizador, control de peso, calorías quemadas y cuánto te falta para tu objetivo. Tus datos se guardan en tu propio Google Drive.

No necesita servidor ni base de datos: son archivos estáticos (HTML, CSS y JS).

## Qué incluye

- **Hoy**: cuántos kg te faltan, % de progreso, tu ritmo real (kg/semana) y la fecha estimada en la que llegarás a tu meta.
- **Entrenar**: 10 rutinas (principiante, intermedio, avanzado, HIIT, abdomen, piernas y glúteos, tren superior, espalda, cardio sin saltos y estiramientos) y un editor para crear las tuyas. Durante el entreno hay cuenta atrás, pitidos, voz en español, descansos y la pantalla no se apaga.
- **Ejercicios**: 55 ejercicios con instrucciones paso a paso, consejo, nivel y calorías por minuto según tu peso.
- **Progreso**: gráfica de peso con la línea de tu meta, calorías por semana, historial de pesos y de entrenos.
- **Ajustes**: perfil, objetivo, gasto calórico diario estimado, Google Drive, copia manual (exportar e importar).

Las calorías se calculan con el método MET: `kcal = MET × 3,5 × peso ÷ 200 × minutos`.

## Paso 1 — Publicar la app gratis con GitHub Pages

Google solo permite iniciar sesión desde una dirección `https://`, así que la app tiene que estar publicada en internet. Con GitHub Pages es gratis.

1. Crea una cuenta en https://github.com si no tienes.
2. Crea un repositorio nuevo, por ejemplo `mi-entreno`. Puede ser público; tus datos **no** se guardan ahí, sino en tu Drive.
3. Sube todos los archivos de esta carpeta: **Add file → Upload files**.
4. Ve a **Settings → Pages**. En "Branch" elige `main` y la carpeta `/ (root)`, y pulsa **Save**.
5. En un par de minutos tendrás la app en `https://TU-USUARIO.github.io/mi-entreno/`.

## Paso 2 — Crear tu ID de cliente de Google (una sola vez, unos 10 minutos)

1. Entra en https://console.cloud.google.com y crea un proyecto (por ejemplo "Mi Entreno").
2. Ve a **APIs y servicios → Biblioteca**, busca **Google Drive API** y pulsa **Habilitar**.
3. Ve a **APIs y servicios → Pantalla de consentimiento de OAuth** (en la consola nueva se llama "Google Auth Platform"):
   - Tipo de usuario: **Externo**.
   - Nombre de la app: "Mi Entreno". Pon tu correo en los campos de contacto.
   - En **Público / Usuarios de prueba**, añade **tu propio correo de Gmail**. Solo las cuentas de esa lista podrán entrar.
   - En **Acceso a datos / Permisos (scopes)**, añade `.../auth/drive.appdata`.
4. Ve a **Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo: **Aplicación web**.
   - En **Orígenes de JavaScript autorizados**, añade `https://TU-USUARIO.github.io`. Va sin la barra final y sin `/mi-entreno`.
   - Pulsa **Crear** y copia el **ID de cliente**. Termina en `.apps.googleusercontent.com`.
5. En la app, ve a **Ajustes → Google Drive**, pega el ID y pulsa **Conectar con Google Drive**.

Cuando conectes, Google te dirá que la app "no está verificada". Es normal, porque la app es tuya y no está publicada para otros. Pulsa **Continuar**.

## Paso 3 — Instalarla en el móvil

Abre la dirección de la app en **Chrome** (Android) o **Safari** (iPhone):

- Android: menú ⋮ → **Instalar app** o **Añadir a pantalla de inicio**.
- iPhone: botón Compartir → **Añadir a pantalla de inicio**.

## Cómo funciona el guardado

- Todo se guarda **al instante en el móvil**, así que funciona sin internet.
- Si conectas Drive, se sube una copia a una **carpeta oculta y privada** de tu Drive (`appDataFolder`). Solo esta app puede leerla: no aparece entre tus archivos y nadie más tiene acceso.
- El permiso de Google dura 1 hora. Cuando caduca, el botón de arriba muestra **"☁︎ Toca para guardar"**: tócalo y se sincroniza.
- Si usas la app en dos dispositivos, los registros de ambos se combinan.
- Además puedes descargar una copia manual en **Ajustes → Descargar archivo**.

## Añadir o cambiar ejercicios

Edita `exercises.js`. Cada ejercicio es un bloque como este:

```js
{ id: 'squat', name: 'Sentadilla', groups: ['Piernas', 'Glúteos'], level: 1, met: 5.0, type: 'reps', n: 15,
  steps: ['Paso 1…', 'Paso 2…', 'Paso 3…'],
  tip: 'Consejo…' },
```

Copia uno, cambia el `id` (único) y los datos, y sube el archivo a GitHub. Después de cambiar archivos, sube también el número de `CACHE` en `sw.js` (por ejemplo `mi-entreno-v2`) para que el móvil descargue la versión nueva.

Valores MET orientativos: estiramientos 2–2,5 · fuerza suave 3–4 · fuerza intensa 5–6 · cardio intenso, burpees o saltos 8.

## Probarla en el ordenador

```bash
python3 -m http.server 8000
```

Después abre http://localhost:8000. Para probar Drive en local, añade también `http://localhost:8000` como origen autorizado en Google Cloud.
