import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global styles
document.documentElement.style.setProperty('--primary-color', '#1a2b47');
document.documentElement.style.setProperty('--secondary-color', '#b78628');
document.documentElement.style.setProperty('--accent-color', '#47a447');
document.documentElement.style.setProperty('--error-color', '#d9534f');
document.documentElement.style.setProperty('--dark-color', '#0c1524');

// Add custom class for gradient backgrounds
const style = document.createElement('style');
style.textContent = `
  .casino-gradient {
    background: linear-gradient(135deg, #1a2b47 0%, #0c1524 100%);
  }
  .gold-gradient {
    background: linear-gradient(135deg, #d4af37 0%, #b78628 100%);
  }
  .qr-scanner {
    position: relative;
    overflow: hidden;
  }
  .qr-scanner::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background-color: rgba(71, 164, 71, 0.7);
    box-shadow: 0 0 10px rgba(71, 164, 71, 0.7);
    animation: scan 2s linear infinite;
  }
  @keyframes scan {
    0% {
      top: 0;
    }
    100% {
      top: 100%;
    }
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
