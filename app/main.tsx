import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./app.css";
import Home from "./pages/Home";
import RoomSetup from "./pages/RoomSetup";
import GameRoom from "./pages/GameRoom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code/setup" element={<RoomSetup />} />
        <Route path="/room/:code" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
