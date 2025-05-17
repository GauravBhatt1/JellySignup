import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "Jellyfin Signup";

// Add meta description for SEO
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'Create your Jellyfin streaming account to access your media library from anywhere.';
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
