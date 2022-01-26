import React, { useState, useContext } from "react";
import { Route, Routes, BrowserRouter} from 'react-router-dom';
import Home from "./pages/Home"
import Search from "./pages/Search"
import {Context} from "./components/lang/LanguageWrapper";

const App = () => {  
  const context = useContext(Context);
  
  const EnglishRoute = () => {
    context.selectLanguage("en");
    return(
      <Routes>
        <Route path="" element={<Home />}></Route>
        <Route path="search" element={<Search />}></Route>
      </Routes>
    )
  }
  const FrenchRoute = () => {
    context.selectLanguage("fr");
    return(
      <Routes>
        <Route path="" element={<Home />}></Route>
        <Route path="search" element={<Search />}></Route>
      </Routes>
    )
  }

  return(
    <BrowserRouter>
      <Routes >
        <Route path="/en/*" element={<EnglishRoute />}></Route>
        <Route path="/fr/*" element={<FrenchRoute />}></Route>
      </Routes >
    </BrowserRouter>
  );
}

export default App;
