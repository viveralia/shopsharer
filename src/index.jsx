import React, { createContext } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import ListPage from "./pages/ListPage";
import HomePage from "./pages/HomePage";
import Loading from "./components/shared/Loading";
import SignIn from "./components/SignIn";
import useAuth from "./hooks/useAuth";

export const UserContext = createContext();

function App() {
  const { loading, user } = useAuth();

  if (loading) return <Loading />;

  return user ? <AuthApp user={user} /> : <UnAuthApp />;
}

function AuthApp({ user }) {
  return (
    <BrowserRouter>
      <Switch>
        <UserContext.Provider value={user}>
          <Route path="/:listId" component={ListPage} />
          <Route exact path="/" component={HomePage} />
        </UserContext.Provider>
      </Switch>
    </BrowserRouter>
  );
}

function UnAuthApp() {
  return <SignIn />;
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
