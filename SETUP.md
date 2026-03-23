# 🔧 SETUP - Guía de Instalación Rápida

## ⚡ Pasos Rápidos (5 Minutos)

### 1. Instalar Python (si no lo tienes)
```bash
# Verificar si tienes Python
python --version

# Si no: Descargar desde https://www.python.org/
```

### 2. Instalar Dependencias Backend

```bash
cd backend
pip install -r requirements.txt
```

**Qué instala:**
- Flask (servidor web)
- Flask-MySQLdb (conexión a MySQL)
- Flask-Cors (permiso entre servidores)
- python-dotenv (variables de entorno)

### 3. Crear la Base de Datos

```bash
# Conectarse a MySQL
mysql -u root -p

# Pegar en terminal MySQL:
CREATE DATABASE esp32;
USE esp32;
source ../database/esp32.sql;
EXIT;
```

### 4. Encender el Servidor

```bash
# En carpeta backend
python appi.py

# Debe mostrar:
# WARNING in werkzeug: Running on http://127.0.0.1:5000
```

### 5. Abrir en Navegador

```
http://localhost:5000/frontend/index.html
```

**Login:**
- Email: `test@aquasense.com`
- Password: `1234`

---

## 🔌 Configuraciones Importantes

### Backend: `backend/appi.py` (línea 16-19)

```python
# LOCAL (desarrollo):
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'esp32'

# CLEVER CLOUD (producción):
# Editar backend/.env con tus credenciales
```

### Frontend: Cambiar IP

En navegador (consola F12):
```javascript
cambiarIP()
```

O editar `frontend/js/app.js` línea 6:
```javascript
const CONFIG = {
  API_BASE_URL: 'http://192.168.0.9:5000'  // Tu IP
};
```

---

## ✅ Checklist - Verificar Funcionamiento

- [ ] `python appi.py` sin errores
- [ ] MySQL corriendo
- [ ] Navegador carga http://localhost:5000/frontend/index.html
- [ ] Punto verde en topbar (conexión OK)
- [ ] Login funciona
- [ ] Datos se actualizan

---

## 🐛 Errores Comunes

| Error | Solución |
|-------|----------|
| `ModuleNotFoundError: No module named 'flask'` | `pip install -r requirements.txt` |
| `Can't connect to MySQL` | `mysql -u root -p` luego `CREATE DATABASE esp32;` |
| `Port 5000 already in use` | `python appi.py` en otro puerto |
| `CORS Error` | Backend tiene CORS, no debería pasar |

---

## 📱 Opciones de Acceso

1. **Local (Desarrollo):** `http://localhost:5000/frontend/index.html`
2. **IP Local:** `http://192.168.0.X:5000/frontend/index.html`
3. **Archivo HTML:** Abre `frontend/index.html` directamente (sin servidor, no funciona BD)

---

## 🎯 Próximo Paso

Una vez funcionando, lee: `docs/ANALISIS_COMPLETO.md`

Contiene:
- Arquitectura completa
- Lista de endpoints
- Próximas mejoras
- Problemas de seguridad
