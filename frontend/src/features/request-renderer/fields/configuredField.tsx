import type { ComponentType } from "react";
import { getPath, setPath } from "../../../utils/objectPath";
import type { ConfiguredComponentProps } from "../types";
import type { FieldControlProps } from "./types";

export const configuredField = (FieldControl: ComponentType<FieldControlProps>) => {
  const ConfiguredField = ({ node, data, setData, missingPaths, validationActive }: ConfiguredComponentProps) => (
    <FieldControl
      node={node}
      value={node.dataPath ? getPath(data, node.dataPath) : undefined}
      onChange={(value) => node.dataPath && setData((current) => setPath(current, node.dataPath!, value))}
      invalid={Boolean(validationActive && node.dataPath && missingPaths?.has(node.dataPath))}
    />
  );
  ConfiguredField.displayName = `Configured${FieldControl.displayName ?? FieldControl.name ?? "Field"}`;
  return ConfiguredField;
};
