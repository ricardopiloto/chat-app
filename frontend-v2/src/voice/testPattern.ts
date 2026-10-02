// A synthetic video source for "Testar vídeo": colour bars with a moving marker and a clock, drawn on a
// canvas. Joining with it proves the whole video path without ever opening the physical camera.
const WIDTH = 640;
const HEIGHT = 360;
const BARS = ["#c8c8c8", "#c8c800", "#00c8c8", "#00c800", "#c800c8", "#c80000", "#0000c8"];

export interface TestPattern {
  track: MediaStreamTrack;
  stop: () => void;
}

export function createTestPattern(label = "TESTE"): TestPattern {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const g = canvas.getContext("2d")!;
  const started = performance.now();

  const draw = () => {
    const seconds = (performance.now() - started) / 1000;
    const barWidth = WIDTH / BARS.length;
    BARS.forEach((colour, i) => {
      g.fillStyle = colour;
      g.fillRect(i * barWidth, 0, barWidth, HEIGHT);
    });
    g.fillStyle = "rgba(0,0,0,0.55)";
    g.fillRect(0, HEIGHT - 96, WIDTH, 96);
    g.fillStyle = "#fff";
    g.font = "700 34px sans-serif";
    g.textAlign = "center";
    g.fillText(label, WIDTH / 2, HEIGHT - 52);
    g.font = "500 22px monospace";
    g.fillText(`${seconds.toFixed(1)}s`, WIDTH / 2, HEIGHT - 20);
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(((seconds * 120) % (WIDTH + 40)) - 20, 60, 16, 0, Math.PI * 2);
    g.fill();
  };

  draw();
  const timer = window.setInterval(draw, 1000 / 15);
  const track = canvas.captureStream(15).getVideoTracks()[0] as MediaStreamTrack;
  return {
    track,
    stop: () => {
      window.clearInterval(timer);
      track.stop();
    },
  };
}
