import "./index.css";
import App from "./App.tsx";
import { createRoot, StrictMode } from "sinwan/react-client";

// Reuse the root across HMR updates so the ComponentInstance (and its
// hook_slots / signal_slots) survives — this is what preserves state.
const elem = document.getElementById("root")!;
const root = import.meta.hot
  ? (import.meta.hot.data.root ??= createRoot(elem))
  : createRoot(elem);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Vite HMR: accept App updates and re-render. createRoot.render() detects the
// existing root and runs hotSwapRootInstance() instead of a full remount, so
// useState / useRef / signal() values are preserved (no full page reload).
if (import.meta.hot) {
  // (1) Edits to App.tsx (and its children that bubble up here) → hot-swap.
  import.meta.hot.accept("./App.tsx", (mod) => {
    const Next = mod?.default ?? App;
    root.render(
      <StrictMode>
        <Next />
      </StrictMode>,
    );
  });

  // (2) Self-accept edits to THIS entry module. Without this, editing
  // main.tsx has no accept boundary (it's the entry → nothing imports it),
  // so Vite falls back to a full page reload. Because `root` is persisted on
  // import.meta.hot.data, re-running this module reuses it and root.render()
  // hot-swaps into the same ComponentInstance — preserving state, no reload.
  import.meta.hot.accept();
}
