import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const el = document.querySelector<HTMLDivElement>("#app");
if (!el) throw new Error('Missing root element: <div id="app"></div>');

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>
);
