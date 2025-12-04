import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, isFirebaseConfigured } from '../services/firebase'; // use wrapper from services
// Ensure path is correct
import logo from '../assets/ecolumina_logo.svg'; 

export default function SplashScreen() {
  const navigate = useNavigate();
  
  // State to track if the minimum animation time has passed
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  // State to track the authentication result
  const [authStatus, setAuthStatus] = useState<{ checked: boolean; isAuthenticated: boolean }>({
    checked: false,
    isAuthenticated: false,
  });

  useEffect(() => {
    // 1. CONFIG CHECK: If firebase isn't set up, we can't really do anything dynamic.
    // We'll just let the timer finish and send them to Auth to see the error there, 
    // or you could show an error text here.
    if (!isFirebaseConfigured) {
      console.warn("Firebase config missing in Splash.");
    }

    // 2. MINIMUM TIMER: Ensure the splash shows for at least 3 seconds
    // (So the animation isn't a jarring flash if auth is super fast)
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000); // 3 seconds matches the animation flow better

    // 3. AUTH LISTENER: Check real-time auth status (works for Firebase or local mock)
    const unsubscribe = onAuthStateChanged((user: any) => {
      // If user exists, they are authenticated
      setAuthStatus({ checked: true, isAuthenticated: !!user });
    });

    // Cleanup
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // 4. NAVIGATION LOGIC: Run this whenever time or auth status changes
  useEffect(() => {
    // Only proceed if BOTH the timer is done AND auth has been checked
    if (minTimeElapsed && authStatus.checked) {
      if (authStatus.isAuthenticated) {
        navigate('/home'); // User is already logged in
      } else {
        navigate('/'); // User needs to login (root login route)
      }
    }
  }, [minTimeElapsed, authStatus, navigate]);

  return (
    <div style={styles.container}>
      {/* Inject CSS Keyframes */}
      <style>{cssStyles}</style>

      <div style={styles.gradient}>
        
        {/* LOGO */}
        <div style={styles.logoContainer} className="animate-logo-entrance">
          <div style={styles.logoWrapper}>
            <div style={styles.logoGlow} className="animate-glow-pulse" />
            <img 
              src={logo} 
              alt="Ecolumina Logo" 
              style={styles.logoImage} 
            />
          </div>
        </div>

        {/* TITLE */}
        <div style={styles.textContainer} className="animate-text-entrance">
          <h1 style={styles.title}>ECOLUMINA</h1>
          <div style={styles.underline} />
        </div>

        {/* TAGLINE */}
        <p style={styles.tagline} className="animate-tagline-fade">
          LIGHTING THE PATH TO SUSTAINABILITY
        </p>

      </div>
    </div>
  );
}

// --- CSS KEYFRAMES & CLASSES ---
const cssStyles = `
  @keyframes logoEntrance {
    0% { opacity: 0; transform: scale(0.7); }
    100% { opacity: 1; transform: scale(1); }
  }

  @keyframes textEntrance {
    0% { opacity: 0; transform: translateY(30px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes simpleFade {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes glowPulse {
    0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.98); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  /* CSS Classes */
  .animate-logo-entrance {
    animation: logoEntrance 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  .animate-text-entrance {
    opacity: 0; 
    animation: textEntrance 1.5s ease-out 1.5s forwards; /* Delayed start */
  }

  .animate-tagline-fade {
    opacity: 0;
    animation: simpleFade 1.5s ease-out 1.5s forwards; /* Delayed start */
  }

  .animate-glow-pulse {
    animation: glowPulse 2s infinite alternate;
  }
`;

// di ko alam mag tailwind kaya ginanito ko muna
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000000',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    margin: 0,
    padding: 0,
  },
  gradient: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(180deg, #000000 0%, #0a140a 50%, #000000 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: '220px',
    height: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '25px',
    position: 'relative',
  },
  logoWrapper: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    border: '1px solid rgba(148, 163, 184, 0.6)',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '190px',
    height: '190px',
    borderRadius: '50%',
    backgroundColor: 'rgba(76, 175, 80, 0.28)',
    boxShadow: '0 0 30px rgba(76, 175, 80, 0.8)',
    pointerEvents: 'none',
  },
  logoImage: {
    width: '135px',
    height: '135px',
    objectFit: 'contain',
    zIndex: 1,
    position: 'relative',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 0,
  },
  title: {
    fontSize: '32px',
    fontWeight: 200,
    color: '#FFFFFF',
    letterSpacing: '14px',
    textShadow: '0 0 20px rgba(76, 175, 80, 0.6)',
    margin: 0,
  },
  underline: {
    width: '280px',
    height: '1px',
    backgroundColor: '#4CAF50',
    marginTop: '20px',
    boxShadow: '0 0 10px rgba(76, 175, 80, 0.8)',
  },
  tagline: {
    fontSize: '10px',
    fontWeight: 300,
    color: '#81C784',
    letterSpacing: '4px',
    marginTop: '24px',
    textShadow: '0 0 10px rgba(129, 199, 132, 0.4)',
    margin: '24px 0 0 0', 
  },
};

