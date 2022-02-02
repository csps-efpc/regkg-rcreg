import React, { useEffect, useContext } from "react";
import { Route, Routes, HashRouter, Navigate } from 'react-router-dom';
import Home from "./pages/Home"
import Search from "./pages/Search"
import Instrument from "./pages/Instrument"
import {Context} from "./components/lang/LanguageWrapper";

const App = () => {  
  const context = useContext(Context);

  const SearchRoute = () => {
    return(
      <Routes>
        <Route path="" element={<Search />}></Route>
        <Route path=":searchParameterUrl/:paginationOffsetUrl" element={<Search />}></Route>
      </Routes>
    )
  } 
  const EnglishRoute = () => {
    useEffect(() => {
      context.selectLanguage("en");
    }, []); // Wrap in empty useEffect to run once per lifecycle
    return(
      <Routes>
        <Route path="" element={<Home />}></Route>
        <Route path="search/*" element={<SearchRoute />}></Route>
        <Route path="instrument/:instrumentId" element={<Instrument />}></Route>
      </Routes>
    )
  }
  const FrenchRoute = () => {
    useEffect(() => {
      context.selectLanguage("fr");
    }, []); // Wrap in empty useEffect to run once per lifecycle
    return(
      <Routes>
        <Route path="" element={<Home />}></Route>
        <Route path="search/*" element={<SearchRoute />}></Route>
        <Route path="instrument/:instrumentId" element={<Instrument />}></Route>
      </Routes>
    )
  }
  return(
    <HashRouter>
      <Routes >
        <Route path="/" element={<Navigate to="/en/" replace />}></Route>
        <Route path="/en/*" element={<EnglishRoute />}></Route>
        <Route path="/fr/*" element={<FrenchRoute />}></Route>
      </Routes >
    </HashRouter>
  );
}

export default App;
