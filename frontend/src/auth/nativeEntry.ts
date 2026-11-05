import { createSignal } from "solid-js";
import type { NativeEntry } from "./entryScreen";

export const [nativeEntry, setNativeEntry] = createSignal<NativeEntry>("home");
