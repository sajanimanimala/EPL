export async function recordAndSendAudio(durationMs = 4000) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  const mediaRecorder = new MediaRecorder(stream);

  const audioChunks: Blob[] = [];

  return new Promise<string>((resolve) => {
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, {
        type: "audio/wav",
      });

      const formData = new FormData();

      formData.append("file", audioBlob, "recording.wav");

      const response = await fetch(`${API_URL}/transcribe`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      resolve(data.text);
    };

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
    }, durationMs);
  });
}