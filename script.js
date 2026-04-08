const body = document.body;
const preloader = document.querySelector("[data-preloader]");
const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");
const yearNode = document.querySelector("[data-year]");
const interactiveTargets = document.querySelectorAll(".button, .button-secondary, .button-ghost, .button-light, button");
let audioContext;
let introStarted = false;

const hidePreloader = () => {
  if (!preloader) {
    body.classList.remove("is-loading");
    return;
  }

  preloader.classList.add("is-hidden");
  body.classList.remove("is-loading");
};

window.addEventListener("load", () => {
  window.setTimeout(hidePreloader, 700);
});

window.setTimeout(hidePreloader, 1800);

const ensureAudioContext = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  return audioContext;
};

const shapeGain = (context, gain, points) => {
  points.forEach(([value, time]) => {
    gain.gain.linearRampToValueAtTime(value, context.currentTime + time);
  });
};

const playIntroMusic = async () => {
  if (introStarted) {
    return;
  }

  introStarted = true;

  try {
    const context = await ensureAudioContext();
    const master = context.createGain();
    master.gain.value = 0.008;
    master.connect(context.destination);

    const now = context.currentTime;
    [432, 486, 576].forEach((frequency, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(frequency, now);
      filter.type = "lowpass";
      filter.frequency.value = 920;
      gain.gain.setValueAtTime(0.0001, now);
      gain.connect(master);
      osc.connect(filter);
      filter.connect(gain);
      shapeGain(context, gain, [
        [0.0009 + index * 0.00035, index * 0.18 + 0.22],
        [0.00035, 2.2 + index * 0.12],
        [0.0001, 3.4 + index * 0.14]
      ]);
      osc.start(now + index * 0.12);
      osc.stop(now + 3.8 + index * 0.12);
    });
  } catch (error) {
    introStarted = false;
  }
};

const playClickSound = async () => {
  try {
    const context = await ensureAudioContext();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.value = 0.22;
    master.connect(context.destination);

    const oscA = context.createOscillator();
    const oscB = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    oscA.type = "sine";
    oscB.type = "triangle";
    oscA.frequency.setValueAtTime(960, now);
    oscA.frequency.exponentialRampToValueAtTime(540, now + 0.11);
    oscB.frequency.setValueAtTime(660, now);
    oscB.frequency.exponentialRampToValueAtTime(330, now + 0.14);

    filter.type = "lowpass";
    filter.frequency.value = 1200;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.015, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    oscA.start(now);
    oscB.start(now + 0.005);
    oscA.stop(now + 0.18);
    oscB.stop(now + 0.18);
  } catch (error) {
    // Ignore audio failures silently so the UI still works.
  }
};

window.addEventListener(
  "pointerdown",
  () => {
    playIntroMusic();
  },
  { once: true }
);

window.addEventListener("load", () => {
  playIntroMusic();
});

interactiveTargets.forEach((target) => {
  target.addEventListener("click", () => {
    playClickSound();
  });
});

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}
