'''
pip install Flask
pip install Flask-MySQLdb
pip install Flask-Cors
'''

from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuración MySQL
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'iot_a'

mysql = MySQL(app)

# Variable para controlar medición desde la web
medir = False

# INICIAR MEDICION DESDE WEB
@app.route('/iniciarMedicion', methods=['GET'])
def iniciarMedicion():

    global medir
    medir = True

    return jsonify({"mensaje": "Medición iniciada"})

# ESP32 CONSULTA SI DEBE MEDIR

@app.route('/estadoMedicion', methods=['GET'])
def estadoMedicion():

    global medir

    if medir:
        medir = False
        return jsonify({"medir": True})
    else:
        return jsonify({"medir": False})

# GUARDAR MEDICION

@app.route('/sendDato', methods=['POST'])
def sendDato():

    sensor = request.json['sensor']
    valor = float(request.json['valor'])

    cursor = mysql.connection.cursor()

    cursor.execute("""
        INSERT INTO medicion (id_sensor, valor, fecha_hora)
        VALUES (%s,%s,NOW())
    """,(sensor,valor))

    mysql.connection.commit()

    mensaje = None

    # Evaluación de rangos
    if sensor == 1 and (valor < 6.5 or valor > 8.5):
        mensaje = "Alerta: pH fuera de rango"

    elif sensor == 2 and (valor < 20 or valor > 30):
        mensaje = "Alerta: temperatura fuera de rango"

    elif sensor == 3 and valor > 5:
        mensaje = "Alerta: turbidez alta"

    elif sensor == 4 and valor < 5:
        mensaje = "Alerta: oxígeno bajo"

    if mensaje:

        cursor.execute("""
        INSERT INTO alerta (mensaje,estado,fecha_hora)
        VALUES (%s,'activa',NOW())
        """,(mensaje,))

        mysql.connection.commit()

    return jsonify({"mensaje":"dato guardado"})

# OBTENER MEDICIONES

@app.route('/getDatos', methods=['GET'])
def getDatos():

    cursor = mysql.connection.cursor()

    cursor.execute("""
    SELECT sensor.tipo_sensor, medicion.valor, medicion.fecha_hora
    FROM medicion
    JOIN sensor
    ON medicion.id_sensor = sensor.id_sensor
    ORDER BY medicion.fecha_hora DESC
    """)

    data = cursor.fetchall()

    return jsonify(data)

# OBTENER ALERTAS

@app.route('/getAlertas', methods=['GET'])
def getAlertas():

    cursor = mysql.connection.cursor()

    cursor.execute("""
    SELECT mensaje, fecha_hora
    FROM alerta
    WHERE estado='activa'
    """)

    data = cursor.fetchall()

    return jsonify(data)

# GENERAR REPORTE

@app.route('/generarReporte', methods=['POST'])
def generarReporte():

    cursor = mysql.connection.cursor()

    cursor.execute("""
    INSERT INTO reportes (fecha_generada,tipo_reporte)
    VALUES (NOW(),'calidad del agua')
    """)

    mysql.connection.commit()

    return jsonify({"mensaje":"reporte generado"})

# EJECUTAR API

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')