import React, { useEffect, useContext } from "react";
import { Route, Routes, HashRouter, Navigate } from 'react-router-dom';
import Home from "./pages/Home"
import Search from "./pages/Search"
import Mesh from "./pages/Mesh"
import Api from "./pages/Api"
import Help from "./pages/Help"
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
  const MeshRoute = () => {
    return(
      <Routes>
        <Route path="" element={<Mesh />}></Route>
        <Route path=":searchParameterUrl" element={<Mesh />}></Route>
      </Routes>
    )
  } 
  const HelpRoute = () => {
    return(
      <Routes>
        <Route path="" element={<Help />}></Route>
      </Routes>
    )
  } 
  const ApiRoute = () => {
    return(
      <Routes>
        <Route path="" element={<Api />}></Route>
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
        <Route path="mesh/*" element={<MeshRoute />}></Route>
        <Route path="help/*" element={<HelpRoute />}></Route>
        <Route path="api/*" element={<Api />}></Route>
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
        <Route path="mesh/*" element={<MeshRoute />}></Route>
        <Route path="help/*" element={<HelpRoute />}></Route>
        <Route path="api/*" element={<Api />}></Route>
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
