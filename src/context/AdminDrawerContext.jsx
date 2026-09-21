import { createContext, useContext, useState, useCallback } from "react";

const AdminDrawerContext = createContext(null);

export function AdminDrawerProvider({ children }) {
  const [drawerState, setDrawerState] = useState({
    isOpen: false,
    type: null,
    payload: null,
  });

  const [toast, setToast] = useState(null);

  const openDrawer = useCallback((type, payload = null) => {
    setDrawerState({
      isOpen: true,
      type,
      payload,
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerState({
      isOpen: false,
      type: null,
      payload: null,
    });
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 4000);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <AdminDrawerContext.Provider
      value={{
        drawerState,
        openDrawer,
        closeDrawer,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AdminDrawerContext.Provider>
  );
}

export function useAdminDrawer() {
  const context = useContext(AdminDrawerContext);
  if (!context) {
    throw new Error("useAdminDrawer must be used within an AdminDrawerProvider");
  }
  return context;
}
