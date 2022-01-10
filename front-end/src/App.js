import React, { useState, useContext } from "react";
import { Switch, Route, Routes, BrowserRouter } from 'react-router-dom';
import Home from "./pages/Home"
import Search from "./pages/Search"

const App = () => {

  return(
    <BrowserRouter>
      <Routes>
        <Route exact path="/" element={<Home />}></Route>
        <Route exact path="/search" element={<Search />}></Route>
        <Route path="/regkg/" element={<Home />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;