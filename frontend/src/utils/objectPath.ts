export const getPath = (data: Record<string, any>, path: string) => {
  return path.split(".").reduce<any>((current, part) => current?.[part], data);
};

export const setPath = (data: Record<string, any>, path: string, value: any) => {
  const clone = structuredClone(data);
  const parts = path.split(".");
  let current = clone;
  for (const part of parts.slice(0, -1)) {
    current[part] = current[part] ?? {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return clone;
};
