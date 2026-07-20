import { useState } from "sinwan/react";
import { APITester } from "./components/APITester";
import "./index.css";

import logo from "./assets/logo.svg";
import sinwan from "./assets/sinwan.png";

export function App() {
  const [appCount, setAppCount] = useState(0);

  return (
    <div class="max-w-7xl mx-auto p-8 text-center relative z-10">
      <div class="flex justify-center items-center gap-8 mb-8">
        <img
          src={logo}
          alt="Bun Logo"
          class="h-24 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#646cffaa] scale-120"
        />
        <img
          src={sinwan}
          alt="Sinwan Logo"
          class="h-28 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-[spin_20s_linear_infinite]"
        />
      </div>
      <link rel="stylesheet" href="" />
      <h1 class="text-5xl font-bold my-4 leading-tight">Bun + Sinwan HMR</h1>
      <p>
        Edit{" "}
        <code class="bg-[#1a1a1a] px-2 py-1 rounded font-mono">
          src/App.jsx
        </code>{" "}
        and save to test HMR
      </p>
      <div class="flex justify-center gap-4 my-6">
        <button
          onclick={() => setAppCount((c) => c + 1)}
          class="bg-[#fbf0df] text-[#1a1a1a] px-5 py-2 rounded-lg font-bold hover:bg-[#f3d5a3] transition-all cursor-pointer"
        >
          App count (useState): {appCount()}
        </button>
      </div>
      <APITester />
    </div>
  );
}

export default App;
