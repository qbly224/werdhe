import { useState, useEffect } from 'react';

export default function useDarkMode() {
  var [darkMode, setDarkMode] = useState(function() {
    return localStorage.getItem('werdhe_dark') === 'true';
  });

  useEffect(function() {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('werdhe_dark', darkMode);
  }, [darkMode]);

  function toggle() { setDarkMode(function(prev) { return !prev; }); }

  return { darkMode, toggle };
}