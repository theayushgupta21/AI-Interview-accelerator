
export function speakText(text: string): void {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported.");
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const speak = () => {
    const voices = synth.getVoices();

    // Prefer an Indian English female voice when available.
    const indianEnglishVoices = voices.filter(
      (voice) => voice.lang.toLowerCase() === "en-in"
    );

    const femaleVoice =
      indianEnglishVoices.find((voice) =>
        /female|woman|heera/i.test(voice.name)
      ) ??
      indianEnglishVoices.find((voice) =>
        /india|indian/i.test(voice.name)
      );

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    synth.speak(utterance);
  };

  if (synth.getVoices().length > 0) {
    speak();
  } else {
    synth.addEventListener("voiceschanged", speak, { once: true });
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
