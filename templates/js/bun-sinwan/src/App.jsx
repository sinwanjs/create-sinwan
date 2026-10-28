import { Routes, Route, NavLink } from "sinwan-router";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import "./index.css";

const navLinkClass = ({ isActive }) =>
  [
    "px-4 py-2 rounded-lg font-bold no-underline border border-[#fbf0df]",
    isActive
      ? "bg-[#fbf0df] text-[#1a1a1a]"
      : "text-[#fbf0df]",
  ].join(" ");

export function App() {
  return (
    <Routes>
      <nav class="flex justify-center gap-3 pt-8 relative z-10">
        <NavLink href="/" class={navLinkClass}>
          Home
        </NavLink>
        <NavLink href="/about" class={navLinkClass}>
          About
        </NavLink>
        <NavLink href="/contact" class={navLinkClass}>
          Contact
        </NavLink>
      </nav>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
    </Routes>
  );
}

export default App;
