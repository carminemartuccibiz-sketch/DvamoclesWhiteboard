import { createRoot } from "react-dom/client";
import App from "./App.tsx"; // <-- Corretto il percorso rimuovendo "/app"
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);