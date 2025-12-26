import React from "react";
import styled from "styled-components";

const MobileSearch = ({
  searchTerm,
  onChange,
  onSubmit,
  onFocus,
  suggestions,          // NEW
  onSelectSuggestion,   // NEW
}) => {
  return (
    <StyledWrapper className="mobile-search-wrapper">
      <form onSubmit={onSubmit}>
        <div className="container">
          {/* start in expanded state */}
          <input defaultChecked className="checkbox" type="checkbox" />
          <div className="mainbox">
            <div className="iconContainer">
              <svg
                viewBox="0 0 512 512"
                height="1em"
                xmlns="http://www.w3.org/2000/svg"
                className="search_icon"
              >
                <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
              </svg>
            </div>
            <input
              className="search_input"
              placeholder="search"
              type="text"
              value={searchTerm}
              onChange={onChange}
              onFocus={onFocus}
            />
          </div>

          {/* NEW: suggestions dropdown */}
          {suggestions && suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((m) => (
                <li
                  key={m._id}
                  onClick={() => onSelectSuggestion(m._id)}
                >
                  {m.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .container {
    position: relative;
    box-sizing: border-box;
    width: fit-content;
  }

  .mainbox {
    box-sizing: border-box;
    position: relative;
    width: 180px;
    height: 40px;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
    justify-content: center;
    border-radius: 160px;
    background-color: #000;
    transition: all 0.3s ease;
  }

  .checkbox {
    box-sizing: border-box;
    width: 30px;
    height: 30px;
    position: absolute;
    right: 10px;
    top: 5px;
    z-index: 9;
    cursor: pointer;
    appearance: none;
  }

  .checkbox:focus {
    border: none;
    outline: none;
  }

  .checkbox:checked {
    right: 10px;
  }

  .checkbox:checked ~ .mainbox {
    width: 50px;
  }

  .checkbox:checked ~ .mainbox .search_input {
    width: 0;
    height: 0;
  }

  .checkbox:checked ~ .mainbox .iconContainer {
    padding-right: 8px;
  }

  .search_input {
    box-sizing: border-box;
    height: 100%;
    width: 150px;
    background-color: transparent;
    border: none;
    outline: none;
    padding-bottom: 4px;
    padding-left: 10px;
    font-size: 1em;
    color: #fff;
    transition: all 0.3s ease;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue",
      sans-serif;
  }

  .search_input::placeholder {
    color: rgba(255, 255, 255, 0.78);
  }

  .iconContainer {
    box-sizing: border-box;
    padding-top: 5px;
    width: fit-content;
    transition: all 0.3s ease;
  }

  .search_icon {
    box-sizing: border-box;
    fill: #fff;
    font-size: 1.3em;
  }

  /* NEW: dropdown styles, kept minimal */
  .suggestions {
    position: absolute;
    top: 44px;           /* just below mainbox (40px height + small gap) */
    left: 0;
    right: 0;
    max-height: 160px;
    overflow-y: auto;
    background: #ffffff;
    color: #111827;
    border-radius: 0.375rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    z-index: 50;
  }

  .suggestions li {
    padding: 6px 10px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .suggestions li:hover {
    background: #f3f4f6;
  }
`;

export default MobileSearch;
