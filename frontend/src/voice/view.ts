// Which view of the call is showing, shared by the stage (which draws it) and the user panel (which
// only offers screen sharing in the grid). It outlives the stage so the choice survives a navigation.
import { createSignal } from "solid-js";
import { readString, writeString } from "../lib/localPrefs";

export type CallView = "composition" | "grid";

const KEY = "mesa.call.view";
const initial = (): CallView => (readString(KEY) === "grid" ? "grid" : "composition");

const [view, setViewSignal] = createSignal<CallView>(initial());

export const callView = view;

export function setCallView(next: CallView): void {
  setViewSignal(next);
  writeString(KEY, next);
}
