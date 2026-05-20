import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import menuIcon from '../assets/barra-de-menu.png';

const MobileNav = ({ links, userName, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mobile-nav-container" ref={dropdownRef}>
      <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        <img src={menuIcon} alt="Menu" />
      </button>

      {isOpen && (
        <div className="mobile-menu-dropdown fade-in">
          <nav className="mobile-nav-links">
            {links.map((link, index) => (
              <NavLink
                key={index}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mobile-user-section">
            <div className="mobile-user-name">{userName}</div>
            <button className="mobile-logout-btn" onClick={onLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNav;
