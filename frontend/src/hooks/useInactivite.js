/* eslint-disable */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

var DELAI_INACTIVITE = 60 * 60 * 1000; // 1 heure
var AVERTISSEMENT    = 5  * 60 * 1000; // 5 minutes avant

export default function useInactivite(actif) {
  var auth     = useAuth();
  var navigate = useNavigate();
  var timer    = useRef(null);
  var warn     = useRef(null);
  var toastId  = useRef(null);

  var reset = useCallback(function() {
    clearTimeout(timer.current);
    clearTimeout(warn.current);
    if (toastId.current) { toast.dismiss(toastId.current); toastId.current = null; }

    if (!actif || !auth.user) return;

    // Avertissement 5min avant
    warn.current = setTimeout(function() {
      toastId.current = toast(
        function(t) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Session expire dans 5 minutes</div>
              <div style={{ fontSize: 12, color: '#888' }}>Aucune activité détectée</div>
              <button
                onClick={function() { toast.dismiss(t.id); reset(); }}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#1B6B3A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Rester connecté
              </button>
            </div>
          );
        },
        { duration: Infinity, position: 'top-center', icon: '⏰' }
      );
    }, DELAI_INACTIVITE - AVERTISSEMENT);

    // Déconnexion auto
    timer.current = setTimeout(function() {
      toast.dismiss();
      auth.logout();
      navigate('/login');
      toast('Session expirée - reconnectez-vous', { icon: '🔒', duration: 5000 });
    }, DELAI_INACTIVITE);
  }, [actif, auth, navigate]);

  useEffect(function() {
    if (!actif || !auth.user) return;

    var events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(function(e) { window.addEventListener(e, reset, { passive: true }); });
    reset();

    return function() {
      events.forEach(function(e) { window.removeEventListener(e, reset); });
      clearTimeout(timer.current);
      clearTimeout(warn.current);
    };
  }, [actif, auth.user, reset]);
}