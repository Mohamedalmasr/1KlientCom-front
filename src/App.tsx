import { Outlet, RouterProvider, createBrowserRouter, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
import Tasks from "./pages/admin/Tasks";
import AddTasks from "./pages/admin/AddTasks";
import BlogPost from "./pages/BlogPost";
import AdminBlogsList from "./pages/admin/AllBlogs";
import AdminAddBlog from "./pages/admin/AddBlog";
import AdminEditBlog from "./pages/admin/EditBlog";
import EditProject from "./pages/admin/EditProject";

/* ⬇️ (A1) NEW: admin contacts page */
import AdminContacts from "./pages/admin/Contacts";

function ScrollToTopOnRoute() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname, hash]);
  return null;
}

const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <ScrollToTopOnRoute />
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
      { path: "blog/:id", element: <BlogPost /> },
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

      // (keep both edit routes working)
      { path: "projects/:id/edit", element: <EditProject /> },
      { path: "projects/edit/:id", element: <EditProject /> },

      // Timer
      { path: "timer", element: <Timer /> },
      { path: "timer/my", element: <MyTimer /> },
      { path: "timer/report", element: <TimerReport /> },

      // Tasks
      { path: "tasks", element: <Tasks /> },
      { path: "add/tasks", element: <AddTasks /> },

      // Blogs
      { path: "blogs", element: <AdminBlogsList /> },
      { path: "add/blog", element: <AdminAddBlog /> },
      { path: "edit/blog/:id", element: <AdminEditBlog /> },

      /* ⬇️ (A1) NEW: Contacts route */
      { path: "contacts", element: <AdminContacts /> },

      // Settings
      { path: "settings", element: <Settings /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
