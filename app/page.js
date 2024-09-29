"use client";
import { useState, useRef } from "react";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [summary, setSummary] = useState(null);
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/wav" });
      setAudioBlob(blob);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const uploadAudio = async () => {
    if (audioBlob) {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      console.log("formData", formData);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setSummary(data.summary);
      console.log(data); // 回應的摘要或其他數據
    }
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "停止錄音" : "開始錄音"}
      </button>
      {audioBlob && <button onClick={uploadAudio}>上傳音訊</button>}
      {summary && (
        <div>
          <h2>標題</h2>
          <p>{summary.title}</p>
          <h2>正文</h2>
          <p>{summary.body}</p>
          <h2>日期</h2>
          <p>{summary.date}</p>
          <h2>分配對象</h2>
          <p>{summary.assignTo}</p>
        </div>
      )}
    </div>
  );
}
