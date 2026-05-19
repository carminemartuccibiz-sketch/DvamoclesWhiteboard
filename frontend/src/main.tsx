import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import { initializePlugins } from "./plugins/pluginRegistry";

void initializePlugins();

createRoot(document.getElementById("root")!).render(<App />);