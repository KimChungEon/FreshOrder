import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AppShell } from "./components/AppShell";
import DashboardPage from "./pages/DashboardPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProductsPage from "./pages/ProductsPage";
import StoresPage from "./pages/StoresPage";
import SettlementsPage from "./pages/SettlementsPage";
import BoardPage from "./pages/BoardPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import BoardNewPage from "./pages/BoardNewPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";

const router = createBrowserRouter(
  [
    { path: "/login", element: <LoginPage /> },
    {
      path: "/",
      element: <AppShell />,
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: "dashboard",      element: <DashboardPage /> },
        { path: "orders",         element: <OrdersPage /> },
        { path: "orders/:id",     element: <OrderDetailPage /> },
        { path: "products",       element: <ProductsPage /> },
        { path: "stores",         element: <StoresPage /> },
        { path: "settlements",    element: <SettlementsPage /> },
        { path: "board",          element: <BoardPage /> },
        { path: "board/new",      element: <BoardNewPage /> },
        { path: "board/:id",      element: <BoardDetailPage /> },
        { path: "settings",       element: <SettingsPage /> },
        { path: "*",              element: <Navigate to="/dashboard" replace /> },
      ],
    },
  ],
  { basename: "/admin" },
);

export function App() {
  return <RouterProvider router={router} />;
}
