import { Routes, Route, NavLink } from "sinwan-router";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import "./index.css";

export function App() {
  return (
    <Routes>
      <nav class="flex justify-center gap-3 pt-8 relative z-10">
        <NavLink
          href="/"
          class="px-4 py-2 rounded-lg font-bold no-underline text-[#fbf0df] border border-[#fbf0df]"
          activeClass="bg-[#fbf0df] text-[#1a1a1a]"
        >
          Home
        </NavLink>
        <NavLink
          href="/about"
          class="px-4 py-2 rounded-lg font-bold no-underline text-[#fbf0df] border border-[#fbf0df]"
          activeClass="bg-[#fbf0df] text-[#1a1a1a]"
        >
          About
        </NavLink>
        <NavLink
          href="/contact"
          class="px-4 py-2 rounded-lg font-bold no-underline text-[#fbf0df] border border-[#fbf0df]"
          activeClass="bg-[#fbf0df] text-[#1a1a1a]"
        >
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
