# proyecto-esp32
1. Abrir el código Arduino:
   - Abre Arduino IDE → `File -> Open` → selecciona `aquasense/arduino/post.ino`.

2. Instalar librerías necesarias:
   - En Arduino IDE → `Sketch -> Include Library -> Manage Libraries...`
   - Busca e instala las librerías listadas en la sección de Software (`OneWire`, `DallasTemperature`, `WiFi`, `HTTPClient`, etc.).

3. Configurar parámetros del código:
   - Si tu `post.ino` tiene credenciales de Wi-Fi o configuraciones de API, crea un archivo `config.h` o usa variables dentro de `post.ino`

4. Seleccionar placa y puerto:
   - Arduino IDE → `Tools -> Board -> ESP32 Dev Module`
   - Arduino IDE → `Tools -> Port -> COMX_ (el puerto donde está conectado tu ESP32)

5. Cargar el código al ESP32:
   - Arduino IDE → botón Upload (Flecha →)
