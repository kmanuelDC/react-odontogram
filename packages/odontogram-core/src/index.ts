// Public entry of @kmanueldc/odontogram-core: every module of the
// framework-free core. React (react-odontogram, react-native-odontogram) and
// Vue (vue-odontogram) build their components on top of it.
export * from "./types/geometry";
export * from "./types/odontogram";
export * from "./types/surfaces";
export * from "./types/findings";

export * from "./data/permanent";
export * from "./data/permanent-horizontal";
export * from "./data/primary";
export * from "./data/primary-horizontal";

export * from "./utils/anchors";
export * from "./utils/compositions";
export * from "./utils/dentition-layout";
export * from "./utils/finding-records";
export * from "./utils/findings";
export * from "./utils/labels";
export * from "./utils/layout";
export * from "./utils/mixed-layout";
export * from "./utils/navigation";
export * from "./utils/notation";
export * from "./utils/numbers";
export * from "./utils/primary-horizontal-layout";
export * from "./utils/primary-layout";
export * from "./utils/quadrants";
export * from "./utils/state-marks";
export * from "./utils/surfaces";
export * from "./utils/svg-geometry";
export * from "./utils/tooth-frames";

export * from "./catalogs/nts-peru";
