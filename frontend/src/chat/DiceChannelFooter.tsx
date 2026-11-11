import { createSignal } from "solid-js";
import { DiceComposer } from "./DiceComposer";
import { DiceToolbar } from "./DiceToolbar";

/** Rodapé do canal Dados: barra de dados + composer compacto partilhando a notação. */
export function DiceChannelFooter(props: { channelId: string; onSent?: () => void }) {
  const [notation, setNotation] = createSignal("1d20");
  return (
    <div class="ch-dice-footer">
      <DiceToolbar channelId={props.channelId} onNotationChange={setNotation} />
      <DiceComposer
        channelId={props.channelId}
        onSent={props.onSent}
        notation={notation()}
        onNotationChange={setNotation}
      />
    </div>
  );
}
