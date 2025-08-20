import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Playground from "./pages/Playground";
import Vinyl from "./pages/Vinyl";
import Contact from "./pages/Contact";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="projects" element={<Projects />} />
        <Route path="playground" element={<Playground />} />
        <Route path="vinyl" element={<Vinyl />} />
        <Route path="contact" element={<Contact />} />
      </Route>
    </Routes>
  );
}