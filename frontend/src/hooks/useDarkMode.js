/* eslint-disable */
import { useState, useEffect } from 'react';

export default function useDarkMode() {
  var [darkMode, setDarkMode] = useState(function() {
    var saved = localStorage.getItem('werdhe-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(function() {
    var root = document.documentElement;
    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('werdhe-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      root.style.colorScheme = 'light';
      localStorage.setItem('werdhe-theme', 'light');
    }
  }, [darkMode]);

  function toggleDarkMode() { setDarkMode(function(d) { return !d; }); }

  return { darkMode, toggleDarkMode, setDarkMode };
}