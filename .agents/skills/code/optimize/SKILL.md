---
name: performance-optimization
description: Aplica esta skill al escribir código nuevo que haga fetch de datos, itere sobre listas o renderice listas grandes, y al auditar código existente en busca de llamadas duplicadas a APIs, renders innecesarios, memory leaks o complejidad algorítmica evitable (O(n²) donde cabe O(n)) en la app React + TypeScript + Zustand. El objetivo es optimizar uso de recursos y tiempo sin alterar el comportamiento observable actual — correr como paso de revisión final, después de clean-code, atomic-design y project-structure.
---

# Performance Optimization — Memoria, complejidad y uso de recursos

## 0. Cuándo se activa
- Vas a escribir código que haga fetch de datos, transforme colecciones grandes, o renderice listas.
- Te piden auditar la app en busca de llamadas duplicadas a APIs o consumo excesivo de recursos.
- Como paso final de cualquier tarea, después de aplicar `clean-code`, `atomic-design` y `project-structure`.

**Regla de oro, no negociable:** optimizar **nunca** puede cambiar el comportamiento observable — mismos inputs, mismos outputs, misma UI, mismas reglas de negocio. Si una optimización obliga a tocar la lógica de negocio o el resultado visible, se detiene y se pregunta antes de aplicarla; no se decide unilateralmente.

## 1. Llamadas duplicadas o redundantes a APIs

Causas más comunes: varios componentes disparando el mismo fetch por su cuenta, `useEffect` sin control de dependencias que se re-ejecuta de más, falta de un estado de `loading`/caché compartido, y buscadores que llaman la API en cada tecla sin debounce.

```ts
// ❌ MAL — cada componente que necesita "clients" dispara su propio fetch,
// sin importar si otro componente ya lo está pidiendo o ya lo tiene
function ClientsTable() {
  useEffect(() => {
    fetch('/api/clients').then(/* ... */);
  }, []);
}
function ClientsSummary() {
  useEffect(() => {
    fetch('/api/clients').then(/* ... */); // ❌ misma data, segunda llamada
  }, []);
}
```

```ts
// ✅ BIEN — el fetch vive una sola vez en el usecase/store (ver clean-code),
// el store controla su propio estado para no disparar dos veces en paralelo
export const useClientsStore = create<ClientsState>((set, get) => ({
  status: 'idle',
  clients: [],
  fetchClients: async () => {
    if (get().status === 'loading') return; // evita llamada duplicada en vuelo
    set({ status: 'loading' });
    const clients = await clientsUseCases.getAll();
    set({ status: 'success', clients });
  },
}));

// ambos componentes solo LEEN del store, ninguno vuelve a hacer fetch
function ClientsTable() {
  const clients = useClientsStore((s) => s.clients);
}
function ClientsSummary() {
  const clients = useClientsStore((s) => s.clients);
}
```

Checklist de causas a revisar:
- ¿Dos o más componentes hacen fetch del mismo recurso en vez de leerlo de un store compartido?
- ¿Un buscador/input dispara una llamada por cada tecla sin `debounce`?
- ¿Una petición vieja puede resolver después de una más nueva y pisar el resultado (race condition)? → considerar `AbortController` para cancelar la obsoleta.

## 2. Renders innecesarios (específico de React + Zustand)

- **Selectors granulares:** cada componente se suscribe solo a la porción de estado que usa, no al store completo.

```ts
// ❌ MAL — se re-renderiza con CUALQUIER cambio del store, aunque no le importe
const { user } = useAuthStore();

// ✅ BIEN — solo se re-renderiza cuando cambia `user`
const user = useAuthStore((s) => s.user);
```

- **`React.memo`** para átomos/moléculas puramente presentacionales que se renderizan dentro de listas grandes y reciben props estables.
- **`useMemo`/`useCallback`** solo donde el cálculo es genuinamente costoso o la referencia estable importa para un hijo memoizado — no envolver todo por costumbre (eso es sobre-ingeniería, va contra KISS).
- Evita crear objetos/arrays/funciones inline como prop en cada render si el hijo que las recibe está memoizado — eso anula el memo.
- Listas que pueden crecer sin límite → considerar virtualización (windowing) en vez de renderizar todos los elementos a la vez.

## 3. Complejidad algorítmica (Big-O)

El anti-patrón más común: un `.find()`/`.filter()`/`.some()` anidado dentro de otro `.map()` sobre colecciones relacionadas, que convierte un `O(n)` en `O(n²)` sin necesidad.

```ts
// ❌ MAL — O(n * m): por cada order, recorre TODA la lista de clients
const rows = orders.map((order) => {
  const client = clients.find((c) => c.id === order.clientId);
  return { ...order, clientName: client?.name };
});
```

```ts
// ✅ BIEN — O(n + m): un solo recorrido para indexar, luego lookup O(1)
const clientsById = new Map(clients.map((c) => [c.id, c]));
const rows = orders.map((order) => ({
  ...order,
  clientName: clientsById.get(order.clientId)?.name,
}));
```

- No recalcules/ordenes/filtres la misma colección en cada render — memoiza el derivado (`useMemo`) o precalcúlalo una vez en el store/usecase cuando llega la data.
- Antes de anidar un loop dentro de otro sobre datos que pueden crecer, pregúntate si un `Map`/`Set` indexado por id resuelve el mismo resultado en menos pasos.

## 4. Memoria y fugas (memory leaks)

- Todo `useEffect` que registre un listener, `setInterval`, `setTimeout` recurrente, o una suscripción (WebSocket, observer) **debe** limpiarlo en su función de retorno.

```ts
// ❌ MAL — el listener se queda vivo después de desmontar el componente
useEffect(() => {
  window.addEventListener('resize', handleResize);
}, []);

// ✅ BIEN
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

- No acumules en el estado del store datos transitorios que ya no se necesitan (ej. resultados de búsqueda viejos) — reemplázalos o límpialos, no los vayas apilando.
- Si se crean Object URLs (`URL.createObjectURL`) para previews de archivos/imágenes, revócalos (`URL.revokeObjectURL`) cuando ya no se usen.

## 5. Uso general de recursos

- Importa solo lo que necesitas de una librería (`import { debounce } from 'lodash-es'`) en vez del paquete completo (`import _ from 'lodash'`), para no inflar el bundle.
- Rutas/páginas pesadas → `React.lazy` + `Suspense` para cargarlas solo cuando se necesitan, en vez de meterlas todas en el bundle inicial.
- Evita ciclos innecesarios de `JSON.stringify`/`parse` o clonados profundos cuando una copia superficial (`{ ...obj }`) o ninguna copia alcanza.
- Si el backend lo permite, pide solo los campos/página que la vista necesita, en vez de traer listas completas para mostrar solo una parte.

## 6. Reglas de "no romper nada"

- Toda optimización se mantiene dentro de las reglas de `clean-code`, `atomic-design` y `project-structure` — nunca es válido "optimizar" moviendo lógica a un `.tsx`, metiendo un fetch directo en un store, o rompiendo la responsabilidad única de un store para ahorrar una llamada.
- Antes de aplicar una optimización agresiva (virtualización, memoización compleja, cancelar requests con `AbortController`), confirma que no cambia el comportamiento observable actual. Si hay duda razonable, señala el trade-off en la respuesta en vez de aplicarlo en silencio.
- No optimices de forma prematura o especulativa: prioriza problemas medibles y confirmados (llamadas duplicadas reales, loops anidados sobre colecciones que sí crecen, renders que se disparan en cascada) sobre micro-optimizaciones sin impacto real.

## 7. Checklist de auditoría sobre código existente

- [ ] ¿Hay un `useEffect` que dispare un fetch que ya se dispara en otro componente para el mismo recurso?
- [ ] ¿Algún store repite una llamada a la misma API sin verificar si ya está `loading` o ya tiene la data?
- [ ] ¿Hay un `.find`/`.filter`/`.some` anidado dentro de un `.map` sobre listas que puedan crecer? → candidato a `Map`/`Set`.
- [ ] ¿Algún `useEffect` con listener/interval/subscripción no tiene su función de cleanup?
- [ ] ¿Algún selector de Zustand suscribe el componente al store completo en vez de a la porción que necesita?
- [ ] ¿Se recalcula/ordena/filtra la misma colección en cada render sin `useMemo` ni precómputo en el store?
- [ ] ¿Hay imports de librerías completas cuando solo se usa una función?
- [ ] ¿Una página pesada podría beneficiarse de `React.lazy`?
- [ ] ¿Un input de búsqueda dispara la API en cada tecla sin `debounce`?

## 8. Patrones a buscar (grep) al auditar

- `useEffect(() => {` seguido de una llamada `fetch`/usecase repetida en más de un componente para el mismo recurso.
- `.map(` con un `.find(`/`.filter(` anidado dentro del mismo callback.
- `useEffect(` sin un `return () =>` cuando dentro hay `addEventListener`, `setInterval` o una subscripción.
- `useXStore()` sin selector (paréntesis vacíos = suscripción al store completo).
- `import _ from 'lodash'` o equivalentes de librería completa en vez de import nombrado.