/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
import { createRoot, StrictMode } from "sinwan/react-client";
import { App } from "./App";

const elem = document.getElementById("root");
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// https://bun.sh/docs/bundler/hmr#import-meta-hot-data
// Reuse the existing root across HMR updates — createRoot only runs once.
// accept() tells Bun this module handles its own updates (no full reload).
const root = (import.meta.hot.data.root ??= createRoot(elem));
root.render(app);
import.meta.hot.accept();
