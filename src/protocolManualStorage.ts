const DB='strategy-protocol-manual-db'
const NAME='manual'
function db():Promise<IDBDatabase>{return new Promise((ok,fail)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore('docs');req.onsuccess=()=>ok(req.result);req.onerror=()=>fail(req.error)})}
export async function saveManual(blob:Blob){const d=await db();return new Promise<void>((ok,fail)=>{const t=d.transaction('docs','readwrite');t.objectStore('docs').put(blob,NAME);t.oncomplete=()=>{d.close();ok()};t.onerror=()=>{d.close();fail(t.error)}})}
export async function readManual():Promise<Blob|null>{const d=await db();return new Promise((ok,fail)=>{const t=d.transaction('docs','readonly');const r=t.objectStore('docs').get(NAME);r.onsuccess=()=>ok(r.result||null);r.onerror=()=>fail(r.error);t.oncomplete=()=>d.close()})}
