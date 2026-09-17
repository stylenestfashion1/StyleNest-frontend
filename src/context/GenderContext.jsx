import { createContext, useCallback, useContext, useEffect, useState } from "react";

const GenderContext = createContext(null);

function readStored() {
  try {
    return localStorage.getItem("stylenest_gender");
  } catch {
    return null;
  }
}

export function GenderProvider({ children }) {
  const [gender, setGenderState] = useState(readStored);

  useEffect(() => {
    if (gender) {
      document.body.setAttribute("data-gender", gender.toLowerCase());
      localStorage.setItem("stylenest_gender", gender.toLowerCase());
    } else {
      document.body.removeAttribute("data-gender");
      localStorage.removeItem("stylenest_gender");
    }
  }, [gender]);

  const setGender = useCallback((g) => setGenderState(g), []);

  return <GenderContext.Provider value={{ gender, setGender }}>{children}</GenderContext.Provider>;
}

export function useGender() {
  const ctx = useContext(GenderContext);
  if (!ctx) throw new Error("useGender must be used within GenderProvider");
  return ctx;
}
