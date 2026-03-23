# 🌊 **AQUASENSE** - Sistema IoT de Monitoreo de Calidad del Agua

Plataforma completa de monitoreo en tiempo real para acuicultura usando ESP32, Flask y MySQL.

---

## 📁 **ESTRUCTURA DEL PROYECTO**

```
proyecto-esp32/
├── backend/                    🔌 SERVIDOR FLASK (Puerto 5000)
│   ├── appi.py                 ← Archivo del servidor
│   ├── .env                    ← Credenciales BD (Clever Cloud)
│   └── requirements.txt         ← Dependencias Python
│
├── frontend/                   🌐 INTERFAZ WEB
│   ├── index.html              ← Dashboard principal
│   ├── login.html              ← Autenticación
│   ├── registro.html           ← Crear cuenta
│   ├── Histórico.html          ← Historial de datos
│   ├── alertas.html            ← Gestión de alertas
│   ├── sensores.html           ← Config sensores
│   ├── umbrales.html           ← Config rangos
│   ├── reportes.html           ← Generador reportes
│   ├── Dashboard.html          ← Dashboard oscuro
│   ├── css/style.css           ← Estilos
│   ├── js/app.js               ← Lógica JavaScript
│   └── img/logo.png
│
├── hardware/                   🔧 CÓDIGO ARDUINO
│   └── post.ino                ← Firmware ESP32
│
├── database/                   💾 BASE DE DATOS
│   └── esp32.sql               ← Schema SQL
│
├── docs/                       📚 DOCUMENTACIÓN
│   └── ANALISIS_COMPLETO.md    ← Análisis técnico completo
│
├── README.md                   ← Este archivo
├── .env                        ← Variables globales
└── .gitignore                  ← Archivos ignorados
```

---

## 🚀 **INICIO RÁPIDO - ENCENDER EL SERVIDOR**

### ✅ Opción A: Servidor Local (Recomendado para Desarrollo)

#### 1. Instalar Backend (Terminal 1)

```bash
# Ir a carpeta backend
cd backend

# Primera vez: Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python appi.py
```

**Debería mostrar:**
```
WARNING in werkzeug: Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

#### 2. Base de Datos MySQL (Terminal 2)

```bash
# Crear base de datos
mysql -u root -p

# En la terminal MySQL:
CREATE DATABASE esp32;
USE esp32;
source database/esp32.sql;
EXIT;
```

#### 3. Acceder Frontend (Navegador)

```
http://localhost:5000/frontend/index.html
```

**Login de prueba:**
- Email: `test@aquasense.com`
- Contraseña: `1234`

---

## 🎯 **VERIFICAR QUE FUNCIONA**

✅ Terminal backend muestra: `Running on http://127.0.0.1:5000`  
✅ Navegador carga dashboard sin errores  
✅ Punto verde pulsante en topbar (conexión OK)  
✅ Datos se actualizan cada 30 segundos  
✅ Puedes hacer login/registrarse  

---

## 📡 **HARDWARE - ESP32**

### Instalación Arduino

1. Abre `hardware/post.ino` en Arduino IDE
2. Instala librerías:
   - OneWire
   - DallasTemperature
   - WiFiManager
   - ArduinoJson

3. Selecciona:
   - Placa: **ESP32 Dev Module**
   - Puerto: **COM3** (o tu puerto)
   - Baud: **115200**

4. Carga (Ctrl+U)

### Cableado

```
GPIO 4  → DS18B20 (temperatura)
SDA/SCL → LCD 16x2 I2C
WiFi    → Automático
```

---

## 🔐 **CONFIGURACIÓN**

### Backend - Cambiar Base de Datos

**Editar `backend/appi.py` línea 16-19:**

```python
# Para Clever Cloud:
MYSQL_HOST = os.getenv('MYSQL_ADDON_HOST')
MYSQL_USER = os.getenv('MYSQL_ADDON_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_ADDON_PASSWORD')
MYSQL_DB = os.getenv('MYSQL_ADDON_DB')

# O para localhost:
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = ''
MYSQL_DB = 'esp32'
```

### Frontend - Cambiar IP del Servidor

**Opción 1: En consola del navegador (F12)**
```javascript
cambiarIP()  // Te pedirá la IP
```

**Opción 2: Editar `frontend/js/app.js` línea 6**
```javascript
CONFIG = {
  API_BASE_URL: getAPIBaseURL(),  // Cambiar 192.168.0.9
};
```

---

## 🐛 **RESOLVER PROBLEMAS**

| Problema | Solución |
|----------|----------|
| **CORS Error** | Backend ya tiene CORS habilitado |
| **No conecta a BD** | Verificar MySQL corriendo: `mysql -u root -p` |
| **Dashboard vacío** | Iniciar medición con botón "Iniciar medición" |
| **Sensores con valores raros** | 75% de sensores son simulados (normal en dev) |
| **Puerto 5000 en uso** | Cambiar en `appi.py`: `app.run(debug=True, port=5001)` |

---

## 📊 **PARÁMETROS MONITOREADOS**

| Sensor | Tipo | Rango | Unidad |
|--------|------|-------|--------|
| Temperatura | REAL (DS18B20) | 24-30 | °C |
| pH | Simulado | 6.5-8.5 | pH |
| Oxígeno | Simulado | 5-10 | mg/L |
| Turbidez | Simulado | 0-5 | NTU |

---

## 📚 **DOCUMENTACIÓN**

- **[ANÁLISIS_COMPLETO.md](docs/ANALISIS_COMPLETO.md)** - Arquitectura, endpoints, vacíos, próximos pasos
- Comentarios en código fuente
- Esquema BD: `database/esp32.sql`

---

## 🎯 **PRÓXIMOS PASOS (Roadmap)**

**Fase 1: Seguridad**
- [ ] Hash bcrypt para contraseñas
- [ ] JWT tokens en API
- [ ] HTTPS/TLS

**Fase 2: Sensores**
- [ ] Conectar pH real
- [ ] Conectar turbidez real
- [ ] Conectar O2 real

**Fase 3: Performance**
- [ ] WebSockets (tiempo real)
- [ ] Paginación BD
- [ ] Tests unitarios

---

## 📞 **AYUDA**

Revisar: `docs/ANALISIS_COMPLETO.md`
