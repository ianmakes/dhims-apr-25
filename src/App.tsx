
// Import the necessary components and providers
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Toaster } from "./components/ui/toaster";
import { AcademicYearProvider } from "./contexts/AcademicYearContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AcademicYearProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AcademicYearProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
