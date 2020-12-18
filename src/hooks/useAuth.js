import { useEffect, useState } from "react";
import * as db from "../firestore";

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return db.checkAuth((user) => {
      setLoading(false);
      setUser(user);
    });
  }, []);

  return { user, loading };
}

export default useAuth;
