type DocData = Record<string, unknown>;

type StoredDoc = {
  id: string;
  data: DocData;
};

const collections = new Map<string, Map<string, DocData>>();

export function resetFirebaseMock() {
  collections.clear();
}

function getCollection(name: string): Map<string, DocData> {
  if (!collections.has(name)) {
    collections.set(name, new Map());
  }
  return collections.get(name)!;
}

export function seedCollection(name: string, docs: StoredDoc[]) {
  const col = getCollection(name);
  docs.forEach(({id, data}) => col.set(id, data));
}

export const firebaseFirestoreLiteMock = {
  doc: (_db: unknown, collectionName: string, key: string) => ({
    __collection: collectionName,
    __key: key,
  }),
  collection: (_db: unknown, collectionName: string) => ({
    __collection: collectionName,
  }),
  setDoc: jest.fn(async (ref: {__collection: string; __key: string}, val: DocData) => {
    getCollection(ref.__collection).set(ref.__key, val);
  }),
  getDoc: jest.fn(async (ref: {__collection: string; __key: string}) => {
    const data = getCollection(ref.__collection).get(ref.__key);
    return {
      exists: () => data !== undefined,
      data: () => data,
      id: ref.__key,
    };
  }),
  deleteDoc: jest.fn(async (ref: {__collection: string; __key: string}) => {
    getCollection(ref.__collection).delete(ref.__key);
  }),
  query: jest.fn((colRef: {__collection: string}, ..._constraints: unknown[]) => ({
    __collection: colRef.__collection,
    __constraints: _constraints,
  })),
  where: jest.fn((field: string, op: string, value: unknown) => ({field, op, value})),
  getDocs: jest.fn(async (q: {
    __collection: string;
    __constraints?: {field: string; op: string; value: unknown}[];
  }) => {
    const all = Array.from(getCollection(q.__collection).entries()).map(([id, data]) => ({
      id,
      data: () => data,
    }));

    const constraints = q.__constraints || [];
    const filtered = all.filter(doc =>
      constraints.every(constraint => {
        const fieldValue = doc.data()[constraint.field];
        if (constraint.op === '>=') return Number(fieldValue) >= Number(constraint.value);
        if (constraint.op === '>') return Number(fieldValue) > Number(constraint.value);
        if (constraint.op === '==') return fieldValue === constraint.value;
        return true;
      }),
    );

    return {
      docs: filtered,
      forEach: (cb: (doc: {id: string; data: () => DocData}) => void) => {
        filtered.forEach(cb);
      },
    };
  }),
};

export const firebaseConfigMock = {
  db: {},
  auth: {
    currentUser: null,
  },
};
