import { Show, createEffect, createSignal } from "solid-js";
import { accountAvatarUrl } from "../api/client";

type Props = {
  accountId: string;
  handle: string;
  hasAvatar?: boolean;
  class: string;
};

export function identityInitials(handle: string): string {
  const parts = handle.trim().split(/[\s._-]+/).filter(Boolean);
  const a = parts[0]?.[0];
  const b = parts[1]?.[0];
  if (a && b) return (a + b).toUpperCase();
  return handle.slice(0, 2).toUpperCase() || "?";
}

export default function IdentityAvatar(props: Props) {
  const [imgFailed, setImgFailed] = createSignal(false);

  createEffect(() => {
    props.accountId;
    props.hasAvatar;
    setImgFailed(false);
  });

  return (
    <Show
      when={props.hasAvatar && !imgFailed()}
      fallback={
        <span class={props.class} aria-hidden="true">
          {identityInitials(props.handle)}
        </span>
      }
    >
      <img
        class={props.class}
        src={accountAvatarUrl(props.accountId)}
        alt=""
        aria-hidden="true"
        draggable={false}
        onError={() => setImgFailed(true)}
      />
    </Show>
  );
}
