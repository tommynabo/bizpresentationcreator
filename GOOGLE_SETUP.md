# Cómo Configurar las Credenciales de Google (Obligatorio)

Para que el sistema pueda **crear y editar** presentaciones en tu Google Drive, necesitamos una "Identidad de Servicio" (un robot con permiso).

Sigue estos pasos (tardas 3-5 min):

## Paso 1: Crear Proyecto en Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un **Nuevo Proyecto** (ponle de nombre `BizSlides` o lo que quieras).

## Paso 2: Activar las APIs
Necesitamos activar 2 APIs para que el robot funcione:
1. En el menú, ve a **APIs y servicios > Biblioteca**.
2. Busca **"Google Drive API"** -> Dale a **Habilitar**.
3. Busca **"Google Slides API"** -> Dale a **Habilitar**.

## Paso 3: Crear la Cuenta de Servicio (El Robot)
1. Ve a **APIs y servicios > Credenciales**.
2. Dale a **+ CREAR CREDENCIALES** > **Cuenta de servicio**.
3. Nombre: `slides-bot` (o lo que quieras) > **Crear y continuar**.
4. En "Rol", elige **Propietario** (o Editor) > **Continuar** > **Listo**.

## Paso 4: Descargar la Llave (El JSON)
1. En la lista de Credenciales, verás la cuenta que acabas de crear (ej: `slides-bot@bizslides.iam.gserviceaccount.com`). Haz clic en su **email** (o en el lápiz).
2. Ve a la pestaña **CLAVES** (Keys).
3. **Agregar clave** > **Crear clave nueva** > Elige **JSON**.
4. Se descargará un archivo en tu ordenador.
5. **RENOMBRA** ese archivo a `service_account.json` y muévelo a la carpeta de tu proyecto (`/Users/tomas/Downloads/DOCUMENTOS/BIZSLIDESCREATOR`).

## Paso 5: Compartir la Plantilla (MUY IMPORTANTE)
El robot tiene su propio email (el que salía en el paso 4, tipo `...@....iam.gserviceaccount.com`).
Para que pueda copiar tu plantilla, tienes que invitarle:
1. Abre tu plantilla de Google Slides en el navegador.
2. Dale al botón **Compartir**.
3. Pega el email del robot (`slides-bot@...`) y dale permisos de **Editor**.
4. **IMPORTANTE**: Asegúrate de que usamos la ID correcta de la plantilla.
   - En tu navegador, la URL será algo así: `docs.google.com/presentation/d/ESTA_ES_LA_ID/edit`
   - Si tu plantilla es diferente a la que estaba en el JSON original, avísame para cambiar la ID en el código.

---
Una vez tengas el archivo `service_account.json` en la carpeta y la plantilla compartida con el email del robot, ¡todo funcionará!
