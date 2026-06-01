import * as net from 'net';

export const REGISTRY_PORT = 5000;
export const REGISTRY_HOST = '127.0.0.1';

/**
 * =========================================================================
 * GUÍA PRÁCTICA N° 5: TRANSPORTE DE OBJETOS REMOTOS Y STUBS
 * Objetivo: Funciones base para codificar y el proxy (Stub) del Cliente.
 * =========================================================================
 */

/**
 * CRITERIO (Guía 5): Marshaling (Serialización)
 * Conversión exitosa de objetos a flujo de bytes para su transporte por red.
 */
export function marshal(data: any): Buffer {
  const jsonString = JSON.stringify(data);
  return Buffer.from(jsonString, 'utf-8');
}

/**
 * CRITERIO (Guía 5): Unmarshaling (Des-serialización)
 * Función compartida para transformar los bytes crudos nuevamente a Objetos.
 */
export function unmarshal(buffer: Buffer): any {
  const jsonString = buffer.toString('utf-8');
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error al hacer unmarshaling:', error);
    return null;
  }
}

/**
 * Función de Directorio (Pertenece a Guía 6: Operación Lookup)
 * Busca dinámicamente la IP/Puerto actual de un servicio consultando el Registry.
 */
export function lookupService(serviceName: string): Promise<{ host: string; port: number } | null> {
  return new Promise((resolve) => {
    const client = net.createConnection({ host: REGISTRY_HOST, port: REGISTRY_PORT }, () => {
      client.write(`LOOKUP ${serviceName}`);
    });

    client.on('data', (data) => {
      const response = data.toString('utf-8');
      client.destroy();
      
      if (response === 'NOT_FOUND' || !response.includes(':')) {
        resolve(null);
      } else {
        const [host, port] = response.split(':');
        resolve({ host, port: parseInt(port, 10) });
      }
    });

    client.on('error', (err) => {
      console.error(`[Lookup] No se pudo contactar al Registry para ${serviceName}:`, err.message);
      resolve(null);
    });
  });
}

/**
 * CRITERIO (Guía 5): Implementación del Stub
 * Creación del proxy en el cliente que encapsula la lógica de conexión y envío.
 * CRITERIO: Transparencia -> La app principal llama a `Stub.call()` y todo ocurre mágicamente atrás.
 * CRITERIO (Guía 6): Eliminación de Acoplamiento -> Oculta las IPs dinámicas usando el lookup.
 */
export class RpcStub {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName; // Nombre Lógico (no IP quemada)
  }

  public async call(method: string, args: any): Promise<any> {
    // Resolver dinámicamente la IP (Guía 6)
    const coords = await lookupService(this.serviceName);
    
    if (!coords) {
      throw new Error(`Servicio Remoto ${this.serviceName} no encontrado en el Registry.`);
    }

    return new Promise((resolve, reject) => {
      const client = net.createConnection({ host: coords.host, port: coords.port }, () => {
        // Empaquetar y enviar a la red (Guía 5)
        const payload = marshal({ method, args });
        client.write(Buffer.concat([payload, Buffer.from('<EOF>')]));
      });

      let responseBuffer = Buffer.alloc(0);

      client.on('data', (chunk) => {
        responseBuffer = Buffer.concat([responseBuffer, chunk]);
        if (responseBuffer.toString('utf-8').endsWith('<EOF>')) {
          const clearBuffer = responseBuffer.subarray(0, responseBuffer.length - 5);
          client.destroy();
          // Desarmar y retornar la respuesta transparente al cliente
          const result = unmarshal(clearBuffer);
          resolve(result);
        }
      });

      client.on('error', (err) => {
        reject(new Error(`Error de Socket con el servicio remoto: ${err.message}`));
      });
    });
  }
}
