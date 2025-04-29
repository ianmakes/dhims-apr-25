
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeApp } from "./utils/initializeApp";

// Initialize the app (create superuser etc.)
initializeApp();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />
);
