import React, { useState, useContext } from "react";
import { Route, Routes, HashRouter} from 'react-router-dom';
import Home from "./pages/Home"

const App = () => {

  return(
    <HashRouter>
      <Routes >
        <Route exact path="/" element={<Home />}>
        </Route>
      </Routes >
    </HashRouter>
  );
}

export default App;
