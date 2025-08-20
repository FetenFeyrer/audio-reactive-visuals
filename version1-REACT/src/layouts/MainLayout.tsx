// src/layouts/MainLayout.tsx
import { NavLink, Outlet } from "react-router-dom";
import ThemePicker from "../components/ThemePicker";

export default function MainLayout() {
  return (
    <>
      {/* tiny theme switcher (bottom-right) */}
      <ThemePicker />

      <nav className="navbar navbar-expand-lg bg-body-tertiary border-bottom">
        <div className="container">
          <NavLink to="/" className="navbar-brand">
            home
          </NavLink>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink to="/projects" className="nav-link">
                  projects
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/playground" className="nav-link">
                  playground
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/vinyl" className="nav-link">
                  vinyl
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/contact" className="nav-link">
                  contact
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Outlet />
      </main>

      <footer className="border-top py-4 mt-5">
        <div className="container d-flex justify-content-between">
          <small>© {new Date().getFullYear()} Lasse Niederkrome</small>
          <small>
            <a
              className="link-secondary"
              href="https://github.com/lasseniederkrome"
              target="_blank"
              rel="noreferrer"
            >
              github
            </a>
          </small>
        </div>
      </footer>
    </>
  );
}