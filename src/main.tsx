import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  // @ts-ignore: side-effect import of CSS file
  import "./index.css";
  createRoot(document.getElementById("root")!).render(<App />)
  