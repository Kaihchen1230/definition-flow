import type { Dispatch, SetStateAction } from "react";
import type { UiNode } from "../../types/api";

export type ConfiguredComponentProps = {
  node: UiNode;
  data: Record<string, any>;
  setData: Dispatch<SetStateAction<Record<string, any>>>;
  userId: string;
  userRole: string;
  runAction: (id: string) => void;
  missingPaths?: Set<string>;
  validationActive?: boolean;
};
