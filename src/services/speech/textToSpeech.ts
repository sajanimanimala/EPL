export function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 0.9;
  utterance.pitch = 1;

  speechSynthesis.speak(utterance);
}