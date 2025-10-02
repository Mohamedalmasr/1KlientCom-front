import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./pages/Header";
import Footer from "./pages/Footer";
import Blog from "./pages/Blog";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import "./App.css";

// admin
import Login from "./pages/admin/Login";
import AuthLayout from "./AuthLayout";
import Admin from "./pages/admin/Admin";
import Users from "./pages/admin/Users";
import CreateUserPage from "./pages/admin/addUsers";
import Timer from "./pages/admin/Timer";
import Settings from "./pages/admin/Settings";
import AllProjects from "./pages/admin/AllProjects";
import AddProjects from "./pages/admin/AddProjects";
import MyTimer from "./pages/admin/MyTimer";
import TimerReport from "./pages/admin/TimerReport";
import AllSettings from "./pages/admin/AllSettings";
import Tasks from "./pages/admin/Tasks";         
import AddTasks from "./pages/admin/AddTasks";    

const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 pt-10">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [{ index: true, element: <Home /> },
      { path: "about", element: <AboutUs /> },
      { path: "blog", element: <Blog /> },
      { path: "contact", element: <Contact /> },

    ],
  },
  { path: "/admin/login", element: <Login /> },
  {
    path: "/admin",
    element: <AuthLayout />,
    children: [
      { path: "dashboard", element: <Admin /> },

      // Users
      { path: "users", element: <Users /> },
      { path: "add/users", element: <CreateUserPage /> },

      // Projects
      { path: "projects", element: <AllProjects /> },       // All Projects
      { path: "add/projects", element: <AddProjects /> },   // Add Projects

      // Timer
      { path: "timer", element: <Timer /> },                // Timer
      { path: "timer/my", element: <MyTimer /> },           // My Timer
      { path: "timer/report", element: <TimerReport /> },   // Report

      // Tasks
      { path: "tasks", element: <Tasks /> },                // 👈 Tasks
      { path: "add/tasks", element: <AddTasks /> },         // 👈 Add Tasks

      // Settings
      { path: "settings", element: <Settings /> },          // Settings
      { path: "settings/all", element: <AllSettings /> },   // All Settings
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
