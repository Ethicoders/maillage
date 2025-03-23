// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  // @internal
  countLength() {
    let length5 = 0;
    for (let _ of this)
      length5++;
    return length5;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index5) {
    return this.buffer[index5];
  }
  // @internal
  floatFromSlice(start3, end, isBigEndian) {
    return byteArrayToFloat(this.buffer, start3, end, isBigEndian);
  }
  // @internal
  intFromSlice(start3, end, isBigEndian, isSigned) {
    return byteArrayToInt(this.buffer, start3, end, isBigEndian, isSigned);
  }
  // @internal
  binaryFromSlice(start3, end) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + start3,
      end - start3
    );
    return new _BitArray(buffer);
  }
  // @internal
  sliceAfter(index5) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + index5,
      this.buffer.byteLength - index5
    );
    return new _BitArray(buffer);
  }
};
var UtfCodepoint = class {
  constructor(value2) {
    this.value = value2;
  }
};
function byteArrayToInt(byteArray, start3, end, isBigEndian, isSigned) {
  const byteSize = end - start3;
  if (byteSize <= 6) {
    let value2 = 0;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value2 = value2 * 256 + byteArray[i];
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value2 = value2 * 256 + byteArray[i];
      }
    }
    if (isSigned) {
      const highBit = 2 ** (byteSize * 8 - 1);
      if (value2 >= highBit) {
        value2 -= highBit * 2;
      }
    }
    return value2;
  } else {
    let value2 = 0n;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value2 = (value2 << 8n) + BigInt(byteArray[i]);
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value2 = (value2 << 8n) + BigInt(byteArray[i]);
      }
    }
    if (isSigned) {
      const highBit = 1n << BigInt(byteSize * 8 - 1);
      if (value2 >= highBit) {
        value2 -= highBit * 2n;
      }
    }
    return Number(value2);
  }
}
function byteArrayToFloat(byteArray, start3, end, isBigEndian) {
  const view8 = new DataView(byteArray.buffer);
  const byteSize = end - start3;
  if (byteSize === 8) {
    return view8.getFloat64(start3, !isBigEndian);
  } else if (byteSize === 4) {
    return view8.getFloat32(start3, !isBigEndian);
  } else {
    const msg = `Sized floats must be 32-bit or 64-bit on JavaScript, got size of ${byteSize * 8} bits`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value2) {
    super();
    this[0] = value2;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a2 = values2.pop();
    let b = values2.pop();
    if (a2 === b)
      continue;
    if (!isObject(a2) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a2);
    for (let k of keys2(a2)) {
      values2.push(get2(a2, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c))
    return false;
  return a2.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a2 = option[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key2, value2) {
  return map_insert(key2, value2, dict2);
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let first2 = list3.head;
      let rest = list3.tail;
      loop$list = rest;
      loop$acc = prepend(first2[0], acc);
    }
  }
}
function keys(dict2) {
  let list_of_pairs = map_to_list(dict2);
  return do_keys_loop(list_of_pairs, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function reverse_loop(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest$1 = remaining.tail;
      loop$remaining = rest$1;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function reverse(list3) {
  return reverse_loop(list3, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list3, fun) {
  return map_loop(list3, fun, toList([]));
}
function new$() {
  return toList([]);
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second = loop$second;
    if (first2.hasLength(0)) {
      return second;
    } else {
      let item = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(item, second);
    }
  }
}
function append(first2, second) {
  return append_loop(reverse(first2), second);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list3 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list3.hasLength(0)) {
      return initial;
    } else {
      let x = list3.head;
      let rest$1 = list3.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, x);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index5 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index5);
      loop$with = with$;
      loop$index = index5 + 1;
    }
  }
}
function index_fold(list3, initial, fun) {
  return index_fold_loop(list3, initial, fun, 0);
}
function key_set(list3, key2, value2) {
  if (list3.hasLength(0)) {
    return toList([[key2, value2]]);
  } else if (list3.atLeastLength(1) && isEqual(list3.head[0], key2)) {
    let k = list3.head[0];
    let rest$1 = list3.tail;
    return prepend([key2, value2], rest$1);
  } else {
    let first$1 = list3.head;
    let rest$1 = list3.tail;
    return prepend(first$1, key_set(rest$1, key2, value2));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function replace_error(result, error) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    return new Error(error);
  }
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g2 = 0;
  while (i < at) {
    out[g2++] = arr[i++];
  }
  out[g2++] = val;
  while (i < len) {
    out[g2++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g2 = 0;
  while (i < at) {
    out[g2++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g2++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key2, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key2, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key2, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key2, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key2, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key2, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key2, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key2, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key2, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key2, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key2, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key2, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key2,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key2, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key2);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key2, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key2, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key2,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key2) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key2, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key2) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key2);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key2);
    case COLLISION_NODE:
      return findCollision(root, key2);
  }
}
function findArray(root, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key2) {
  const idx = collisionIndexOf(root, key2);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key2) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key2);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key2);
    case COLLISION_NODE:
      return withoutCollision(root, key2);
  }
}
function withoutArray(root, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key2)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key2, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key2) {
  const idx = collisionIndexOf(root, key2);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key2, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key2), key2);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key2, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key2), key2, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key2) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key2), key2);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key2) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key2), key2) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function float_to_string(float4) {
  const string5 = float4.toString().replace("+", "");
  if (string5.indexOf(".") >= 0) {
    return string5;
  } else {
    const index5 = string5.indexOf("e");
    if (index5 >= 0) {
      return string5.slice(0, index5) + ".0" + string5.slice(index5);
    } else {
      return string5 + ".0";
    }
  }
}
function graphemes(string5) {
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string5.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function pop_grapheme(string5) {
  let first2;
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    first2 = iterator.next().value?.segment;
  } else {
    first2 = string5.match(/./su)?.[0];
  }
  if (first2) {
    return new Ok([first2, string5.slice(first2.length)]);
  } else {
    return new Error(Nil);
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string5) {
  return string5.toLowerCase();
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function string_codeunit_slice(str, from2, length5) {
  return str.slice(from2, from2 + length5);
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = new RegExp(`[${unicode_whitespaces}]*$`);
function print_debug(string5) {
  if (typeof process === "object" && process.stderr?.write) {
    process.stderr.write(string5 + "\n");
  } else if (typeof Deno === "object") {
    Deno.stderr.writeSync(new TextEncoder().encode(string5 + "\n"));
  } else {
    console.log(string5);
  }
}
function new_map() {
  return Dict.new();
}
function map_to_list(map8) {
  return List.fromArray(map8.entries());
}
function map_insert(key2, value2, map8) {
  return map8.set(key2, value2);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return inspectString(v);
  if (t === "bigint" || Number.isInteger(v))
    return v.toString();
  if (t === "number")
    return float_to_string(v);
  if (Array.isArray(v))
    return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List)
    return inspectList(v);
  if (v instanceof UtfCodepoint)
    return inspectUtfCodepoint(v);
  if (v instanceof BitArray)
    return inspectBitArray(v);
  if (v instanceof CustomType)
    return inspectCustomType(v);
  if (v instanceof Dict)
    return inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    switch (char) {
      case "\n":
        new_str += "\\n";
        break;
      case "\r":
        new_str += "\\r";
        break;
      case "	":
        new_str += "\\t";
        break;
      case "\f":
        new_str += "\\f";
        break;
      case "\\":
        new_str += "\\\\";
        break;
      case '"':
        new_str += '\\"';
        break;
      default:
        if (char < " " || char > "~" && char < "\xA0") {
          new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
        } else {
          new_str += char;
        }
    }
  }
  new_str += '"';
  return new_str;
}
function inspectDict(map8) {
  let body = "dict.from_list([";
  let first2 = true;
  map8.forEach((value2, key2) => {
    if (!first2)
      body = body + ", ";
    body = body + "#(" + inspect(key2) + ", " + inspect(value2) + ")";
    first2 = false;
  });
  return body + "])";
}
function inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label) => {
    const value2 = inspect(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value2}` : value2;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list3) {
  return `[${list3.toArray().map(inspect).join(", ")}]`;
}
function inspectBitArray(bits) {
  return `<<${Array.from(bits.buffer).join(", ")}>>`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function concat2(strings) {
  let _pipe = strings;
  let _pipe$1 = concat(_pipe);
  return identity(_pipe$1);
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string5 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string5;
    } else {
      let $1 = pop_grapheme(string5);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string5;
      }
    }
  }
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map(_pipe$2, identity);
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return identity(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib_decode_ffi.mjs
function index2(data, key2) {
  const int4 = Number.isInteger(key2);
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key2, token);
    if (entry === token)
      return new Ok(new None());
    return new Ok(new Some(entry));
  }
  if ((key2 === 0 || key2 === 1 || key2 === 2) && data instanceof List) {
    let i = 0;
    for (const value2 of data) {
      if (i === key2)
        return new Ok(new Some(value2));
      i++;
    }
    return new Error("Indexable");
  }
  if (int4 && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key2 in data)
      return new Ok(new Some(data[key2]));
    return new Ok(new None());
  }
  return new Error(int4 ? "Indexable" : "Dict");
}
function list(data, decode3, pushPath, index5, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    let error = new DecodeError2("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element2 of data) {
    const layer = decode3(element2);
    const [out, errors] = layer;
    if (errors instanceof NonEmpty) {
      const [_, errors2] = pushPath(layer, index5.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index5++;
  }
  return [List.fromArray(decoded), emptyList];
}
function int(data) {
  if (Number.isInteger(data))
    return new Ok(data);
  return new Error(0);
}
function string(data) {
  if (typeof data === "string")
    return new Ok(data);
  return new Error(0);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError2 = class extends CustomType {
  constructor(expected, found, path2) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path2;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors.hasLength(0)) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map3(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure = loop$failure;
    let decoders = loop$decoders;
    if (decoders.hasLength(0)) {
      return failure;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first2, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first2.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function run_dynamic_function(data, name, f) {
  let $ = f(data);
  if ($.isOk()) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError2(name, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_int2(data) {
  return run_dynamic_function(data, "Int", int);
}
var int2 = /* @__PURE__ */ new Decoder(decode_int2);
function decode_string2(data) {
  return run_dynamic_function(data, "String", string);
}
var string2 = /* @__PURE__ */ new Decoder(decode_string2);
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p, k) => {
          return push_path(p, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path(layer, path2) {
  let decoder = one_of(
    string2,
    toList([
      (() => {
        let _pipe = int2;
        return map3(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map(
    path2,
    (key2) => {
      let key$1 = identity(key2);
      let $ = run(key$1, decoder);
      if ($.isOk()) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError2(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path2 = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path2.hasLength(0)) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key2 = path2.head;
      let path$1 = path2.tail;
      let $ = index2(data, key2);
      if ($.isOk() && $[0] instanceof Some) {
        let data$1 = $[0][0];
        loop$path = path$1;
        loop$position = prepend(key2, position);
        loop$inner = inner;
        loop$data = data$1;
        loop$handle_miss = handle_miss;
      } else if ($.isOk() && $[0] instanceof None) {
        return handle_miss(data, prepend(key2, position));
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError2(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError2("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_stdlib/gleam/io.mjs
function debug(term) {
  let _pipe = term;
  let _pipe$1 = inspect2(_pipe);
  print_debug(_pipe$1);
  return term;
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path2, query, fragment) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path2;
    this.query = query;
    this.fragment = fragment;
  }
};
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        new Some(rest)
      );
    })()
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let query = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          new Some(query),
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            _record.path,
            new Some(original),
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path2 = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          path2,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path2 = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          path2,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    if (uri_string.startsWith("0")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if (uri_string.startsWith("1")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if (uri_string.startsWith("2")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if (uri_string.startsWith("3")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if (uri_string.startsWith("4")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if (uri_string.startsWith("5")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if (uri_string.startsWith("6")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if (uri_string.startsWith("7")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if (uri_string.startsWith("8")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if (uri_string.startsWith("9")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            new Some(port),
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      return new Error(void 0);
    }
  }
}
function parse_port(uri_string, pieces) {
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string.startsWith(":")) {
    return new Error(void 0);
  } else if (uri_string.startsWith("?")) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith("#")) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith("/")) {
    return parse_path(uri_string, pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else {
    return new Error(void 0);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(original),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(uri_string),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith("]") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_port(rest, pieces);
    } else if (uri_string.startsWith("]")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size + 1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_port(rest, pieces$1);
    } else if (uri_string.startsWith("/") && size === 0) {
      return parse_path(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let char = $[0];
      let rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size + 1;
      } else {
        return parse_host_outside_of_brackets_loop(
          original,
          original,
          pieces,
          0
        );
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  if (uri_string.startsWith("[")) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let pieces$1 = (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(""),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
    })();
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("@") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_host(rest, pieces);
    } else if (uri_string.startsWith("@")) {
      let rest = uri_string.slice(1);
      let userinfo = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          new Some(userinfo),
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_host(rest, pieces$1);
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("/")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("?")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("#")) {
      return parse_host(original, pieces);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_authority_pieces(string5, pieces) {
  return parse_userinfo_loop(string5, string5, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("/") && size === 0) {
      return parse_authority_with_slashes(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_authority_with_slashes(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith(":") && size === 0) {
      return new Error(void 0);
    } else if (uri_string.startsWith(":")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_authority_with_slashes(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse(uri_string) {
  let default_pieces = new Uri(
    new None(),
    new None(),
    new None(),
    new None(),
    "",
    new None(),
    new None()
  );
  return parse_scheme_loop(uri_string, uri_string, default_pieces, 0);
}
function remove_dot_segments_loop(loop$input, loop$accumulator) {
  while (true) {
    let input2 = loop$input;
    let accumulator = loop$accumulator;
    if (input2.hasLength(0)) {
      return reverse(accumulator);
    } else {
      let segment = input2.head;
      let rest = input2.tail;
      let accumulator$1 = (() => {
        if (segment === "") {
          let accumulator$12 = accumulator;
          return accumulator$12;
        } else if (segment === ".") {
          let accumulator$12 = accumulator;
          return accumulator$12;
        } else if (segment === ".." && accumulator.hasLength(0)) {
          return toList([]);
        } else if (segment === ".." && accumulator.atLeastLength(1)) {
          let accumulator$12 = accumulator.tail;
          return accumulator$12;
        } else {
          let segment$1 = segment;
          let accumulator$12 = accumulator;
          return prepend(segment$1, accumulator$12);
        }
      })();
      loop$input = rest;
      loop$accumulator = accumulator$1;
    }
  }
}
function remove_dot_segments(input2) {
  return remove_dot_segments_loop(input2, toList([]));
}
function path_segments(path2) {
  return remove_dot_segments(split2(path2, "/"));
}
function to_string2(uri) {
  let parts = (() => {
    let $ = uri.fragment;
    if ($ instanceof Some) {
      let fragment = $[0];
      return toList(["#", fragment]);
    } else {
      return toList([]);
    }
  })();
  let parts$1 = (() => {
    let $ = uri.query;
    if ($ instanceof Some) {
      let query = $[0];
      return prepend("?", prepend(query, parts));
    } else {
      return parts;
    }
  })();
  let parts$2 = prepend(uri.path, parts$1);
  let parts$3 = (() => {
    let $ = uri.host;
    let $1 = starts_with(uri.path, "/");
    if ($ instanceof Some && !$1 && $[0] !== "") {
      let host = $[0];
      return prepend("/", parts$2);
    } else {
      return parts$2;
    }
  })();
  let parts$4 = (() => {
    let $ = uri.host;
    let $1 = uri.port;
    if ($ instanceof Some && $1 instanceof Some) {
      let port = $1[0];
      return prepend(":", prepend(to_string(port), parts$3));
    } else {
      return parts$3;
    }
  })();
  let parts$5 = (() => {
    let $ = uri.scheme;
    let $1 = uri.userinfo;
    let $2 = uri.host;
    if ($ instanceof Some && $1 instanceof Some && $2 instanceof Some) {
      let s = $[0];
      let u = $1[0];
      let h = $2[0];
      return prepend(
        s,
        prepend(
          "://",
          prepend(u, prepend("@", prepend(h, parts$4)))
        )
      );
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof Some) {
      let s = $[0];
      let h = $2[0];
      return prepend(s, prepend("://", prepend(h, parts$4)));
    } else if ($ instanceof Some && $1 instanceof Some && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof None && $1 instanceof None && $2 instanceof Some) {
      let h = $2[0];
      return prepend("//", prepend(h, parts$4));
    } else {
      return parts$4;
    }
  })();
  return concat2(parts$5);
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function json_to_string(json) {
  return JSON.stringify(json);
}
function object(entries) {
  return Object.fromEntries(entries);
}
function identity2(x) {
  return x;
}
function decode(string5) {
  try {
    const result = JSON.parse(string5);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string5));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr))
    return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
    if (result)
      return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string5) {
  if (line === 1)
    return column - 1;
  let currentLn = 1;
  let position = 0;
  string5.split("").find((char, idx) => {
    if (char === "\n")
      currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnexpectedFormat = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function do_decode(json, decoder) {
  return then$(
    decode(json),
    (dynamic_value) => {
      let _pipe = decoder(dynamic_value);
      return map_error(
        _pipe,
        (var0) => {
          return new UnexpectedFormat(var0);
        }
      );
    }
  );
}
function decode2(json, decoder) {
  return do_decode(json, decoder);
}
function to_string3(json) {
  return json_to_string(json);
}
function string3(input2) {
  return identity2(input2);
}
function object2(entries) {
  return object(entries);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
var Actions = class extends CustomType {
  constructor(dispatch, emit2, select, root) {
    super();
    this.dispatch = dispatch;
    this.emit = emit2;
    this.select = select;
    this.root = root;
  }
};
function custom(run2) {
  return new Effect(
    toList([
      (actions) => {
        return run2(actions.dispatch, actions.emit, actions.select, actions.root);
      }
    ])
  );
}
function from(effect) {
  return custom((dispatch, _, _1, _2) => {
    return effect(dispatch);
  });
}
function none() {
  return new Effect(toList([]));
}
function batch(effects) {
  return new Effect(
    fold(
      effects,
      toList([]),
      (b, _use1) => {
        let a2 = _use1.all;
        return append(b, a2);
      }
    )
  );
}
function map4(effect, f) {
  return new Effect(
    map(
      effect.all,
      (eff) => {
        return (actions) => {
          return eff(
            new Actions(
              (msg) => {
                return actions.dispatch(f(msg));
              },
              actions.emit,
              (_) => {
                return void 0;
              },
              actions.root
            )
          );
        };
      }
    )
  );
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key2, namespace2, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key2;
    this.namespace = namespace2;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key2) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index5) => {
      let key$1 = key2 + "-" + to_string(index5);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key2 = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key2;
    } else {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key2 + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key2);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value2) {
  return new Attribute(name, identity(value2), false);
}
function on(name, handler) {
  return new Event("on" + name, handler);
}
function class$(name) {
  return attribute("class", name);
}
function id(name) {
  return attribute("id", name);
}
function type_(name) {
  return attribute("type", name);
}
function value(val) {
  return attribute("value", val);
}
function placeholder(text3) {
  return attribute("placeholder", text3);
}
function href(uri) {
  return attribute("href", uri);
}
function src(uri) {
  return attribute("src", uri);
}
function alt(text3) {
  return attribute("alt", text3);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag, attrs, children2, false, false);
  }
}
function namespaced(namespace2, tag, attrs, children2) {
  return new Element("", namespace2, tag, attrs, children2, false, false);
}
function text(content) {
  return new Text(content);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$3() {
  return new Set2(new_map());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new_map()) && isEqual(
    diff2.removed,
    new$3()
  ) && isEqual(diff2.updated, new_map());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack = [{ prev, next, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next2, parent } = stack.pop();
    while (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack }) {
  const namespace2 = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace2 ? document.createElementNS(namespace2, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a2) => a2.name)) : null;
  let className = null;
  let style2 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value2 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value2)
        el[name] = value2;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value2, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value2);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value2);
      delegated.push([name.slice(10), value2]);
    } else if (name === "class") {
      className = className === null ? value2 : className + " " + value2;
    } else if (name === "style") {
      style2 = style2 === null ? value2 : style2 + value2;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value2;
    } else {
      if (el.getAttribute(name) !== value2)
        el.setAttribute(name, value2);
      if (name === "value" || name === "selected")
        el[name] = value2;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style2 !== null) {
    el.setAttribute("style", style2);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value2] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value2);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property) => {
        const path2 = property.split(".");
        for (let i = 0, o = data2, e = event2; i < path2.length; i++) {
          if (i === path2.length - 1) {
            o[path2[i]] = e[path2[i]];
          } else {
            o[path2[i]] ??= {};
            e = e[path2[i]];
            o = o[path2[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key2 = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key2)
        keyedChildren.set(key2, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder2 = document.createTextNode("");
    el.insertBefore(placeholder2, prevChild);
    stack.unshift({ prev: placeholder2, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init6, update: update4, view: view8 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init6(flags), update4, view8);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init6, effects], update4, view8) {
    this.root = root;
    this.#model = init6;
    this.#update = update4;
    this.#view = view8;
    this.#tickScheduled = window.requestAnimationFrame(
      () => this.#tick(effects.all.toArray(), true)
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.requestAnimationFrame(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init6, update: update4, view: view8, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init6(flags),
      update4,
      view8,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update4, view8, on_attribute_change) {
    this.#model = model;
    this.#update = update4;
    this.#view = view8;
    this.#html = view8(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder)
          continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event2) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init6, update4, view8, on_attribute_change) {
    super();
    this.init = init6;
    this.update = update4;
    this.view = view8;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init6, update4, view8) {
  return new App(init6, update4, view8, new None());
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content) {
  return text(content);
}
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function a(attrs, children2) {
  return element("a", attrs, children2);
}
function span(attrs, children2) {
  return element("span", attrs, children2);
}
function img(attrs) {
  return element("img", attrs, toList([]));
}
function svg(attrs, children2) {
  return namespaced("http://www.w3.org/2000/svg", "svg", attrs, children2);
}
function button(attrs, children2) {
  return element("button", attrs, children2);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}

// build/dev/javascript/lustre/lustre/element/svg.mjs
var namespace = "http://www.w3.org/2000/svg";
function polyline(attrs) {
  return namespaced(namespace, "polyline", attrs, toList([]));
}
function g(attrs, children2) {
  return namespaced(namespace, "g", attrs, children2);
}
function svg2(attrs, children2) {
  return namespaced(namespace, "svg", attrs, children2);
}
function path(attrs) {
  return namespaced(namespace, "path", attrs, toList([]));
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options = class extends CustomType {
};
var Patch = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Connect) {
    return "connect";
  } else if (method instanceof Delete) {
    return "delete";
  } else if (method instanceof Get) {
    return "get";
  } else if (method instanceof Head) {
    return "head";
  } else if (method instanceof Options) {
    return "options";
  } else if (method instanceof Patch) {
    return "patch";
  } else if (method instanceof Post) {
    return "post";
  } else if (method instanceof Put) {
    return "put";
  } else if (method instanceof Trace) {
    return "trace";
  } else {
    let s = method[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body, scheme, host, port, path2, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path2;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return then$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return then$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}
function set_header(request, key2, value2) {
  let headers = key_set(request.headers, lowercase(key2), value2);
  let _record = request;
  return new Request(
    _record.method,
    headers,
    _record.body,
    _record.scheme,
    _record.host,
    _record.port,
    _record.path,
    _record.query
  );
}
function set_body(req, body) {
  let method = req.method;
  let headers = req.headers;
  let scheme = req.scheme;
  let host = req.host;
  let port = req.port;
  let path2 = req.path;
  let query = req.query;
  return new Request(method, headers, body, scheme, host, port, path2, query);
}
function set_method(req, method) {
  let _record = req;
  return new Request(
    method,
    _record.headers,
    _record.body,
    _record.scheme,
    _record.host,
    _record.port,
    _record.path,
    _record.query
  );
}
function new$4() {
  return new Request(
    new Get(),
    toList([]),
    "",
    new Https(),
    "localhost",
    new None(),
    "",
    new None()
  );
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
};

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value2) {
    return value2 instanceof Promise ? new _PromiseLayer(value2) : value2;
  }
  static unwrap(value2) {
    return value2 instanceof _PromiseLayer ? value2.promise : value2;
  }
};
function resolve(value2) {
  return Promise.resolve(PromiseLayer.wrap(value2));
}
function then_await(promise, fn) {
  return promise.then((value2) => fn(PromiseLayer.unwrap(value2)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value2) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value2)))
  );
}
function rescue(promise, fn) {
  return promise.catch((error) => fn(error));
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a2) => {
      callback(a2);
      return a2;
    }
  );
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result.isOk()) {
        let a2 = result[0];
        return callback(a2);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/gleam_fetch/ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error) {
    return new Error(new NetworkError(error.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function to_fetch_request(request) {
  let url = to_string2(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  if (method !== "GET" && method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList)
    headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body;
  try {
    body = await response.body.text();
  } catch (error) {
    return new Error(new UnableToReadBody());
  }
  return new Ok(response.withFields({ body }));
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/lustre_http/lustre_http.mjs
var InternalServerError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var JsonError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var NetworkError2 = class extends CustomType {
};
var NotFound = class extends CustomType {
};
var OtherError = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unauthorized = class extends CustomType {
};
var ExpectTextResponse = class extends CustomType {
  constructor(run2) {
    super();
    this.run = run2;
  }
};
function do_send(req, expect, dispatch) {
  let _pipe = send(req);
  let _pipe$1 = try_await(_pipe, read_text_body);
  let _pipe$2 = map_promise(
    _pipe$1,
    (response) => {
      if (response.isOk()) {
        let res = response[0];
        return expect.run(new Ok(res));
      } else {
        return expect.run(new Error(new NetworkError2()));
      }
    }
  );
  let _pipe$3 = rescue(
    _pipe$2,
    (_) => {
      return expect.run(new Error(new NetworkError2()));
    }
  );
  tap(_pipe$3, dispatch);
  return void 0;
}
function send2(req, expect) {
  return from((_capture) => {
    return do_send(req, expect, _capture);
  });
}
function response_to_result(response) {
  if (response instanceof Response && (200 <= response.status && response.status <= 299)) {
    let status = response.status;
    let body = response.body;
    return new Ok(body);
  } else if (response instanceof Response && response.status === 401) {
    return new Error(new Unauthorized());
  } else if (response instanceof Response && response.status === 404) {
    return new Error(new NotFound());
  } else if (response instanceof Response && response.status === 500) {
    let body = response.body;
    return new Error(new InternalServerError(body));
  } else {
    let code = response.status;
    let body = response.body;
    return new Error(new OtherError(code, body));
  }
}
function expect_json(decoder, to_msg) {
  return new ExpectTextResponse(
    (response) => {
      let _pipe = response;
      let _pipe$1 = then$(_pipe, response_to_result);
      let _pipe$2 = then$(
        _pipe$1,
        (body) => {
          let $ = decode2(body, decoder);
          if ($.isOk()) {
            let json = $[0];
            return new Ok(json);
          } else {
            let json_error = $[0];
            return new Error(new JsonError(json_error));
          }
        }
      );
      return to_msg(_pipe$2);
    }
  );
}

// build/dev/javascript/modem/modem.ffi.mjs
var defaults = {
  handle_external_links: false,
  handle_internal_links: true
};
var initial_location = window?.location?.href;
var do_init = (dispatch, options = defaults) => {
  document.addEventListener("click", (event2) => {
    const a2 = find_anchor(event2.target);
    if (!a2)
      return;
    try {
      const url = new URL(a2.href);
      const uri = uri_from_url(url);
      const is_external = url.host !== window.location.host;
      if (!options.handle_external_links && is_external)
        return;
      if (!options.handle_internal_links && !is_external)
        return;
      event2.preventDefault();
      if (!is_external) {
        window.history.pushState({}, "", a2.href);
        window.requestAnimationFrame(() => {
          if (url.hash) {
            document.getElementById(url.hash.slice(1))?.scrollIntoView();
          }
        });
      }
      return dispatch(uri);
    } catch {
      return;
    }
  });
  window.addEventListener("popstate", (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    const uri = uri_from_url(url);
    window.requestAnimationFrame(() => {
      if (url.hash) {
        document.getElementById(url.hash.slice(1))?.scrollIntoView();
      }
    });
    dispatch(uri);
  });
  window.addEventListener("modem-push", ({ detail }) => {
    dispatch(detail);
  });
  window.addEventListener("modem-replace", ({ detail }) => {
    dispatch(detail);
  });
};
var do_replace = (uri) => {
  window.history.replaceState({}, "", to_string2(uri));
  window.requestAnimationFrame(() => {
    if (uri.fragment[0]) {
      document.getElementById(uri.fragment[0])?.scrollIntoView();
    }
  });
  window.dispatchEvent(new CustomEvent("modem-replace", { detail: uri }));
};
var find_anchor = (el) => {
  if (!el || el.tagName === "BODY") {
    return null;
  } else if (el.tagName === "A") {
    return el;
  } else {
    return find_anchor(el.parentElement);
  }
};
var uri_from_url = (url) => {
  return new Uri(
    /* scheme   */
    url.protocol ? new Some(url.protocol.slice(0, -1)) : new None(),
    /* userinfo */
    new None(),
    /* host     */
    url.hostname ? new Some(url.hostname) : new None(),
    /* port     */
    url.port ? new Some(Number(url.port)) : new None(),
    /* path     */
    url.pathname,
    /* query    */
    url.search ? new Some(url.search.slice(1)) : new None(),
    /* fragment */
    url.hash ? new Some(url.hash.slice(1)) : new None()
  );
};

// build/dev/javascript/modem/modem.mjs
function init2(handler) {
  return from(
    (dispatch) => {
      return guard(
        !is_browser(),
        void 0,
        () => {
          return do_init(
            (uri) => {
              let _pipe = uri;
              let _pipe$1 = handler(_pipe);
              return dispatch(_pipe$1);
            }
          );
        }
      );
    }
  );
}
var relative = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function replace3(path2, query, fragment) {
  return from(
    (_) => {
      return guard(
        !is_browser(),
        void 0,
        () => {
          return do_replace(
            (() => {
              let _record = relative;
              return new Uri(
                _record.scheme,
                _record.userinfo,
                _record.host,
                _record.port,
                path2,
                query,
                fragment
              );
            })()
          );
        }
      );
    }
  );
}

// build/dev/javascript/maillage/gleamql.mjs
var Request2 = class extends CustomType {
  constructor(http_request, query, variables, decoder, operation_name) {
    super();
    this.http_request = http_request;
    this.query = query;
    this.variables = variables;
    this.decoder = decoder;
    this.operation_name = operation_name;
  }
};
function new$5() {
  return new Request2(
    (() => {
      let _pipe = new$4();
      return set_method(_pipe, new Post());
    })(),
    new None(),
    new None(),
    new None(),
    new None()
  );
}
function set_query(req, query) {
  let _record = req;
  return new Request2(
    _record.http_request,
    new Some(query),
    _record.variables,
    _record.decoder,
    _record.operation_name
  );
}
function set_operation_name(req, operation_name) {
  let _record = req;
  return new Request2(
    _record.http_request,
    _record.query,
    _record.variables,
    _record.decoder,
    new Some(operation_name)
  );
}
function set_variable(req, key2, value2) {
  let variables = prepend(
    [key2, value2],
    (() => {
      let _pipe = req.variables;
      return unwrap(_pipe, new$());
    })()
  );
  let _record = req;
  return new Request2(
    _record.http_request,
    _record.query,
    new Some(variables),
    _record.decoder,
    _record.operation_name
  );
}
function send3(req, expect) {
  let http_request = (() => {
    let _pipe = req.http_request;
    return set_body(
      _pipe,
      to_string3(
        object2(
          toList([
            [
              "query",
              (() => {
                let _pipe$1 = req.query;
                let _pipe$2 = unwrap(_pipe$1, "");
                return string3(_pipe$2);
              })()
            ],
            [
              "variables",
              object2(
                (() => {
                  let _pipe$1 = req.variables;
                  return unwrap(_pipe$1, new$());
                })()
              )
            ],
            [
              "operationName",
              (() => {
                let _pipe$1 = req.operation_name;
                let _pipe$2 = unwrap(_pipe$1, "");
                return string3(_pipe$2);
              })()
            ]
          ])
        )
      )
    );
  })();
  return send2(http_request, expect);
}
function set_uri(req, string_uri) {
  let b = parse(string_uri);
  let parsed = (() => {
    if (b.isOk()) {
      let c = b[0];
      return c;
    } else {
      throw makeError(
        "todo",
        "gleamql",
        157,
        "set_uri",
        "`todo` expression evaluated. This code has not yet been implemented.",
        {}
      );
    }
  })();
  let http_request = (() => {
    let _pipe = (() => {
      let $ = from_uri(parsed);
      if ($.isOk()) {
        let c = $[0];
        return c;
      } else {
        throw makeError(
          "todo",
          "gleamql",
          162,
          "set_uri",
          "`todo` expression evaluated. This code has not yet been implemented.",
          {}
        );
      }
    })();
    return set_method(_pipe, new Post());
  })();
  let _record = req;
  return new Request2(
    http_request,
    _record.query,
    _record.variables,
    _record.decoder,
    _record.operation_name
  );
}
function set_header3(req, key2, value2) {
  let _record = req;
  return new Request2(
    (() => {
      let _pipe = req.http_request;
      return set_header(_pipe, key2, value2);
    })(),
    _record.query,
    _record.variables,
    _record.decoder,
    _record.operation_name
  );
}

// build/dev/javascript/maillage/api/service.mjs
function get_url() {
  return "http://localhost:8000";
}
function get_client() {
  let _pipe = new$5();
  let _pipe$1 = set_uri(_pipe, get_url() + "/graphql");
  return set_header3(_pipe$1, "Content-Type", "application/json");
}

// build/dev/javascript/maillage/api/user.mjs
var User = class extends CustomType {
  constructor(id2, name, slug) {
    super();
    this.id = id2;
    this.name = name;
    this.slug = slug;
  }
};
var AuthenticatedUser = class extends CustomType {
  constructor(user, session_token) {
    super();
    this.user = user;
    this.session_token = session_token;
  }
};

// build/dev/javascript/maillage/ui/auth/msg.mjs
var ActionLogin = class extends CustomType {
};
var ActionRegister = class extends CustomType {
};
var AuthSwitchAction = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var LoginResponse = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Authenticate = class extends CustomType {
};

// build/dev/javascript/maillage/api/post.mjs
var Post2 = class extends CustomType {
  constructor(id2, content, author) {
    super();
    this.id = id2;
    this.content = content;
    this.author = author;
  }
};

// build/dev/javascript/maillage/ui/feed/msg.mjs
var AppendPosts = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/maillage/shared.mjs
var OnChangeView = class extends CustomType {
  constructor(view8) {
    super();
    this.view = view8;
  }
};
var AuthMessage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var FeedMessage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Noop = class extends CustomType {
};
var Main = class extends CustomType {
};
var Auth = class extends CustomType {
};

// build/dev/javascript/plinth/storage_ffi.mjs
function localStorage() {
  try {
    if (globalThis.Storage && globalThis.localStorage instanceof globalThis.Storage) {
      return new Ok(globalThis.localStorage);
    } else {
      return new Error(null);
    }
  } catch {
    return new Error(null);
  }
}
function getItem(storage, keyName) {
  return null_or(storage.getItem(keyName));
}
function setItem(storage, keyName, keyValue) {
  try {
    storage.setItem(keyName, keyValue);
    return new Ok(null);
  } catch {
    return new Error(null);
  }
}
function null_or(val) {
  if (val !== null) {
    return new Ok(val);
  } else {
    return new Error(null);
  }
}

// build/dev/javascript/varasto/varasto.mjs
var NotFound2 = class extends CustomType {
};
var DecodeError3 = class extends CustomType {
  constructor(err) {
    super();
    this.err = err;
  }
};
var TypedStorage = class extends CustomType {
  constructor(raw_storage, reader, writer) {
    super();
    this.raw_storage = raw_storage;
    this.reader = reader;
    this.writer = writer;
  }
};
function new$6(raw_storage, reader, writer) {
  return new TypedStorage(raw_storage, reader, writer);
}
function get(storage, key2) {
  return try$(
    (() => {
      let _pipe = getItem(storage.raw_storage, key2);
      return replace_error(_pipe, new NotFound2());
    })(),
    (str) => {
      let _pipe = decode2(str, storage.reader);
      return map_error(
        _pipe,
        (var0) => {
          return new DecodeError3(var0);
        }
      );
    }
  );
}
function set(storage, key2, value2) {
  let encoded = (() => {
    let _pipe = value2;
    let _pipe$1 = storage.writer(_pipe);
    return to_string3(_pipe$1);
  })();
  return setItem(storage.raw_storage, key2, encoded);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}

// build/dev/javascript/maillage/ui/color.mjs
var Primary = class extends CustomType {
};
var Secondary = class extends CustomType {
};
var None2 = class extends CustomType {
};

// build/dev/javascript/maillage/ui/components/button.mjs
var Button = class extends CustomType {
  constructor(label, outline, color, msg) {
    super();
    this.label = label;
    this.outline = outline;
    this.color = color;
    this.msg = msg;
  }
};
var None3 = class extends CustomType {
};
function new$7(label, msg) {
  return new Button(label, new None3(), new None2(), msg);
}
function with_outline(button2, outline) {
  let _record = button2;
  return new Button(_record.label, outline, _record.color, _record.msg);
}
function with_color(button2, color) {
  let _record = button2;
  return new Button(_record.label, _record.outline, color, _record.msg);
}
function render(button2, classes) {
  let bg = (() => {
    let $ = button2.color;
    if ($ instanceof Primary) {
      return "bg-brand-700";
    } else if ($ instanceof Secondary) {
      return "";
    } else {
      return "";
    }
  })();
  let fg = (() => {
    let $ = button2.color;
    if ($ instanceof Primary) {
      return "color-default-background";
    } else if ($ instanceof Secondary) {
      return "";
    } else {
      return "";
    }
  })();
  return button(
    toList([
      class$(
        bg + " " + fg + " rounded-md h-10 flex-none " + classes
      ),
      on_click(button2.msg)
    ]),
    toList([text2(button2.label)])
  );
}
function primary(label, classes, msg) {
  let _pipe = new$7(label, msg);
  let _pipe$1 = with_outline(_pipe, new None3());
  let _pipe$2 = with_color(_pipe$1, new Primary());
  return render(_pipe$2, classes);
}
function secondary(label, classes, msg) {
  let _pipe = new$7(label, msg);
  let _pipe$1 = with_outline(_pipe, new None3());
  let _pipe$2 = with_color(_pipe$1, new Secondary());
  return render(_pipe$2, classes);
}

// build/dev/javascript/maillage/ui/components/field.mjs
function form_field(label, field3) {
  return div(
    toList([class$("w-full")]),
    toList([
      span(
        toList([class$("text-default-font")]),
        toList([text2(label)])
      ),
      div(
        toList([
          class$(
            "rounded-md border border-solid border-neutral-border"
          )
        ]),
        toList([div(toList([]), toList([field3]))])
      )
    ])
  );
}

// build/dev/javascript/maillage/ui/components/input.mjs
var Input = class extends CustomType {
  constructor(placeholder2, value2, input_type, validation, on_input) {
    super();
    this.placeholder = placeholder2;
    this.value = value2;
    this.input_type = input_type;
    this.validation = validation;
    this.on_input = on_input;
  }
};
var Text2 = class extends CustomType {
};
var Password = class extends CustomType {
};
var Email = class extends CustomType {
};
var Unset = class extends CustomType {
};
function new$8(placeholder2, on_input) {
  return new Input(placeholder2, "", new Text2(), new Unset(), on_input);
}
function with_type(input2, input_type) {
  let _record = input2;
  return new Input(
    _record.placeholder,
    _record.value,
    input_type,
    _record.validation,
    _record.on_input
  );
}
function with_validation(input2, validation) {
  let _record = input2;
  return new Input(
    _record.placeholder,
    _record.value,
    _record.input_type,
    validation,
    _record.on_input
  );
}
function render2(input2) {
  let type_attr = (() => {
    let $ = input2.input_type;
    if ($ instanceof Text2) {
      return "text";
    } else if ($ instanceof Password) {
      return "password";
    } else if ($ instanceof Email) {
      return "email";
    } else {
      return "number";
    }
  })();
  return input(
    toList([
      class$("bg-transparent w-full h-full text-default-font"),
      type_(type_attr),
      placeholder(input2.placeholder),
      value(input2.value)
    ])
  );
}
function text_input(placeholder2, on_input) {
  let _pipe = new$8(placeholder2, on_input);
  let _pipe$1 = with_type(_pipe, new Text2());
  let _pipe$2 = with_validation(_pipe$1, new Unset());
  return render2(_pipe$2);
}
function email_input(placeholder2, on_input) {
  let _pipe = new$8(placeholder2, on_input);
  let _pipe$1 = with_type(_pipe, new Email());
  let _pipe$2 = with_validation(_pipe$1, new Unset());
  return render2(_pipe$2);
}
function password_input(placeholder2, on_input) {
  let _pipe = new$8(placeholder2, on_input);
  let _pipe$1 = with_type(_pipe, new Password());
  let _pipe$2 = with_validation(_pipe$1, new Unset());
  return render2(_pipe$2);
}

// build/dev/javascript/maillage/ui/components/link.mjs
function view(href2, text3, on_click2) {
  return a(
    toList([
      class$("text-brand-700 font-body"),
      href(href2),
      on_click(on_click2)
    ]),
    toList([text2(text3)])
  );
}

// build/dev/javascript/maillage/ui/auth/auth.mjs
var Model2 = class extends CustomType {
  constructor(action, current_user) {
    super();
    this.action = action;
    this.current_user = current_user;
  }
};
function user_decoder() {
  return field(
    "name",
    string2,
    (name) => {
      return field(
        "slug",
        string2,
        (slug) => {
          return field(
            "id",
            string2,
            (id2) => {
              return success(new User(id2, name, slug));
            }
          );
        }
      );
    }
  );
}
function get_storage() {
  let $ = localStorage();
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "ui/auth/auth",
      110,
      "get_storage",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let local = $[0];
  let reader = () => {
    return (item) => {
      let _pipe = run(item, string2);
      return map_error(_pipe, (_) => {
        return toList([]);
      });
    };
  };
  let writer = () => {
    return (val) => {
      return string3(val);
    };
  };
  return new$6(local, reader(), writer());
}
function set_token(session_token) {
  let s = get_storage();
  return set(s, "token", session_token);
}
function get_token() {
  let s = get_storage();
  return get(s, "token");
}
function init3(_) {
  return [new Model2(new ActionLogin(), new None()), none()];
}
function feature(_, title, description) {
  return div(
    toList([
      class$(
        "flex w-full items-start justify-center gap-4 px-2 py-2"
      )
    ]),
    toList([
      div(
        toList([class$("flex flex-col items-start gap-1")]),
        toList([
          span(
            toList([
              class$(
                "text-heading-3 font-heading-3 text-brand-700 font-bold"
              )
            ]),
            toList([text2(title)])
          ),
          span(
            toList([class$("text-body font-body text-subtext-color")]),
            toList([text2(description)])
          )
        ])
      )
    ])
  );
}
function form_fields(model) {
  return div(
    toList([
      class$("flex w-full flex-col items-start justify-center gap-6")
    ]),
    toList([
      form_field("Name ", text_input("", new Noop())),
      (() => {
        let $ = model.action;
        if ($ instanceof ActionLogin) {
          return div(toList([]), toList([]));
        } else {
          return form_field(
            "Email ",
            email_input("", new Noop())
          );
        }
      })(),
      form_field("Password ", password_input("", new Noop()))
    ])
  );
}
function sign_up_card_with_value_props(model) {
  return div(
    toList([
      class$(
        "flex h-full w-full flex-wrap items-center justify-center gap-12 px-12 py-12 mobile:flex-col mobile:flex-wrap mobile:gap-12 mobile:px-6 mobile:py-12"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "flex max-w-[576px] grow shrink-0 basis-0 flex-col items-center justify-center gap-12 self-stretch mobile:h-auto mobile:w-full mobile:max-w-[576px]"
          )
        ]),
        toList([
          img(
            toList([
              src("/static/images/m.svg"),
              class$("h-16 flex-none object-cover")
            ])
          ),
          div(
            toList([
              class$(
                "flex flex-col items-center justify-center gap-6 px-12 mobile:flex mobile:px-0 mobile:py-0"
              )
            ]),
            toList([
              feature(
                "FeatherLightbulb",
                "Spark your imagination",
                "Dive into a world where your creative ideas are instantly brought to life. Let\u2019s paint your thoughts in digital strokes."
              ),
              feature(
                "FeatherRocket",
                "Simplify the complex",
                "Say goodbye to mundane tasks. Our AI streamlines your workflow, freeing you to focus on what truly matters."
              ),
              feature(
                "FeatherZap",
                "Boost your brainpower",
                "Elevate your learning with tailored insights and resources. It\u2019s like having a personal coach in your pocket."
              )
            ])
          )
        ])
      ),
      div(
        toList([
          class$(
            "max-w-[448px] grow shrink-0 basis-0 flex-col items-center justify-center gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-12 py-12 shadow-lg"
          )
        ]),
        toList([
          div(
            toList([
              class$(
                "flex w-full flex-col items-center justify-center gap-8"
              )
            ]),
            toList([
              span(
                toList([
                  class$(
                    "w-full text-heading-3 font-heading-3 text-default-font font-bold"
                  )
                ]),
                toList([
                  text2(
                    (() => {
                      let $ = model.action;
                      if ($ instanceof ActionLogin) {
                        return "Log into your account";
                      } else {
                        return "Create your account";
                      }
                    })()
                  )
                ])
              ),
              form_fields(model),
              primary(
                (() => {
                  let $ = model.action;
                  if ($ instanceof ActionLogin) {
                    return "Sign In";
                  } else {
                    return "Sign Up";
                  }
                })(),
                "w-full",
                new AuthMessage(new Authenticate())
              ),
              div(
                toList([class$("flex flex-wrap items-start gap-1")]),
                toList([
                  span(
                    toList([
                      class$("text-body font-body text-default-font")
                    ]),
                    toList([
                      text2(
                        (() => {
                          let $ = model.action;
                          if ($ instanceof ActionLogin) {
                            return "No account yet?";
                          } else {
                            return "Have an account?";
                          }
                        })()
                      )
                    ])
                  ),
                  view(
                    "",
                    (() => {
                      let $ = model.action;
                      if ($ instanceof ActionLogin) {
                        return "Sign Up";
                      } else {
                        return "Sign In";
                      }
                    })(),
                    (() => {
                      let $ = model.action;
                      if ($ instanceof ActionLogin) {
                        return new AuthMessage(
                          new AuthSwitchAction(new ActionRegister())
                        );
                      } else {
                        return new AuthMessage(
                          new AuthSwitchAction(new ActionLogin())
                        );
                      }
                    })()
                  )
                ])
              )
            ])
          )
        ])
      )
    ])
  );
}
function view2(model) {
  return sign_up_card_with_value_props(model);
}
var query_login = "mutation Login($email: Email!, $password: Password!) {\n  login(request: {email: $email, password: $password}) {\n    user {\n      name\n      slug\n    }\n    sessionToken\n  }\n}";
function login() {
  let res = (() => {
    let _pipe = get_client();
    let _pipe$1 = set_query(_pipe, query_login);
    let _pipe$2 = set_operation_name(_pipe$1, "Login");
    let _pipe$3 = set_variable(
      _pipe$2,
      "email",
      string3("test@test.fr")
    );
    return set_variable(_pipe$3, "password", string3("testpass"));
  })();
  let auth_decoder = field(
    "user",
    user_decoder(),
    (user) => {
      return field(
        "sessionToken",
        string2,
        (session_token) => {
          return success(
            new AuthenticatedUser(user, session_token)
          );
        }
      );
    }
  );
  let login_decoder = field(
    "login",
    auth_decoder,
    (user) => {
      return success(user);
    }
  );
  let final_decoder = field(
    "data",
    login_decoder,
    (login2) => {
      return success(login2);
    }
  );
  return send3(
    res,
    expect_json(
      (dyn) => {
        return map_error(
          run(dyn, final_decoder),
          (err) => {
            debug(err);
            return toList([]);
          }
        );
      },
      (res2) => {
        if (res2.isOk()) {
          let v = res2[0];
          return new Ok(v);
        } else {
          let e = res2[0];
          debug(e);
          return new Error(e);
        }
      }
    )
  );
}
var query_register = "mutation Register($name: String!, $email: Email!, $password: Password!) {\n  register(request: {name: $name, email: $email, password: $password}) {\n    name\n    slug\n  }\n}";
function register() {
  let res = (() => {
    let _pipe = get_client();
    let _pipe$1 = set_query(_pipe, query_register);
    let _pipe$2 = set_operation_name(_pipe$1, "Login");
    let _pipe$3 = set_variable(_pipe$2, "name", string3("test"));
    let _pipe$4 = set_variable(
      _pipe$3,
      "email",
      string3("test@test.fr")
    );
    return set_variable(_pipe$4, "password", string3("testpass"));
  })();
  let auth_decoder = field(
    "user",
    user_decoder(),
    (user) => {
      return field(
        "sessionToken",
        string2,
        (session_token) => {
          return success(
            new AuthenticatedUser(user, session_token)
          );
        }
      );
    }
  );
  let login_decoder = field(
    "register",
    auth_decoder,
    (user) => {
      return success(user);
    }
  );
  let final_decoder = field(
    "data",
    login_decoder,
    (login2) => {
      return success(login2);
    }
  );
  return send3(
    res,
    expect_json(
      (dyn) => {
        return map_error(
          run(dyn, final_decoder),
          (err) => {
            debug(err);
            return toList([]);
          }
        );
      },
      (res2) => {
        if (res2.isOk()) {
          let v = res2[0];
          return new Ok(v);
        } else {
          let e = res2[0];
          debug(e);
          return new Error(e);
        }
      }
    )
  );
}
function update(model, msg) {
  if (msg instanceof AuthSwitchAction) {
    let action = msg[0];
    return [
      (() => {
        let _record = model;
        return new Model2(action, _record.current_user);
      })(),
      none()
    ];
  } else if (msg instanceof Authenticate) {
    return [
      model,
      map4(
        (() => {
          let $ = model.action;
          if ($ instanceof ActionLogin) {
            return login();
          } else {
            return register();
          }
        })(),
        (res) => {
          if (res.isOk()) {
            let usr = res[0];
            return new AuthMessage(new LoginResponse(usr));
          } else {
            let err = res[0];
            debug(err);
            throw makeError(
              "panic",
              "ui/auth/auth",
              203,
              "",
              "`panic` expression evaluated.",
              {}
            );
          }
        }
      )
    ];
  } else {
    let current_user = msg[0];
    let $ = (() => {
      let _pipe = set_token(current_user.session_token);
      return map_error(
        _pipe,
        (_) => {
          throw makeError(
            "panic",
            "ui/auth/auth",
            213,
            "",
            "Failed writing to storage!",
            {}
          );
        }
      );
    })();
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "ui/auth/auth",
        211,
        "update",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    return [
      (() => {
        let _record = model;
        return new Model2(_record.action, new Some(current_user.user));
      })(),
      replace3("/", new None(), new None())
    ];
  }
}

// build/dev/javascript/maillage/ui/components/card.mjs
function card(children2) {
  return div(
    toList([
      class$(
        "flex flex-col block rounded-xl border border-neutral-border p-4 gap-4"
      )
    ]),
    children2
  );
}

// build/dev/javascript/maillage/ui/components/handle.mjs
function view3(handle) {
  return span(
    toList([
      class$("text-caption text-xs font-caption text-subtext-color")
    ]),
    toList([text2("@" + handle)])
  );
}

// build/dev/javascript/maillage/ui/components/username.mjs
function view4(name) {
  return span(
    toList([class$("font-body font-bold text-sm")]),
    toList([text2(name)])
  );
}

// build/dev/javascript/maillage/ui/feed/feed.mjs
var Model3 = class extends CustomType {
  constructor(posts) {
    super();
    this.posts = posts;
  }
};
function update2(model, msg) {
  {
    let posts = msg[0];
    debug(posts);
    return [new Model3(append(model.posts, posts)), none()];
  }
}
function social_feed_post(avatar, name, handle, timestamp, comment_count, up_count, content) {
  return div(
    toList([
      class$(
        "flex w-full items-start p-6 border-b border-neutral-border"
      )
    ]),
    toList([
      div(
        toList([class$("flex items-center gap-4")]),
        toList([
          img(
            toList([
              class$("w-12 h-12 rounded-full"),
              src(avatar)
            ])
          )
        ])
      ),
      div(
        toList([class$("flex flex-col items-start flex-1")]),
        toList([
          div(
            toList([
              class$(
                "flex flex-col items-start gap-1 w-full p-[4px_4px_4px_12px]"
              )
            ]),
            toList([
              div(
                toList([class$("flex flex-wrap gap-1")]),
                toList([
                  view4(name),
                  view3(handle),
                  text2("\u2022"),
                  span(
                    toList([
                      class$(
                        "text-caption font-caption text-subtext-color"
                      )
                    ]),
                    toList([text2(timestamp)])
                  )
                ])
              ),
              div(
                toList([class$("mt-2")]),
                toList([text2(content)])
              ),
              div(
                toList([
                  class$(
                    "flex gap-4 text-caption text-subtext-color mt-2"
                  )
                ]),
                toList([
                  span(
                    toList([]),
                    toList([
                      svg2(
                        toList([
                          attribute(
                            "xmlns:xlink",
                            "http://www.w3.org/1999/xlink"
                          ),
                          attribute(
                            "xmlns",
                            "http://www.w3.org/2000/svg"
                          ),
                          attribute("xml:space", "preserve"),
                          attribute("width", "20"),
                          attribute("viewBox", "0 0 32 32"),
                          attribute("version", "1.1"),
                          attribute("height", "20"),
                          attribute(
                            "enable-background",
                            "new 0 0 32 32"
                          ),
                          class$("inline mr-2 cursor-pointer")
                        ]),
                        toList([
                          g(
                            toList([id("bubble")]),
                            toList([
                              path(
                                toList([
                                  attribute("fill-rule", "evenodd"),
                                  attribute("fill", "#f9fafb"),
                                  attribute(
                                    "d",
                                    "M16,7c-5.963,0-11,3.206-11,7c0,0.276,0.224,0.5,0.5,0.5   S6,14.276,6,14c0-3.196,4.673-6,10-6c0.275,0,0.5-0.224,0.5-0.5S16.276,7,16,7z"
                                  ),
                                  attribute("clip-rule", "evenodd")
                                ])
                              ),
                              path(
                                toList([
                                  attribute("fill-rule", "evenodd"),
                                  attribute("fill", "#f9fafb"),
                                  attribute(
                                    "d",
                                    "M16,2C7.163,2,0,7.373,0,14c0,4.127,2.779,7.766,7.008,9.926   C7.008,23.953,7,23.971,7,24c0,1.793-1.339,3.723-1.928,4.736c0.001,0,0.002,0,0.002,0C5.027,28.846,5,28.967,5,29.094   C5,29.594,5.405,30,5.906,30C6,30,6.165,29.975,6.161,29.986c3.125-0.512,6.069-3.383,6.753-4.215C13.913,25.918,14.943,26,16,26   c8.835,0,16-5.373,16-12C32,7.373,24.836,2,16,2z M16,24c-0.917,0-1.858-0.07-2.796-0.207c-0.097-0.016-0.194-0.021-0.29-0.021   c-0.594,0-1.163,0.264-1.546,0.73c-0.428,0.521-1.646,1.684-3.085,2.539c0.39-0.895,0.695-1.898,0.716-2.932   c0.006-0.064,0.009-0.129,0.009-0.184c0-0.752-0.421-1.439-1.09-1.781C4.212,20.252,2,17.207,2,14C2,8.486,8.28,4,16,4   c7.718,0,14,4.486,14,10C30,19.514,23.719,24,16,24z"
                                  ),
                                  attribute("clip-rule", "evenodd")
                                ])
                              )
                            ])
                          )
                        ])
                      ),
                      text2(comment_count)
                    ])
                  ),
                  span(
                    toList([]),
                    toList([
                      svg(
                        toList([
                          attribute("viewBox", "0 0 448 512"),
                          attribute("height", "20"),
                          attribute("width", "20"),
                          attribute("fill", "#2A935B"),
                          class$("inline mr-2 cursor-pointer")
                        ]),
                        toList([
                          path(
                            toList([
                              attribute(
                                "d",
                                "M376 192c-6.428 0-12.66 .8457-18.6 2.434C344.7 173.8 321.9 160 296 160c-6.428 0-12.66 .8457-18.6 2.434C264.7 141.8 241.9 128 216 128C213.3 128 210.6 128.1 208 128.4V72C208 32.3 175.7 0 136 0S64 32.3 64 72v196.3C44.51 284.5 32 308.8 32 336v49.88c0 32.1 17.1 61.65 44.63 77.12l55.83 31.35C153.1 505.9 176.4 512 199.8 512h107.9C385.1 512 448 447.4 448 368V264C448 224.3 415.7 192 376 192zM272 232c0-13.23 10.78-24 24-24S320 218.8 320 232v47.91C320 293.1 309.2 304 296 304S272 293.2 272 280V232zM192 200C192 186.8 202.8 176 216 176s24 10.77 24 24v48c0 3.029-.7012 5.875-1.73 8.545C227.9 251.3 216.4 248 204 248H192V200zM112 72c0-13.23 10.78-24 24-24S160 58.77 160 72v176H120c-2.686 0-5.217 .5566-7.84 .793C112.2 248.5 112 248.3 112 248V72zM307.7 464H199.8c-15.25 0-30.41-3.984-43.88-11.52l-55.78-31.34C87.72 414.2 80 400.6 80 385.9V336c0-22.06 17.94-40 40-40h84c15.44 0 28 12.56 28 28S219.4 352 204 352H152C138.8 352 128 362.8 128 376s10.75 24 24 24h52c33.23 0 61.25-21.58 71.54-51.36C282 350.7 288.9 352 296 352c5.041 0 9.836-1.166 14.66-2.178C322 374.6 346.1 392 376 392c7.684 0 14.94-1.557 21.87-3.836C388.9 431.4 351.9 464 307.7 464zM400 320c0 13.23-10.78 24-24 24S352 333.2 352 320V264c0-13.23 10.78-24 24-24s24 10.77 24 24V320z"
                              )
                            ])
                          )
                        ])
                      ),
                      text2(up_count)
                    ])
                  )
                ])
              )
            ])
          )
        ])
      )
    ])
  );
}
function suggested_user(name, handle, avatar_url) {
  return div(
    toList([class$("flex w-full items-center gap-4")]),
    toList([
      img(
        toList([
          src(avatar_url),
          alt(name),
          class$("w-10 h-10 rounded-full")
        ])
      ),
      div(
        toList([
          class$("flex grow shrink-0 basis-0 flex-col items-start")
        ]),
        toList([view4(name), view3(handle)])
      ),
      secondary("Follow", "", new Noop())
    ])
  );
}
function social_suggestions() {
  return card(
    toList([
      span(
        toList([class$("font-heading-3 font-bold")]),
        toList([text2("You may also like")])
      ),
      div(
        toList([class$("flex flex-col items-start gap-4 w-full")]),
        toList([
          suggested_user(
            "Chris Morgan",
            "@chrismorgan",
            "https://res.cloudinary.com/subframe/image/upload/v1723780941/uploads/302/qgj6kevv14gw6i48bllb.png"
          ),
          suggested_user(
            "Good Tunes, Inc.",
            "@good_tunes",
            "https://res.cloudinary.com/subframe/image/upload/v1723780941/uploads/302/qgj6kevv14gw6i48bllb.png"
          ),
          suggested_user(
            "Mark",
            "@markmarkmark",
            "https://res.cloudinary.com/subframe/image/upload/v1723780941/uploads/302/qgj6kevv14gw6i48bllb.png"
          )
        ])
      )
    ])
  );
}
function view_feed(posts) {
  return div(
    toList([
      class$(
        "flex h-full w-full items-start justify-center bg-default-background px-6 mobile:px-0 mobile:pt-0 mobile:pb-12"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "flex max-w-[576px] grow shrink-0 basis-0 flex-col items-start border-x border-solid border-neutral-border overflow-auto"
          )
        ]),
        toList([
          div(
            toList([
              class$(
                "flex h-20 w-full flex-none items-center border-b border-solid border-neutral-border px-6 py-6"
              )
            ]),
            toList([
              span(
                toList([
                  class$("text-heading-3 font-heading-3 font-bold")
                ]),
                toList([text2("For You")])
              )
            ])
          ),
          div(
            toList([class$("w-full")]),
            map(
              posts,
              (post) => {
                return social_feed_post(
                  "https://res.cloudinary.com/subframe/image/upload/v1718919568/uploads/3102/mmfbvgi9hwpewyqglgul.png",
                  post.author.name,
                  post.author.slug,
                  "2h ago",
                  "4",
                  "72",
                  post.content
                );
              }
            )
          )
        ])
      ),
      div(
        toList([
          class$(
            "flex flex-col items-start gap-2 self-stretch px-6 py-6 mobile:hidden"
          )
        ]),
        toList([social_suggestions()])
      )
    ])
  );
}
function view5(model) {
  return view_feed(model.posts);
}
var query_feed = "query Feed {\n  feed(request: {}) {\n    total\n    edges {cursor, node {id, content, author {id, name, slug}}}\n  }\n}";
function get_feed() {
  let res = (() => {
    let _pipe = get_client();
    let _pipe$1 = set_query(_pipe, query_feed);
    return set_operation_name(_pipe$1, "Feed");
  })();
  let post_decoder = field(
    "id",
    string2,
    (id2) => {
      return field(
        "content",
        string2,
        (content) => {
          return field(
            "author",
            user_decoder(),
            (author) => {
              return success(new Post2(id2, content, author));
            }
          );
        }
      );
    }
  );
  let node_decoder = field(
    "node",
    post_decoder,
    (node) => {
      return success(node);
    }
  );
  let edges_decoder = field(
    "edges",
    list2(node_decoder),
    (edges) => {
      return success(edges);
    }
  );
  let feed_decoder = field(
    "feed",
    edges_decoder,
    (feed) => {
      return success(feed);
    }
  );
  let final_decoder = field(
    "data",
    feed_decoder,
    (feed) => {
      return success(feed);
    }
  );
  return send3(
    res,
    expect_json(
      (dyn) => {
        return map_error(
          run(dyn, final_decoder),
          (err) => {
            debug(err);
            return toList([]);
          }
        );
      },
      (res2) => {
        if (res2.isOk()) {
          let v = res2[0];
          return new Ok(v);
        } else {
          let e = res2[0];
          debug(e);
          return new Error(e);
        }
      }
    )
  );
}
function init4(_) {
  let init_posts = toList([
    new Post2("0", "Content", new User("0", "def", "def"))
  ]);
  return [
    new Model3(init_posts),
    map4(
      get_feed(),
      (r) => {
        if (r.isOk()) {
          let p = r[0];
          return new AppendPosts(p);
        } else {
          let e = r[0];
          throw makeError(
            "panic",
            "ui/feed/feed",
            94,
            "",
            "`panic` expression evaluated.",
            {}
          );
        }
      }
    )
  ];
}

// build/dev/javascript/maillage/model.mjs
var Model4 = class extends CustomType {
  constructor(view8, auth_model, feed_model) {
    super();
    this.view = view8;
    this.auth_model = auth_model;
    this.feed_model = feed_model;
  }
};

// build/dev/javascript/maillage/ui/components/logo.mjs
function view6(attributes, primarycolor, secondarycolor) {
  let primarycolor$1 = (() => {
    if (primarycolor instanceof Some) {
      let color = primarycolor[0];
      return color;
    } else {
      return "#2A935B";
    }
  })();
  let secondarycolor$1 = (() => {
    if (secondarycolor instanceof Some) {
      let color = secondarycolor[0];
      return color;
    } else {
      return "#f9fafb";
    }
  })();
  return svg(
    prepend(
      attribute("xmlns", "http://www.w3.org/2000/svg"),
      prepend(
        attribute("width", "100"),
        prepend(
          attribute("height", "100"),
          prepend(
            attribute("viewBox", "0 0 1024 1024"),
            attributes
          )
        )
      )
    ),
    toList([
      path(
        toList([
          attribute("fill", primarycolor$1),
          attribute(
            "d",
            "M583.605 408.495C585.801 408.341 587.697 408.534 589.724 409.463C591.831 410.429 593.389 412.078 594.154 414.275C595.648 418.563 594.079 422.823 592.269 426.732C589.918 431.81 587.721 435.483 582.277 437.513C580.627 437.581 579.196 437.479 577.614 436.96C575.067 436.124 573.017 434.568 571.935 432.073C570.543 428.864 571.102 425.321 572.326 422.162C574.586 416.331 577.707 411.095 583.605 408.495Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", secondarycolor$1),
          attribute(
            "d",
            "M317.488 712.984C317.723 712.962 317.958 712.933 318.193 712.917C320.567 712.755 323.56 713.826 325.272 715.481C327.763 717.887 328.544 721.584 328.645 724.919C328.897 733.248 328.43 741.672 328.441 750.011L328.486 812.942Q328.364 827.114 328.506 841.286C328.56 847.28 328.982 853.538 328.364 859.501C328.09 862.151 327.323 864.46 325.416 866.392C323.659 868.173 321.869 868.603 319.45 868.898C311.229 869.901 301.971 868.993 293.651 868.959L232.375 868.539C229.742 868.545 227.1 868.66 224.973 866.857C222.889 865.09 221.693 862.401 221.48 859.709C221.272 857.096 221.998 854.361 223.833 852.434C225.412 850.774 227.39 850.161 229.604 849.852C236.659 848.869 244.495 849.489 251.637 849.473C270.566 849.433 289.936 850.192 308.816 849.035C309.504 834.292 309.019 819.318 309.014 804.554L308.986 719.901C311.256 716.015 313.195 714.423 317.488 712.984Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", secondarycolor$1),
          attribute(
            "d",
            "M144.967 810.689C156.352 809.821 168.473 813.618 177.586 820.396C188.102 828.218 194.603 839.056 196.405 852.04Q196.58 853.249 196.694 854.466Q196.808 855.682 196.861 856.903Q196.913 858.123 196.905 859.345Q196.896 860.567 196.826 861.787Q196.755 863.006 196.624 864.221Q196.492 865.436 196.3 866.642Q196.108 867.849 195.855 869.044Q195.602 870.24 195.289 871.421Q194.977 872.602 194.605 873.766Q194.233 874.929 193.804 876.073Q193.374 877.217 192.887 878.338Q192.4 879.458 191.858 880.553Q191.315 881.648 190.719 882.714Q190.122 883.78 189.472 884.815Q188.822 885.849 188.121 886.85Q187.42 887.851 186.67 888.815C178.106 900.042 165.806 905.522 152.118 907.431C139.991 907.985 129.293 905.641 119.476 898.216C108.914 890.229 102.38 878.794 100.561 865.715C98.7601 852.758 102.162 840.125 110.096 829.72C118.629 818.528 131.284 812.572 144.967 810.689ZM146.433 829.655C137.913 830.849 130.623 834.676 125.357 841.606C120.59 847.881 118.387 855.621 119.55 863.48C120.64 870.844 124.698 878.078 130.701 882.526Q131.766 883.3 132.893 883.98Q134.02 884.659 135.202 885.239Q136.383 885.819 137.611 886.294Q138.838 886.77 140.102 887.138Q141.366 887.506 142.656 887.764Q143.947 888.022 145.255 888.167Q146.564 888.312 147.879 888.344Q149.195 888.377 150.509 888.295C158.651 887.453 166.012 884.211 171.306 877.766Q171.774 877.196 172.213 876.604Q172.651 876.011 173.06 875.397Q173.469 874.784 173.847 874.151Q174.225 873.518 174.572 872.867Q174.918 872.216 175.231 871.548Q175.545 870.881 175.825 870.199Q176.105 869.517 176.351 868.822Q176.597 868.127 176.808 867.42Q177.019 866.714 177.195 865.998Q177.371 865.282 177.511 864.558Q177.651 863.834 177.755 863.104Q177.859 862.374 177.927 861.64Q177.995 860.906 178.026 860.169Q178.057 859.432 178.052 858.695Q178.047 857.958 178.005 857.221Q177.963 856.485 177.885 855.752Q177.796 855.014 177.67 854.282Q177.544 853.549 177.381 852.824Q177.219 852.098 177.021 851.382Q176.822 850.666 176.589 849.96Q176.355 849.255 176.086 848.562Q175.818 847.868 175.515 847.19Q175.213 846.511 174.876 845.848Q174.54 845.185 174.172 844.539Q173.803 843.894 173.403 843.268Q173.002 842.642 172.571 842.036Q172.14 841.431 171.68 840.847Q171.219 840.264 170.73 839.704Q170.241 839.145 169.724 838.61Q169.208 838.075 168.666 837.567Q168.123 837.059 167.556 836.578Q166.989 836.098 166.399 835.646Q165.871 835.24 165.325 834.858Q164.779 834.476 164.217 834.119Q163.654 833.762 163.076 833.432Q162.497 833.101 161.905 832.797Q161.312 832.493 160.706 832.216Q160.1 831.94 159.482 831.691Q158.864 831.442 158.235 831.222Q157.606 831.001 156.968 830.81Q156.33 830.619 155.684 830.456Q155.038 830.294 154.385 830.162Q153.732 830.029 153.074 829.926Q152.416 829.824 151.753 829.751Q151.091 829.678 150.426 829.636Q149.761 829.594 149.095 829.582Q148.429 829.57 147.763 829.588Q147.097 829.606 146.433 829.655Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", primarycolor$1),
          attribute(
            "d",
            "M230.182 155.707L270.391 155.637C278.216 155.604 287.38 154.538 294.969 156.229C295.214 156.284 295.457 156.349 295.701 156.406C298.918 157.159 301.927 163.094 303.643 165.792C308.693 173.731 313.012 182.022 317.685 190.172L347.136 241.115L443.194 408.428L477.184 467.934C482.154 476.609 486.419 486.297 492.275 494.366C495.246 498.459 498.516 501.024 503.376 502.649C507.841 504.143 512.881 504.49 517.528 503.687C536.907 500.341 532.692 484.589 542.348 480.379C544.803 479.309 547.928 479.506 550.375 480.505C552.442 481.349 553.92 482.878 554.634 484.999C556.685 491.092 553.407 497.588 550.604 502.874Q549.816 504.089 548.954 505.252Q548.092 506.416 547.159 507.524Q546.227 508.631 545.227 509.679Q544.227 510.726 543.164 511.709Q542.101 512.693 540.978 513.608Q539.856 514.523 538.679 515.366Q537.502 516.21 536.275 516.979Q535.048 517.747 533.775 518.438Q532.801 518.96 531.802 519.434Q530.804 519.908 529.783 520.333Q528.763 520.758 527.723 521.132Q526.683 521.506 525.626 521.83Q524.568 522.153 523.497 522.424Q522.425 522.695 521.342 522.914Q520.258 523.133 519.165 523.298Q518.072 523.463 516.973 523.575Q515.873 523.687 514.769 523.745Q513.665 523.803 512.56 523.808Q511.455 523.812 510.35 523.762Q509.246 523.712 508.146 523.609Q507.045 523.505 505.951 523.348Q504.857 523.19 503.772 522.98Q502.687 522.77 501.613 522.506Q500.539 522.243 499.48 521.928C490.269 519.131 481.348 512.987 475.691 505.15C471.377 499.174 466.351 487.886 462.262 480.934C444.583 450.872 427.915 420.191 410.635 389.906L339.956 267.123L304.091 204.695C298.354 194.671 292.398 184.867 286.902 174.692C273.475 174.24 259.698 174.726 246.252 175.015C241.595 175.116 236.884 175.676 232.233 175.44C230.533 175.354 228.893 175.04 227.365 174.263C224.984 173.052 223.326 170.936 222.547 168.399Q222.396 167.907 222.295 167.402Q222.194 166.897 222.145 166.384Q222.096 165.871 222.098 165.356Q222.101 164.841 222.156 164.329Q222.21 163.817 222.316 163.313Q222.422 162.809 222.579 162.319Q222.735 161.828 222.94 161.356Q223.145 160.883 223.397 160.434C224.914 157.759 227.292 156.453 230.182 155.707Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", primarycolor$1),
          attribute(
            "d",
            "M790.793 214.141C791.383 214.222 791.971 214.307 792.553 214.434C796.202 215.231 797.959 217.666 799.907 220.605Q800.245 223.658 800.332 226.729C800.975 247.553 800.384 268.533 800.382 289.371L800.425 407.4L800.468 755.087L800.498 785.132C800.515 789.693 801.22 794.898 800.405 799.366C800.037 801.38 799.279 803.267 797.796 804.719C795.514 806.953 792.63 807.097 789.611 807.149C788.479 806.795 787.333 806.395 786.294 805.812C784.164 804.618 783.007 802.277 782.362 800.014C780.452 793.309 781.831 780.555 781.81 773.147L781.724 710.938L781.619 459.461L781.765 308.641L781.713 253.949C781.709 244.519 781.386 234.94 781.803 225.528C781.913 223.024 782.096 220.344 783.458 218.163C785.173 215.418 787.8 214.734 790.793 214.141Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", primarycolor$1),
          attribute(
            "d",
            "M232.219 215.031C233.61 215.02 234.972 215.028 236.328 215.376C238.878 216.031 241.134 217.506 242.408 219.85C243.499 221.857 243.698 224.098 243.836 226.339C244.767 241.514 243.92 257.296 243.903 272.53L243.884 362.394L243.747 665.591L243.905 759.946C243.918 767.466 245.171 798.261 243.356 803.118C242.12 806.422 239.61 807.967 236.584 809.466C235.813 809.604 235.029 809.741 234.246 809.777C231.771 809.892 229.135 809.046 227.382 807.26C225.716 805.562 224.918 803.09 224.571 800.788C223.589 794.273 224.308 786.798 224.304 780.165L224.255 736.529L224.41 403.29L224.375 286.006C224.372 264.539 223.897 242.959 224.561 221.504C226.574 217.937 228.321 216.33 232.219 215.031Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", primarycolor$1),
          attribute(
            "d",
            "M869.304 116.165C879.593 115.234 888.475 117.011 897.736 121.535C909.283 127.174 917.643 137.101 921.692 149.275C925.953 162.082 924.603 174.965 918.454 186.899C912.515 198.426 902.503 207.071 890.058 210.904Q888.892 211.258 887.71 211.554Q886.528 211.849 885.332 212.085Q884.137 212.321 882.931 212.497Q881.725 212.673 880.512 212.788Q879.299 212.903 878.082 212.958Q876.864 213.012 875.646 213.005Q874.427 212.999 873.211 212.931Q871.994 212.863 870.782 212.735Q869.571 212.606 868.367 212.417Q867.163 212.228 865.97 211.979Q864.777 211.73 863.599 211.421Q862.42 211.112 861.258 210.745Q860.096 210.378 858.954 209.953Q857.812 209.528 856.692 209.047Q855.573 208.565 854.479 208.028Q853.385 207.491 852.32 206.9C838.134 199.212 832.206 189.46 827.826 174.483C797.588 174.506 767.291 174.051 737.063 174.633C729.651 190.1 720.015 204.759 711.505 219.662L656.031 315.773C646.786 330.536 639.063 346.289 630.083 361.189C628.497 363.822 626.886 365.47 623.797 366.094C621.131 366.632 617.804 366.336 615.535 364.721C613.733 363.439 612.293 361.188 611.974 358.995C611.614 356.516 612.202 353.901 613.265 351.664C616.896 344.021 621.755 336.59 625.975 329.246C636.808 310.396 648.145 291.836 658.871 272.926L702.423 197.586C710.096 184.255 716.895 169.303 726.224 157.126C728.558 155.844 731.844 155.643 734.488 155.469C744.358 154.82 754.638 155.418 764.553 155.321C785.257 155.118 806.106 154.714 826.801 155.404C828.61 148.661 830.896 142.267 834.969 136.526C843.167 124.971 855.577 118.443 869.304 116.165ZM872.885 134.635C863.457 136.405 855.623 140.294 850.114 148.449C845.898 154.691 844.347 162.089 845.874 169.492C847.429 177.029 852.53 184.825 858.969 189.01C865.074 192.978 871.577 193.82 878.723 193.753C886.633 192.905 893.91 189.289 898.977 183.074C903.94 176.988 905.885 169.137 904.968 161.418C903.99 153.189 899.994 145.73 893.401 140.655Q892.862 140.234 892.303 139.838Q891.744 139.443 891.167 139.074Q890.591 138.706 889.997 138.365Q889.404 138.024 888.795 137.711Q888.186 137.399 887.563 137.115Q886.94 136.832 886.304 136.578Q885.669 136.324 885.022 136.101Q884.375 135.877 883.718 135.685Q883.061 135.492 882.396 135.33Q881.731 135.169 881.059 135.039Q880.387 134.909 879.71 134.811Q879.032 134.713 878.351 134.647Q877.67 134.581 876.986 134.547Q876.303 134.513 875.618 134.512Q874.934 134.51 874.25 134.541Q873.567 134.572 872.885 134.635Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", primarycolor$1),
          attribute(
            "d",
            "M143.542 116.174C152.49 115.275 162.17 117.074 170.217 121.081C181.312 126.606 190.564 137.185 194.415 148.977Q194.787 150.118 195.103 151.275Q195.418 152.433 195.677 153.604Q195.936 154.776 196.137 155.959Q196.339 157.142 196.482 158.333Q196.625 159.524 196.71 160.721Q196.795 161.918 196.821 163.117Q196.848 164.317 196.815 165.516Q196.783 166.716 196.692 167.912Q196.601 169.109 196.452 170.299Q196.302 171.49 196.095 172.671Q195.888 173.853 195.623 175.024Q195.359 176.194 195.037 177.35Q194.715 178.506 194.338 179.645Q193.96 180.783 193.527 181.902Q193.094 183.021 192.607 184.118Q192.12 185.215 191.58 186.286C184.125 200.77 172.772 207.54 157.685 212.349C158.549 249.201 157.773 286.278 157.656 323.15L157.845 465.979C157.884 497.052 157.514 528.173 157.966 559.239C166.629 561.553 174.359 564.62 181.348 570.384C190.861 578.229 195.652 588.897 196.797 601.037C198.12 615.053 194.396 627.506 185.312 638.331C177.033 648.197 165.573 653.265 152.92 654.416C141.981 654.737 131.799 653.366 122.425 647.289C111.787 640.393 103.49 628.169 100.984 615.752Q100.758 614.606 100.588 613.45Q100.419 612.294 100.307 611.13Q100.195 609.967 100.141 608.8Q100.087 607.633 100.091 606.464Q100.095 605.296 100.156 604.129Q100.218 602.962 100.337 601.8Q100.457 600.638 100.633 599.483Q100.81 598.328 101.044 597.183Q101.278 596.038 101.568 594.906Q101.858 593.774 102.204 592.658Q102.549 591.542 102.95 590.444Q103.351 589.347 103.805 588.27Q104.26 587.194 104.767 586.141Q105.274 585.089 105.833 584.063Q106.392 583.036 107.001 582.039Q107.609 581.042 108.267 580.076C115.581 569.12 126.397 562.038 139.321 559.459L138.799 212.365C132.807 210.889 127.009 208.872 121.781 205.532Q120.782 204.905 119.816 204.228Q118.85 203.551 117.919 202.827Q116.988 202.102 116.095 201.332Q115.202 200.562 114.348 199.748Q113.494 198.934 112.683 198.078Q111.871 197.223 111.103 196.327Q110.335 195.432 109.613 194.499Q108.892 193.566 108.217 192.599Q107.543 191.631 106.918 190.63Q106.293 189.63 105.719 188.6Q105.145 187.569 104.624 186.511Q104.102 185.453 103.635 184.37Q103.167 183.288 102.754 182.183Q102.341 181.078 101.984 179.954Q101.627 178.83 101.327 177.689Q101.027 176.548 100.784 175.394C98.1153 162.573 99.8482 149.278 107.209 138.32C115.786 125.552 128.815 119.104 143.542 116.174ZM146.476 135.176C137.584 136.335 129.869 139.916 124.279 147.105C119.743 152.937 117.695 160.944 118.763 168.233Q118.876 168.978 119.025 169.717Q119.174 170.456 119.36 171.186Q119.546 171.917 119.768 172.637Q119.99 173.357 120.248 174.066Q120.505 174.774 120.797 175.469Q121.09 176.164 121.416 176.843Q121.743 177.523 122.102 178.185Q122.462 178.847 122.854 179.491Q123.247 180.134 123.67 180.758Q124.094 181.381 124.548 181.983Q125.002 182.584 125.486 183.163Q125.969 183.741 126.481 184.295Q126.992 184.848 127.531 185.376Q128.069 185.903 128.633 186.403Q129.197 186.903 129.785 187.375Q130.373 187.846 130.984 188.288C136.866 192.498 143.491 193.787 150.581 193.817C159.004 192.636 166.554 189.454 171.778 182.411Q172.221 181.822 172.634 181.211Q173.047 180.6 173.429 179.97Q173.81 179.34 174.161 178.691Q174.511 178.042 174.828 177.377Q175.145 176.711 175.429 176.031Q175.713 175.351 175.962 174.657Q176.212 173.963 176.426 173.258Q176.641 172.553 176.82 171.838Q176.999 171.123 177.143 170.4Q177.286 169.677 177.393 168.948Q177.5 168.218 177.571 167.485Q177.641 166.751 177.675 166.015Q177.709 165.278 177.707 164.541Q177.704 163.804 177.664 163.068Q177.625 162.332 177.549 161.599Q177.473 160.865 177.36 160.137Q177.256 159.415 177.117 158.699Q176.977 157.984 176.802 157.276Q176.627 156.568 176.416 155.87Q176.206 155.172 175.96 154.485Q175.715 153.798 175.436 153.125Q175.157 152.451 174.844 151.792Q174.531 151.134 174.186 150.491Q173.841 149.849 173.464 149.225Q173.086 148.601 172.679 147.996Q172.271 147.392 171.833 146.808Q171.396 146.225 170.929 145.664Q170.463 145.104 169.969 144.567Q169.476 144.03 168.956 143.519Q168.436 143.008 167.891 142.523Q167.346 142.039 166.777 141.582Q166.209 141.126 165.618 140.698C160.233 136.741 153.18 134.425 146.476 135.176ZM144.9 577.617C136.994 578.955 130.372 582.416 125.59 589.085Q125.159 589.676 124.757 590.287Q124.356 590.898 123.985 591.529Q123.614 592.16 123.275 592.808Q122.936 593.456 122.63 594.12Q122.324 594.785 122.051 595.463Q121.778 596.142 121.539 596.833Q121.301 597.525 121.096 598.227Q120.892 598.929 120.723 599.641Q120.554 600.353 120.421 601.072Q120.287 601.791 120.19 602.516Q120.092 603.241 120.03 603.97Q119.969 604.698 119.944 605.429Q119.919 606.161 119.93 606.892Q119.941 607.623 119.988 608.353Q120.036 609.083 120.12 609.81Q120.203 610.536 120.323 611.258C121.602 618.654 125.627 625.688 131.82 630.038C137.736 634.193 145.949 636.305 153.099 634.997C161.477 633.175 168.581 629.748 173.429 622.334C177.742 615.74 178.9 608.009 177.195 600.379C175.475 592.685 170.966 586.155 164.257 582.006C158.188 578.252 151.968 577.17 144.9 577.617Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", secondarycolor$1),
          attribute(
            "d",
            "M869.822 369.652C881.427 368.272 893.573 370.399 903.207 377.213C913.909 384.781 922.088 396.144 924.209 409.197C926.36 422.437 923.762 435.378 915.795 446.244C908.829 455.745 897.437 463 885.734 464.767C884.872 476.389 885.543 488.55 885.531 500.222L885.692 575.778L885.507 812.282C891.671 814.065 897.518 816.146 902.825 819.854C913.24 827.129 921.289 839.694 923.472 852.215C925.647 864.691 922.391 876.764 915.097 886.994C906.616 898.888 894.818 905.068 880.621 907.364C871.981 908.302 862.303 906.609 854.543 902.677C842.94 896.798 833.307 885.455 829.361 873.061C825.525 861.013 827.098 847.627 832.951 836.488C840.233 822.629 851.638 816.056 866.137 811.626C866.712 800.133 866.185 788.316 866.252 776.788L866.242 688.73Q866.671 576.726 865.922 464.724C858.954 462.973 852.477 460.6 846.667 456.268C836.864 448.958 829.994 437.038 828.255 424.964C826.409 412.153 829.227 398.656 837.182 388.314Q837.923 387.363 838.709 386.449Q839.495 385.535 840.324 384.66Q841.154 383.786 842.025 382.953Q842.896 382.12 843.807 381.33Q844.718 380.54 845.666 379.796Q846.614 379.051 847.598 378.354Q848.581 377.657 849.597 377.008Q850.613 376.36 851.66 375.761Q852.706 375.163 853.781 374.616Q854.855 374.07 855.955 373.576Q857.055 373.082 858.177 372.643Q859.3 372.203 860.442 371.819Q861.585 371.435 862.745 371.106Q863.905 370.778 865.079 370.507Q866.254 370.235 867.44 370.022Q868.627 369.808 869.822 369.652ZM872.125 388.612C863.068 390.664 856.226 394.296 851.248 402.339C847.199 408.883 845.92 416.351 847.702 423.849C849.53 431.546 854.337 438.597 861.125 442.745C867.584 446.692 874.194 447.403 881.528 446.43C889.613 444.621 896.486 440.16 900.992 433.147C905.001 426.905 906.791 419.637 905.184 412.28Q905.027 411.555 904.834 410.838Q904.642 410.122 904.415 409.415Q904.187 408.709 903.926 408.014Q903.664 407.32 903.369 406.639Q903.074 405.958 902.746 405.293Q902.418 404.627 902.058 403.978Q901.698 403.329 901.307 402.699Q900.915 402.068 900.494 401.458Q900.072 400.847 899.621 400.258Q899.17 399.669 898.691 399.102Q898.212 398.536 897.706 397.993Q897.199 397.451 896.667 396.933Q896.135 396.416 895.578 395.926Q895.022 395.435 894.442 394.973Q893.861 394.51 893.259 394.076Q892.657 393.642 892.035 393.238C886.038 389.396 879.17 388.061 872.125 388.612ZM872.35 830.149C863.621 831.879 855.963 836.217 850.984 843.758Q850.599 844.336 850.244 844.933Q849.889 845.53 849.565 846.144Q849.24 846.758 848.947 847.387Q848.653 848.016 848.392 848.66Q848.131 849.303 847.902 849.959Q847.673 850.614 847.478 851.281Q847.282 851.947 847.12 852.622Q846.958 853.298 846.831 853.98Q846.703 854.663 846.61 855.351Q846.516 856.039 846.458 856.731Q846.399 857.423 846.375 858.117Q846.352 858.811 846.363 859.506Q846.374 860.2 846.42 860.893Q846.466 861.586 846.546 862.275Q846.627 862.965 846.742 863.65Q846.858 864.335 847.007 865.013C848.647 872.61 853.068 879.634 859.749 883.754C865.809 887.491 872.298 888.2 879.257 887.918C887.878 886.25 894.969 882.689 899.943 875.186Q900.323 874.6 900.675 873.996Q901.026 873.392 901.347 872.771Q901.668 872.151 901.959 871.515Q902.249 870.88 902.508 870.231Q902.767 869.582 902.995 868.921Q903.222 868.26 903.416 867.589Q903.61 866.918 903.772 866.238Q903.933 865.558 904.061 864.871Q904.189 864.185 904.283 863.492Q904.377 862.8 904.437 862.104Q904.498 861.408 904.524 860.709Q904.55 860.011 904.542 859.312Q904.534 858.614 904.491 857.916Q904.449 857.219 904.373 856.524Q904.296 855.83 904.186 855.14Q904.076 854.45 903.932 853.766C902.338 845.951 897.451 838.673 890.662 834.459C884.974 830.929 878.954 829.777 872.35 830.149Z"
          )
        ])
      ),
      path(
        toList([
          attribute("fill", secondarycolor$1),
          attribute(
            "d",
            "M316.133 386.052C317.505 385.998 318.923 385.916 320.283 386.143C323.695 386.714 325.77 388.661 327.672 391.442C330.705 395.877 332.854 401.082 335.491 405.775C340.125 414.021 345.046 422.113 349.678 430.373L387.687 497.547Q437.473 586.074 488.565 673.854C493.208 681.748 497.798 689.756 502.13 697.823C503.563 700.492 504.677 704.798 506.604 706.908C507.875 708.298 509.559 708.885 511.419 708.831C516.173 708.691 519.694 703.456 521.798 699.755L663.011 451.419L684.754 412.997C688.695 405.978 692.848 396.196 698.16 390.336C699.84 388.483 701.825 387.48 704.338 387.391C707.007 387.296 709.759 387.944 711.689 389.885C713.804 392.01 714.453 395.047 714.64 397.938C715.021 403.823 714.461 409.921 714.458 415.833L714.565 455.317Q715.081 519.835 714.689 584.353L715.038 798.768L715.03 833.068C715.095 839.955 715.485 846.857 715.368 853.741C715.295 858.046 715.249 862.898 711.804 866.013C710.051 867.598 707.784 868.252 705.446 868.092C701.113 867.796 698.683 865.794 695.987 862.592C694.505 855.29 695.141 847.374 695.174 839.942L695.253 809.552L695.413 689.25Q694.902 596.501 695.433 503.75C695.524 480.579 695.079 457.325 695.441 434.167C679.736 459.386 665.887 485.815 651.146 511.601L577.98 639.429L548.118 691.857C543.603 699.817 539.572 708.634 534.44 716.176C532.318 719.294 529.321 721.827 526.141 723.827C520.003 727.69 512.577 729.343 505.442 727.567C500.656 726.376 496.051 723.783 492.976 719.871C487.673 713.126 483.99 704.357 479.686 696.896L450.635 647.015L378.91 521.518C362.273 491.89 346.192 462.009 328.622 432.912C328.036 453.866 328.531 474.933 328.581 495.901L328.461 589.162L328.589 624.838C328.623 630.953 329.283 637.797 328.357 643.804C327.922 646.629 326.882 650.017 324.39 651.707Q323.992 651.971 323.57 652.194Q323.148 652.417 322.706 652.597Q322.264 652.777 321.806 652.911Q321.348 653.046 320.879 653.134Q320.41 653.222 319.934 653.263Q319.458 653.304 318.981 653.297Q318.504 653.289 318.03 653.235Q317.555 653.18 317.089 653.078C314.382 652.5 311.841 650.772 310.473 648.341C309.12 645.935 308.99 642.793 308.944 640.086C308.406 608.555 309.437 576.865 309.451 545.313L309.418 440.026C309.386 431.233 307.714 397.296 309.594 391.83C310.651 388.759 313.408 387.417 316.133 386.052Z"
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/maillage/maillage.mjs
function on_route_change(uri) {
  let $ = path_segments(uri.path);
  if ($.hasLength(1) && $.head === "auth") {
    return new OnChangeView(new Auth());
  } else {
    return new OnChangeView(new Main());
  }
}
function update3(model, msg) {
  if (msg instanceof OnChangeView) {
    let route = msg.view;
    return [
      (() => {
        let _record = model;
        return new Model4(route, _record.auth_model, _record.feed_model);
      })(),
      none()
    ];
  } else if (msg instanceof AuthMessage) {
    let auth_msg = msg[0];
    let $ = update(model.auth_model, auth_msg);
    let auth_model = $[0];
    let auth_effect = $[1];
    return [
      (() => {
        let _record = model;
        return new Model4(_record.view, auth_model, _record.feed_model);
      })(),
      auth_effect
    ];
  } else if (msg instanceof FeedMessage) {
    let feed_msg = msg[0];
    let $ = update2(model.feed_model, feed_msg);
    let feed_model = $[0];
    let feed_effect = $[1];
    return [
      (() => {
        let _record = model;
        return new Model4(_record.view, _record.auth_model, feed_model);
      })(),
      feed_effect
    ];
  } else {
    return [
      (() => {
        let _record = model;
        return new Model4(_record.view, _record.auth_model, _record.feed_model);
      })(),
      none()
    ];
  }
}
function view_feed2(model) {
  return view5(model.feed_model);
}
function view_auth(model) {
  return view2(model.auth_model);
}
function layout_empty(child, _) {
  return div(
    toList([class$("w-full h-full min-h-screen")]),
    toList([child])
  );
}
function navigation_item(label, paths, path2) {
  return div(
    toList([
      class$(
        "sc-keTIit _reset_2qoun_1 sc-ovuCP lhPKPj _cursorPointer_1ca4c_1 flex min-h-[48px] flex-col items-center justify-center gap-2 w-full p-[12px_8px_8px] rounded-[--05ebad98-ce65-4785-9582-ebf66b8f5bf4]"
      )
    ]),
    toList([
      span(
        toList([class$("sc-ghWlax gLamcN icon-module_root__7C4BA")]),
        toList([
          svg(
            toList([
              attribute("xmlns", "http://www.w3.org/2000/svg"),
              attribute("width", "1em"),
              attribute("height", "1em"),
              attribute("viewBox", "0 0 24 24"),
              attribute("fill", "none"),
              attribute("stroke", "currentColor"),
              attribute("stroke-width", "2"),
              attribute("stroke-linecap", "round"),
              attribute("stroke-linejoin", "round")
            ]),
            paths
          )
        ])
      ),
      span(
        toList([class$("sc-cEzcPc dEBkIT _reset_2qoun_1 font-body")]),
        toList([text2(label)])
      )
    ])
  );
}
function sidebar(model) {
  return div(
    toList([
      class$(
        "sc-keTIit _reset_2qoun_1 sc-ovuCP lhPKPj flex w-20 flex-none flex-col items-start self-stretch bg-[--49e8e4fd-73fb-457b-ae9a-59c2d60e53ae]\n"
      )
    ]),
    toList([
      div(
        toList([
          class$(
            "sc-keTIit _reset_2qoun_1 flex flex-col items-center justify-center gap-2 p-6 w-full"
          )
        ]),
        toList([
          div(
            toList([class$("sc-keTIit inGEUB _reset_2qoun_1")]),
            toList([
              view6(
                toList([
                  attribute("width", "50"),
                  attribute("height", "50")
                ]),
                new None(),
                new None()
              )
            ])
          )
        ])
      ),
      div(
        toList([
          class$(
            "flex flex-col items-center gap-1 p-2 w-full flex-1"
          )
        ]),
        toList([
          navigation_item(
            "Home",
            toList([
              path(
                toList([
                  attribute(
                    "d",
                    "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  )
                ])
              ),
              polyline(
                toList([attribute("points", "9 22 9 12 15 12 15 22")])
              )
            ]),
            "9 22V12H15V22"
          ),
          navigation_item(
            "Mails",
            toList([
              polyline(
                toList([
                  attribute(
                    "points",
                    "22 12 16 12 14 15 10 15 8 12 2 12"
                  )
                ])
              ),
              path(
                toList([
                  attribute(
                    "d",
                    "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
                  )
                ])
              )
            ]),
            "22 12H16L14 15H10L8 12H2"
          )
        ])
      ),
      div(
        toList([]),
        toList([
          (() => {
            let $ = model.auth_model.current_user;
            if ($ instanceof Some) {
              return div(toList([]), toList([]));
            } else {
              return a(
                toList([href("/auth")]),
                toList([
                  div(
                    toList([
                      class$(
                        "rounded-full w-10 h-10 border-b border-neutral-border bg-default-font flex items-center justify-center"
                      )
                    ]),
                    toList([
                      svg(
                        toList([
                          attribute("viewBox", "0 0 32 32"),
                          attribute("height", "32"),
                          attribute("width", "32"),
                          attribute("fill", "black")
                        ]),
                        toList([
                          path(
                            toList([
                              attribute(
                                "d",
                                "M23.74,16.18a1,1,0,1,0-1.41,1.42A9,9,0,0,1,25,24c0,1.22-3.51,3-9,3s-9-1.78-9-3a9,9,0,0,1,2.63-6.37,1,1,0,0,0,0-1.41,1,1,0,0,0-1.41,0A10.92,10.92,0,0,0,5,24c0,3.25,5.67,5,11,5s11-1.75,11-5A10.94,10.94,0,0,0,23.74,16.18Z"
                              )
                            ])
                          ),
                          path(
                            toList([
                              attribute(
                                "d",
                                "M16,17a7,7,0,1,0-7-7A7,7,0,0,0,16,17ZM16,5a5,5,0,1,1-5,5A5,5,0,0,1,16,5Z"
                              )
                            ])
                          )
                        ])
                      )
                    ])
                  )
                ])
              );
            }
          })()
        ])
      )
    ])
  );
}
function layout_sidebar(child, model) {
  return div(
    toList([
      class$("w-full h-full min-h-screen text-default-font flex")
    ]),
    toList([
      sidebar(model),
      (() => {
        let $ = model.auth_model.current_user;
        if ($ instanceof Some) {
          let current_user = $[0];
          return text2("Auth");
        } else {
          return text2("");
        }
      })(),
      div(
        toList([
          class$(
            "flex flex-col items-start gap-4 self-stretch flex-1"
          )
        ]),
        toList([child])
      )
    ])
  );
}
function view7(model) {
  let page = (() => {
    let $ = model.view;
    if ($ instanceof Auth) {
      let _pipe = view_auth(model);
      return layout_empty(_pipe, model);
    } else {
      let _pipe = view_feed2(model);
      return layout_sidebar(_pipe, model);
    }
  })();
  return page;
}
var query_current_user = "query Me {\n  me {\n    name\n    slug\n  }\n}";
function get_current_user() {
  let $ = get_token();
  if ($.isOk()) {
    let session_token = $[0];
    let res = (() => {
      let _pipe = get_client();
      let _pipe$1 = set_query(_pipe, query_current_user);
      let _pipe$2 = set_operation_name(_pipe$1, "Me");
      return set_header3(
        _pipe$2,
        "Authorization",
        "Bearer " + session_token
      );
    })();
    let login_decoder = field(
      "me",
      user_decoder(),
      (user) => {
        return success(user);
      }
    );
    let final_decoder = field(
      "data",
      login_decoder,
      (login2) => {
        return success(login2);
      }
    );
    return send3(
      res,
      expect_json(
        (dyn) => {
          return map_error(
            run(dyn, final_decoder),
            (err) => {
              debug(err);
              return toList([]);
            }
          );
        },
        (res2) => {
          let $1 = (() => {
            let _pipe = get_token();
            return map_error(
              _pipe,
              (_) => {
                throw makeError(
                  "panic",
                  "maillage",
                  65,
                  "",
                  "Failed getting access to storage!",
                  {}
                );
              }
            );
          })();
          if (!$1.isOk()) {
            throw makeError(
              "let_assert",
              "maillage",
              62,
              "",
              "Pattern match failed, no pattern matched the value.",
              { value: $1 }
            );
          }
          let session_token$1 = $1[0];
          if (res2.isOk()) {
            let user = res2[0];
            return new AuthMessage(
              new LoginResponse(
                new AuthenticatedUser(user, session_token$1)
              )
            );
          } else {
            let e = res2[0];
            debug(e);
            throw makeError(
              "panic",
              "maillage",
              77,
              "",
              "`panic` expression evaluated.",
              {}
            );
          }
        }
      )
    );
  } else {
    return from((dispatch) => {
      return dispatch(new Noop());
    });
  }
}
function init5(flags) {
  let $ = init3(flags);
  let auth_model = $[0];
  let $1 = init4(flags);
  let feed_model = $1[0];
  let feed_effect = $1[1];
  return [
    new Model4(new Main(), auth_model, feed_model),
    batch(
      toList([
        get_current_user(),
        map4(feed_effect, (e) => {
          return new FeedMessage(e);
        }),
        init2(on_route_change)
      ])
    )
  ];
}
function main() {
  let app = application(init5, update3, view7);
  let $ = start2(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "maillage",
      92,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return $;
}

// build/.lustre/entry.mjs
main();
