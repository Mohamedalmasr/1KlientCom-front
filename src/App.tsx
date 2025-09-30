import { Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./pages/Header";
import Footer from "./pages/Footer";
import "./App.css";

//admin
import Login from "./pages/admin/Login";
import AuthLayout from "./AuthLayout";
import Admin from "./pages/admin/Admin";
import Users from "./pages/admin/Users";
import CreateUserPage from "./pages/admin/addUsers";
import Timer from "./pages/admin/Timer";
import Settings from "./pages/admin/Settings";

const Layout = () => (
  <div className="app">
    <Header />
    <main className="main-content">
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
    ],
  },
 { path: "/admin/login", element: <Login /> },
{
  path: "/admin",
  element: <AuthLayout />,
  children: [
    { path: "dashboard", element: <Admin /> },
    { path: "users", element: <Users /> },
    { path: "add/users", element: <CreateUserPage /> },
    // تم إضافتهم عشان السايدبار:
    { path: "timer", element: <Timer /> },
    { path: "settings", element: <Settings /> },
  ],
},
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
