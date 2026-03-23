#!/usr/bin/env python
"""
Test de conectividad a MySQL - AquaSense
"""
import MySQLdb
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv('backend/.env')

# Configuración desde .env
config = {
    'host': os.getenv('MYSQL_ADDON_HOST'),
    'user': os.getenv('MYSQL_ADDON_USER'),
    'passwd': os.getenv('MYSQL_ADDON_PASSWORD'),
    'db': os.getenv('MYSQL_ADDON_DB'),
    'port': int(os.getenv('MYSQL_ADDON_PORT', 3306))
}

print("=" * 60)
print("🔍 TEST DE CONECTIVIDAD - MYSQL CLEVER CLOUD")
print("=" * 60)
print(f"\n📍 Host: {config['host']}")
print(f"👤 Usuario: {config['user']}")
print(f"🗄️  Base de datos: {config['db']}")
print(f"🔌 Puerto: {config['port']}")

try:
    print("\n⏳ Conectando a MySQL...")
    conexion = MySQLdb.connect(**config)
    cursor = conexion.cursor()
    
    print("✅ ¡CONEXIÓN EXITOSA!\n")
    
    # Verificar tablas
    print("📋 Tablas en la base de datos:")
    cursor.execute("SHOW TABLES")
    tablas = cursor.fetchall()
    
    if tablas:
        for tabla in tablas:
            print(f"   • {tabla[0]}")
    else:
        print("   ⚠️  No hay tablas. Necesitas importar esp32.sql")
    
    # Contar registros en tabla medicion
    try:
        cursor.execute("SELECT COUNT(*) FROM medicion")
        count = cursor.fetchone()[0]
        print(f"\n📊 Registros en 'medicion': {count}")
    except:
        print("\n⚠️  Tabla 'medicion' no existe")
    
    cursor.close()
    conexion.close()
    
    print("\n" + "=" * 60)
    print("✅ BASE DE DATOS LISTA PARA USAR")
    print("=" * 60)
    
except MySQLdb.Error as e:
    print(f"\n❌ ERROR DE CONEXIÓN:")
    print(f"   {e}")
    print("\n💡 Posibles soluciones:")
    print("   • Verificar credenciales en .env")
    print("   • Comprobar que Clever Cloud esté activo")
    print("   • Verificar reglas de firewall")
    print("=" * 60)
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("=" * 60)
