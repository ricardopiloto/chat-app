// The emoji the composer can offer: a short code for each, grouped for the picker.

export interface Emoji {
  code: string;
  glyph: string;
}

export interface EmojiGroup {
  id: "faces" | "gestures" | "play" | "nature" | "objects" | "symbols";
  glyph: string;
  items: Emoji[];
}

const entries = (list: string): Emoji[] =>
  list
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [code, glyph] = pair.split("=");
      return { code: code!, glyph: glyph! };
    });

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: "faces",
    glyph: "😀",
    items: entries(`
      grin=😀 smile=😄 laugh=😆 sweat_smile=😅 joy=😂 rofl=🤣 wink=😉 blush=😊 innocent=😇 heart_eyes=😍 star_struck=🤩
      kiss=😘 yum=😋 tongue=😛 crazy=🤪 thinking=🤔 shush=🤫 zipper=🤐 neutral=😐 expressionless=😑 smirk=😏 unamused=😒
      roll_eyes=🙄 grimace=😬 relieved=😌 pensive=😔 sleepy=😪 sleeping=😴 mask=😷 sick=🤢 dizzy_face=😵 hot=🥵 cold=🥶
      sunglasses=😎 nerd=🤓 confused=😕 worried=😟 frown=🙁 open_mouth=😮 astonished=😲 flushed=😳 pleading=🥺 cry=😢
      sob=😭 scream=😱 angry=😠 rage=😡 cursing=🤬 skull=💀 ghost=👻 alien=👽 robot=🤖 clown=🤡 devil=😈 imp=👿 poop=💩
    `),
  },
  {
    id: "gestures",
    glyph: "👍",
    items: entries(`
      thumbsup=👍 thumbsdown=👎 ok_hand=👌 victory=✌️ crossed_fingers=🤞 metal=🤘 call_me=🤙 point_up=☝️ point_down=👇
      point_left=👈 point_right=👉 raised_hand=✋ wave=👋 clap=👏 raised_hands=🙌 open_hands=👐 pray=🙏 handshake=🤝
      muscle=💪 fist=✊ punch=👊 writing_hand=✍️ eyes=👀 brain=🧠 heart=❤️ orange_heart=🧡 yellow_heart=💛 green_heart=💚
      blue_heart=💙 purple_heart=💜 black_heart=🖤 broken_heart=💔 sparkling_heart=💖 hundred=💯
    `),
  },
  {
    id: "play",
    glyph: "🎲",
    items: entries(`
      dice=🎲 chess=♟️ joker=🃏 game=🎮 puzzle=🧩 dart=🎯 trophy=🏆 medal=🏅 crown=👑 gem=💎 scroll=📜 book=📖 books=📚
      sword=⚔️ dagger=🗡️ shield=🛡️ bow=🏹 axe=🪓 wand=🪄 crystal_ball=🔮 potion=🧪 magic=✨ fire=🔥 lightning=⚡ ice=❄️
      skull_crossbones=☠️ dragon=🐉 unicorn=🦄 castle=🏰 tent=⛺ campfire=🏕️ map=🗺️ compass=🧭 key=🔑 lock=🔒 unlock=🔓
      coin=🪙 moneybag=💰 torch=🔦 candle=🕯️ bell=🔔 music=🎵 guitar=🎸 drum=🥁 mic=🎤 headphones=🎧
    `),
  },
  {
    id: "nature",
    glyph: "🌲",
    items: entries(`
      sun=☀️ moon=🌙 star=⭐ glowing_star=🌟 cloud=☁️ rain=🌧️ snow=🌨️ storm=⛈️ rainbow=🌈 wind=💨 tornado=🌪️ wave=🌊
      mountain=⛰️ volcano=🌋 tree=🌲 palm=🌴 cactus=🌵 flower=🌸 rose=🌹 leaf=🍃 mushroom=🍄 dog=🐶 cat=🐱 wolf=🐺 fox=🦊
      bear=🐻 lion=🦁 horse=🐴 owl=🦉 eagle=🦅 bat=🦇 snake=🐍 spider=🕷️ scorpion=🦂 bee=🐝 butterfly=🦋 fish=🐟 octopus=🐙
    `),
  },
  {
    id: "objects",
    glyph: "🍺",
    items: entries(`
      beer=🍺 beers=🍻 wine=🍷 cocktail=🍸 coffee=☕ tea=🍵 pizza=🍕 burger=🍔 meat=🍖 bread=🍞 cheese=🧀 apple=🍎 cake=🎂
      cookie=🍪 popcorn=🍿 party=🎉 gift=🎁 balloon=🎈 phone=📱 computer=💻 camera=📷 tv=📺 bulb=💡 battery=🔋 hammer=🔨
      wrench=🔧 gear=⚙️ link=🔗 pin=📌 paperclip=📎 pencil=✏️ memo=📝 envelope=✉️ package=📦 flag=🚩 hourglass=⏳ clock=🕐
    `),
  },
  {
    id: "symbols",
    glyph: "✅",
    items: entries(`
      check=✅ cross=❌ warning=⚠️ stop=🛑 question=❓ exclamation=❗ plus=➕ minus=➖ arrow_up=⬆️ arrow_down=⬇️
      arrow_left=⬅️ arrow_right=➡️ refresh=🔄 recycle=♻️ new=🆕 free=🆓 up=🆙 cool=🆒 ok=🆗 sos=🆘 info=ℹ️ eight_ball=🎱
    `),
  },
];

const ALL: Emoji[] = EMOJI_GROUPS.flatMap((g) => g.items);
const BY_CODE = new Map(ALL.map((e) => [e.code, e]));

/** Emoji whose code starts with the query first, then those that merely contain it. */
export function searchEmoji(query: string, limit = 8): Emoji[] {
  const needle = query.trim().toLowerCase().replace(/^:/, "");
  if (!needle) return ALL.slice(0, limit);
  const starts = ALL.filter((e) => e.code.startsWith(needle));
  const contains = ALL.filter((e) => !e.code.startsWith(needle) && e.code.includes(needle));
  return [...starts, ...contains].slice(0, limit);
}

/** Replaces each complete ":code:" that names a known emoji; unknown codes stay as typed. */
export const expandShortcodes = (text: string): string => text.replace(/:([a-z0-9_+-]+):/gi, (whole, code: string) => BY_CODE.get(code.toLowerCase())?.glyph ?? whole);
