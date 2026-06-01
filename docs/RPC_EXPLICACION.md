# Arquitectura Distribuida ARMRANK - Guías 5 y 6

Este documento detalla la refactorización arquitectónica implementada en el sistema ARMRANK para dar cumplimiento a los requerimientos de la asignatura de **Arquitectura Cliente-Servidor**.

La lógica base de generación de Torneos se migró de ser una función monolítica local, a un **Micro-servicio TCP RPC Remoto**, sin alterar la usabilidad de la UI web ni el gestor de Base de Datos PostgreSQL.

## 📌 Guía de Evaluación (Checklist)

A continuación se mapea exactamente en qué archivos se da cumplimiento a los 9 criterios del Segundo Previo, para facilitar la revisión del docente:

### Guía 5: Transmisión y Stubs
- **Clases de Negocio:** La estructura de Torneos, Participantes y `Matches` está centralizada y fue extraída sin romper la lógica. (*Se encuentra en `engine.ts` reutilizando la función nativa de bracketService*).
- **Implementación del Stub:** `backend/src/services/rpc-core/common.ts` contiene la clase `RpcStub`. Esta clase expone un método `.call()` que encapsula la creación del socket, permitiendo usar al motor remoto como si fuera un objeto local.
- **Marshaling (Serialización):** `common.ts` expone la función `marshal()` que transforma limpiamente diccionarios y objetos en flujo de `Buffer` (Bytes) listos para la red.
- **Unmarshaling (Reconstrucción):** `common.ts` expone la función `unmarshal()`, que decodifica los flujos de Bytes recibidos en la puerta TCP de vuelta a objetos manipulables en *TypeScript*. 
- **Transparencia:** `backend/src/routes/tournaments.ts` (Línea ~465). El Endpoint del usuario reemplazó una llamada local directa por `await matchmakerStub.call('GENERATE', data)`. El código del Backend principal no "sabe" que ocurrió toda una trama de transporte por red TCP por detrás.

### Guía 6: Naming Registry
- **Módulo Registry:** `backend/src/services/rpc-core/registry.ts` funciona como un Servidor Socket autónomo de Directorio en el puerto 5000.
- **Operación BIND:** `engine.ts` tiene la función `bindToRegistry()`. Apenas prende el motor (puerto 6000), le avisa activamente al Registry vía comando TCP: `BIND MatchmakingEngine 127.0.0.1 6000`.
- **Operación LOOKUP:** `common.ts` (Dentro del `RpcStub`) invoca `LOOKUP MatchmakingEngine` preguntándole al Registry antes de enviar un socket, recuperando la IP de forma dinámica en tiempo real.
- **Eliminación de Acoplamiento:** En `tournaments.ts`, el *backend de Express* jamás especifica la IP `127.0.0.1` ni el puerto `6000` de las reglas de negocio, solo hace referencia al nombre lógico del componente (`'MatchmakingEngine'`).

---

## 🚀 Cómo Iniciar el Proyecto

Para hacer que toda la arquitectura (Frontend, Backend, Base de Datos, Motor Remoto y Registry) corra armónicamente y sin fricciones:

### 1. Iniciar Base de Datos
```bash
docker-compose up -d
```

### 2. Iniciar Todo el Sistema Backend (API, Registry, Engine)
Gracias al uso de `concurrently`, la API lanzará todos los sub-nodos RPC:
```bash
cd backend
npm run dev:all
```
*(Deberás ver en la terminal cómo el Registry inicia, el Engine se hace BIND de forma autónoma, y finalmente el puerto 3001 avisa que la API está viva).*

### 3. Iniciar el Frontend
En otra terminal local:
```bash
cd app
npm run dev
```

Todo el sistema de Frontend correrá en **http://localhost:5173**. Al crear un torneo, por debajo saltarán los logs TCP comprobando la transmisión remota del Matchmaking.
