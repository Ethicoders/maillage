export const expect = async (mod, fn, expected) => {
  const loadedModule = await import(mod);
  mod[fn] = (...any) => expected;
};
