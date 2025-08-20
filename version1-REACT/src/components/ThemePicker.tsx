// src/components/ThemePicker.tsx
import { useEffect, useState } from "react";

const THEMES = [
  { id: "terminal", label: "terminal", bodyClass: "theme-terminal", bs: "dark" },
  //{ id: "default", label: "default", bodyClass: "" , bs: "dark" },
  { id: "glass", label: "glass", bodyClass: "theme-glass", bs: "dark" },
  { id: "brutal", label: "brutalist", bodyClass: "theme-brutal", bs: "light" },
  { id: "editorial", label: "editorial", bodyClass: "theme-editorial", bs: "light" },
  { id: "retro", label: "retro", bodyClass: "theme-retro", bs: "light" },
];

export default function ThemePicker() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme-id") || "default");

  useEffect(() => {
    // clear any previous theme-* classes
    document.body.classList.remove(...THEMES.map(t => t.bodyClass).filter(Boolean));
    const active = THEMES.find(t => t.id === theme) || THEMES[0];

    if (active.bodyClass) document.body.classList.add(active.bodyClass);

    // bootstrap theme switch (affects bg-body-* utilities)
    document.documentElement.setAttribute("data-bs-theme", active.bs);

    localStorage.setItem("theme-id", theme);
  }, [theme]);

  return (
    <div className="position-fixed" style={{ bottom: "1rem", right: "1rem", zIndex: 1000 }}>
      <div className="btn-group dropup">
        <button
          className="btn btn-outline-secondary btn-sm dropdown-toggle"
          data-bs-toggle="dropdown"  // <-- dropdown attribute
          aria-expanded="false"
        >
          theme: {THEMES.find(t => t.id === theme)?.label}
        </button>

        <ul className="dropdown-menu dropdown-menu-end">
          {THEMES.map(t => (
            <li key={t.id}>
              <button className="dropdown-item text-lowercase" onClick={() => setTheme(t.id)}>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}