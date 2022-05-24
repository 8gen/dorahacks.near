import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import reportWebVitals from "./reportWebVitals";
import { Buffer } from "buffer";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
window.Buffer = global.Buffer = Buffer;
// @ts-ignore
root.render(
  <React.StrictMode>
    <BrowserRouter>
        <App  />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
