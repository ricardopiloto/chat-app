import logo from "../../assets/logo.png";
import emblem from "../../assets/emblem.png";

// Official mark. "emblem" is the symbol alone, for tight spots (top bar, rail); "full" carries the
// wordmark, for auth and welcome screens.
export function Logo(props: { variant?: "emblem" | "full"; size?: number; class?: string }) {
  const size = () => props.size ?? (props.variant === "full" ? 96 : 28);
  return (
    <img
      class={`logo ${props.class ?? ""}`}
      src={props.variant === "full" ? logo : emblem}
      width={size()}
      height={size()}
      alt="Mesa"
      draggable={false}
    />
  );
}
