import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Moon, Sun } from "lucide-react";
import Login from "../Login/login";
import MobileSearch from "./MobileSearch"; // adjust path if needed

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const navigate = useNavigate();
  const avatarRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // THEME INIT
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // THEME APPLY
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // load user
  useEffect(() => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/auth/getuser", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "auth-token": token,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("auth-token");
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchUser();
  }, []);

  // external open-login-modal event
  useEffect(() => {
    const handler = () => setIsModalOpen(true);
    window.addEventListener("open-login-modal", handler);
    return () => window.removeEventListener("open-login-modal", handler);
  }, []);

  // lock scroll on modal
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "unset";
  }, [isModalOpen]);

  // fetch medicines
  useEffect(() => {
    const getMedicines = async () => {
      const URL = "http://localhost:5001/api/medicines";
      try {
        const response = await fetch(URL);
        if (!response.ok) {
          console.log("Could not fetch medicines");
          return;
        }
        const data = await response.json();
        setMedicines(data);
      } catch (error) {
        console.log("Internal Server error.");
      }
    };
    getMedicines();
  }, []);

  const handleSearchInputChange = (e) => {
    const userData = e.target.value;
    setSearchTerm(userData);

    if (userData) {
      const filtered = medicines.filter((medicine) =>
        medicine.name.toLowerCase().startsWith(userData.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();

    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    const exact = medicines.find((m) => m.name.toLowerCase() === term);

    if (exact) {
      setShowSuggestions(false);
      setSearchTerm("");
      navigate(`/medicine/${exact._id}`);
      return;
    }

    if (filteredSuggestions.length > 0) {
      const top = filteredSuggestions[0];
      setShowSuggestions(false);
      setSearchTerm("");
      navigate(`/medicine/${top._id}`);
      return;
    }

    navigate(`/search-not-found?query=${encodeURIComponent(searchTerm)}`);
  };

  const selectSuggestion = (medicineId) => {
    setSearchTerm("");
    setShowSuggestions(false);
    navigate(`/medicine/${medicineId}`);
  };

  const handleLoginSuccess = (loggedInUser, token) => {
    if (token) localStorage.setItem("auth-token", token);

    if (loggedInUser) {
      setUser(loggedInUser);
    } else {
      const t = token || localStorage.getItem("auth-token");
      if (t) {
        (async () => {
          try {
            const res = await fetch("http://localhost:5001/api/auth/getuser", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "auth-token": t,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setUser(data);
            }
          } catch (e) {
            console.error(e);
          }
        })();
      }
    }
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    setUser(null);
    setShowDropdown(false);
    navigate("/");
  };

  // close dropdown on route change
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate("/profile");
  };

  return (
    <nav className="navbar shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* top row */}
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-3xl font-bold text-green-600">
              MediQuick
            </Link>
          </div>

          {/* Desktop search (not on home) */}
          {!isHomePage && (
            <div className="hidden sm:block flex-grow px-4 lg:ml-6">
              <div className="relative max-w-lg w-full">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-4 pr-12 py-3 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 sm:text-lg"
                    placeholder="Search for Medicines/Healthcare products"
                    type="search"
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      type="submit"
                      className="h-full px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Search
                    </button>
                  </div>
                </form>

                {showSuggestions && filteredSuggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-300 w-full rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                    {filteredSuggestions.map((medicine) => (
                      <li
                        key={medicine._id}
                        onClick={() => selectSuggestion(medicine._id)}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                      >
                        {medicine.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center space-x-6">
            {!user ? (
              <>
                <button
                  onClick={openModal}
                  className="text-gray-700 hover:text-green-500 px-4 py-2 rounded-md text-lg font-medium"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/cart"
                  className="text-gray-700 hover:text-green-500 p-2 rounded-full hover:bg-gray-100"
                >
                  <ShoppingCart className="h-7 w-7" />
                </Link>

                <div className="relative" ref={avatarRef}>
                  <div
                    onClick={() => setShowDropdown((p) => !p)}
                    className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  {showDropdown && (
                    <div className="profile-dropdown profile-dropdown-open">
                      <div className="profile-dropdown-inner">
                        <button
                          type="button"
                          onClick={handleProfileClick}
                          className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                        >
                          Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Theme toggle button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 theme-toggle-btn"
            >
              {theme === "dark" ? (
                <>
                  <Sun size={18} /> <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={18} /> <span>Dark</span>
                </>
              )}
            </button>

            <Link
              to="/about"
              className="text-gray-700 hover:text-green-500 px-4 py-2 rounded-md text-lg font-medium"
            >
              About
            </Link>
          </div>

          {/* Mobile right side: pill search + hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <MobileSearch
              searchTerm={searchTerm}
              onChange={handleSearchInputChange}
              onSubmit={handleSearchSubmit}
              onFocus={() => setShowSuggestions(true)}
              suggestions={showSuggestions ? filteredSuggestions : []}
              onSelectSuggestion={selectSuggestion}
            />

            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-green-500 focus:outline-none"
              aria-label="Toggle navigation"
            >
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-end mobile-menu-overlay">
          <div className="bg-white w-64 h-full p-6 flex flex-col space-y-6 mobile-menu-panel">
            <button className="self-end text-gray-500" onClick={toggleMenu}>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {!user ? (
              <>
                <button
                  onClick={() => {
                    openModal();
                    toggleMenu();
                  }}
                  className="text-gray-700 hover:text-green-500 text-lg font-medium"
                >
                  Login
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/cart"
                  onClick={toggleMenu}
                  className="text-gray-700 hover:text-green-500 text-lg font-medium"
                >
                  Cart
                </Link>
                <Link
                  to="/profile"
                  onClick={toggleMenu}
                  className="text-gray-700 hover:text-green-500 text-lg font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                  className="text-gray-700 hover:text-green-500 text-lg font-medium"
                >
                  Logout
                </button>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-gray-700 hover:text-green-500 text-lg font-medium"
            >
              {theme === "dark" ? (
                <>
                  <Sun size={18} /> Light Mode
                </>
              ) : (
                <>
                  <Moon size={18} /> Dark Mode
                </>
              )}
            </button>

            <Link
              to="/about"
              onClick={toggleMenu}
              className="text-gray-700 hover:text-green-500 text-lg font-medium"
            >
              About
            </Link>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {isModalOpen && (
        <div className="modal-overlay flex justify-center items-center">
          <div className="bg-white p-6 rounded-md relative z-50">
            <button
              className="absolute top-1 right-3 text-gray-600 hover:text-red-500 cursor-pointer text-3xl font-bold"
              onClick={closeModal}
            >
              &times;
            </button>
            <Login onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
