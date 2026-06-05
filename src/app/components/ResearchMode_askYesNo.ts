// Helper: ask user a yes/no question and wait for response with retry logic
export async function askYesNo(
  promptText: string,
  speakAndWait: (text: string) => Promise<void>,
  listenOnce: (ms: number) => Promise<string>,
  speakNow: (text: string) => void,
  totalTimeout = 15000
): Promise<boolean | null> {
  // Speak the prompt first
  await speakAndWait(promptText);

  const start = Date.now();

  while (Date.now() - start < totalTimeout) {
    const ans = await listenOnce(4000);
    if (!ans) {
      // no speech detected, try again
      continue;
    }

    const lower = ans.toLowerCase();
    if (lower.includes("yes") || lower.includes("yeah") || lower.includes("sure") || lower.includes("yep")) {
      return true;
    }
    if (lower.includes("no") || lower.includes("nah") || lower.includes("nope")) {
      return false;
    }

    // unclear answer, prompt again
    speakNow("Please say yes or no.");
  }

  return null;
}
