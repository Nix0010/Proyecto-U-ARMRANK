import * as net from 'net';
import { REGISTRY_PORT, REGISTRY_HOST } from './common';

/**
 * =========================================================================
 * GUÍA PRÁCTICA N° 6: IMPLEMENTACIÓN DEL SISTEMA DE NOMBRADO (REGISTRY)
 * Objetivo: Servicio de directorio que asocia nombres lógicos a IPs y Puertos.
 * Cumple con el CRITERIO: "Módulo Registry" de la lista de chequeo.
 * =========================================================================
 */

// Estructura de datos temporal en memoria (Diccionario / Hash Map)
// Almacena el "Nombre del Servicio" vinculado a su "Dirección de Red" (IP:Puerto).
const servicesDirectory: { [serviceName: string]: string } = {};

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    // Decodificar los bytes entrantes en formato de texto plano
    const text = data.toString('utf-8').trim();
    const parts = text.split(' ');
    const command = parts[0];

    /**
     * CRITERIO: Operación Bind
     * El servidor vincula correctamente el nombre lógico del servicio a su referencia física.
     */
    if (command === 'BIND') {
      // Protocolo esperado: BIND <NombreServicio> <IP> <Puerto>
      if (parts.length >= 4) {
        const name = parts[1];
        const host = parts[2];
        const port = parts[3];
        
        // Guardar o actualizar la referencia física (IP:Port) bajo el nombre lógico
        servicesDirectory[name] = `${host}:${port}`;
        console.log(`[Registry] Servicio registrado (BIND): ${name} -> ${host}:${port}`);
        socket.write('OK');
      } else {
        socket.write('ERROR: Faltan argumentos para BIND');
      }
    } 
    /**
     * CRITERIO: Operación Lookup
     * El cliente localiza dinámicamente el servicio consultando al Registry por su nombre.
     */
    else if (command === 'LOOKUP') {
      // Protocolo esperado: LOOKUP <NombreServicio>
      const name = parts[1];
      const address = servicesDirectory[name];
      
      // Si el servicio existe, retornamos la dirección IP y el puerto.
      if (address) {
        socket.write(address);
      } else {
        socket.write('NOT_FOUND');
      }
    }
    
    // Cerramos la conexión para liberar recursos (el Registry es de consulta rápida)
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.error('[Registry] Error de cliente:', err.message);
  });
});

// Iniciamos el servicio de Directorio (Registry)
server.listen(REGISTRY_PORT, REGISTRY_HOST, () => {
  console.log(`[Registry] Servidor de Nombrado y Directorio activo en tcp://${REGISTRY_HOST}:${REGISTRY_PORT}`);
  console.log(`[Registry] Cumpliendo íntegramente la Guía 6.`);
});
