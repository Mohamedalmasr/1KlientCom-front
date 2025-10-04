import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./pages/Header";
import Footer from "./pages/Footer";
import Blog from "./pages/Blog";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import "./App.css";
import ScrollToHash from "@/components/ScrollToHash";

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

// ====== Blogs pages (حقيقية) ======
import AdminBlogsList from "./pages/admin/AllBlogs";
import AdminAddBlog from "./pages/admin/AddBlog";
import AdminEditBlog from "./pages/admin/EditBlog";

const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <ScrollToHash />
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
    children: [
      { index: true, element: <Home /> },
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
      { path: "projects", element: <AllProjects /> },
      { path: "add/projects", element: <AddProjects /> },

      // Timer
      { path: "timer", element: <Timer /> },
      { path: "timer/my", element: <MyTimer /> },
      { path: "timer/report", element: <TimerReport /> },

      // Tasks
      { path: "tasks", element: <Tasks /> },
      { path: "add/tasks", element: <AddTasks /> },

      // Blogs (الجديد)
      { path: "blogs", element: <AdminBlogsList /> },
      { path: "add/blog", element: <AdminAddBlog /> },
      { path: "edit/blog/:id", element: <AdminEditBlog /> },

      // Settings
      { path: "settings", element: <Settings /> },
      { path: "settings/all", element: <AllSettings /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
