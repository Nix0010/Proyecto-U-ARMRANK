import * as net from 'net';
import { generateBracket } from '../bracketService';
import { REGISTRY_HOST, REGISTRY_PORT, marshal, unmarshal } from './common';

/**
 * =========================================================================
 * GUÍAS PRÁCTICAS N° 5 y 6: OBJETO REMOTO Y BINDING
 * Objetivo: Servidor TCP que encapsula la Lógica de Negocio (Matchmaking)
 * de acuerdo al CRITERIO Universitario "Clases de Negocio" y "Operación Bind".
 * =========================================================================
 */

const ENGINE_PORT = 6000;
const ENGINE_HOST = '127.0.0.1';
const SERVICE_NAME = 'MatchmakingEngine';

/**
 * CRITERIO (Guía 6): Operación Bind
 * Cuando el servidor arranca, se conecta inmediatamente al Registry
 * para vincular su nombre lógico a su IP física y Puerto.
 */
function bindToRegistry() {
  const client = net.createConnection({ host: REGISTRY_HOST, port: REGISTRY_PORT }, () => {
    client.write(`BIND ${SERVICE_NAME} ${ENGINE_HOST} ${ENGINE_PORT}`);
  });

  client.on('data', (data) => {
    if (data.toString('utf-8') === 'OK') {
      console.log(`[Engine] Registrado exitosamente en el Registry como '${SERVICE_NAME}'`);
    }
    client.destroy();
  });

  client.on('error', (err) => {
    console.error(`[Engine] Esperando al Registry para anclarse... reintentando en 3s (${err.message})`);
    setTimeout(bindToRegistry, 3000);
  });
}

// Configurar Servidor TCP Privado (Objeto Remoto/Servidor Skeleton)
const server = net.createServer((socket) => {
  let buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    
    // Delimitador custom <EOF> para identificar el final de la transmisión
    if (buffer.toString('utf-8').endsWith('<EOF>')) {
      const clearBuffer = buffer.subarray(0, buffer.length - 5); // Remover <EOF>
      try {
        /**
         * CRITERIO (Guía 5): Unmarshaling (Reconstrucción)
         * Recepción y reconstrucción íntegra del objeto en el servidor (Skeleton inicial).
         */
        const request = unmarshal(clearBuffer);
        
        if (request && request.method === 'GENERATE') {
          console.log(`[Engine] Generando llaves remotamente para torneo de ${request.args.type}...`);
          
          // Ejecutar la lógica compleja de negocio real (CRITERIO: Clases de Negocio)
          const result = generateBracket(
            request.args.type,
            request.args.participants,
            request.args.tournamentId,
            request.args.categoryId,
            request.args.bestOf
          );

          /**
           * CRITERIO (Guía 5): Marshaling (Serialización)
           * Conversión exitosa de objetos de negocio de vuelta a flujo de bytes.
           */
          const payload = marshal(result);
          socket.write(Buffer.concat([payload, Buffer.from('<EOF>')]));
        } else {
          socket.write(Buffer.concat([marshal({ error: 'Método RPC no soportado' }), Buffer.from('<EOF>')]));
        }
      } catch (err: any) {
        console.error('[Engine] Error procesando socket TCP:', err.message);
        socket.write(Buffer.concat([marshal({ error: 'Error del motor interno' }), Buffer.from('<EOF>')]));
      }
    }
  });

  socket.on('error', (err) => console.error('[Engine] Error en socket:', err.message));
});

server.listen(ENGINE_PORT, ENGINE_HOST, () => {
  console.log(`[Engine] Motor de Torneos (Objeto Remoto TCP) activo en tcp://${ENGINE_HOST}:${ENGINE_PORT}`);
  console.log(`[Engine] Listo para Unmarshaling de Cargas (Guía 5).`);
  bindToRegistry(); // Iniciar proceso de Service Registration
});
