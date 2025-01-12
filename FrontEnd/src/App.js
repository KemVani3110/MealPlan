import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import routes from "./routes";
import Loading from "./Components/Loading/Loading";

const App = () => {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
