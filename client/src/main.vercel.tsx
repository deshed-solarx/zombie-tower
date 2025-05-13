import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import the generated CSS file for production builds
import "./styles/main.css";

createRoot(document.getElementById("root")!).render(<App />);