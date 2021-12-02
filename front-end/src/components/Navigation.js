import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import {FormattedMessage} from 'react-intl';
import {Context} from "../components/lang/LanguageWrapper";
import "../style.css";
import logo from "../img/logo.svg";


const Navigation = () => {

  const [lang, setLang] = useState("en"); 

    const toggleLanguage = () => {
    if(lang == "en"){
      setLang("fr");
      context.selectLanguage("fr");
    }
    else{
      setLang("en");
      context.selectLanguage("en");
    }
  }

  const context = useContext(Context);

  const navbarTranslations = {
    title : <FormattedMessage id = "app.navbar.title" />,
    home : <FormattedMessage id = "app.navbar.home" />,
    search : <FormattedMessage id = "app.navbar.search" />,
    about : <FormattedMessage id = "app.navbar.about" />,
    contact : <FormattedMessage id = "app.navbar.contact" />,
    language : <FormattedMessage id = "app.navbar.language" />,
  }

  return(
    <Navbar bg="primary" variant="dark" className="">
      <Container>
        <Navbar.Brand href="#home">
          <img
            alt="Knowledge Graph"
            src={logo}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />
          {" " /*Spacing between logo and title*/ }
          {navbarTranslations.title}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#home">{navbarTranslations.home}</Nav.Link>
            <Nav.Link href="#search">{navbarTranslations.search}</Nav.Link>
            <Nav.Link href="#about">{navbarTranslations.about}</Nav.Link>
            <Nav.Link href="#contact">{navbarTranslations.contact}</Nav.Link>
          </Nav>
        </Navbar.Collapse>
        <Navbar.Collapse className="justify-content-end">
          <Button className="justify-content-end" variant="light" onClick={() => {toggleLanguage()}}>{navbarTranslations.language}</Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;