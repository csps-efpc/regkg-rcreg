import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import {Link} from 'react-router-dom'
import {FormattedMessage, useIntl } from 'react-intl';
import {Context} from "../components/lang/LanguageWrapper";
import "../style.css";
import logo from "../img/logo.svg";
import { useLocation, useParams, useNavigate  } from 'react-router-dom';

/*
  Pages of Use: All
  Description: Creates a navigation bar that is i18n enabled.

  Users can browse between all the pages on the site, and switch languages.

  Toggling the language will simply update the LanguageWrapper, therefore
  you should be using the LanguageWrapper for text within pages/components
*/

const Navigation = () => {

  // In the LangWrapper we created a context that exported locale and selectLanguage
  const context = useContext(Context);

  // Keep track of what language the navbar is displaying
  // Set it based on the i18n wrapper language, which currently pulls from the browser
  const [navbarLang, setNavbarLang] = useState(context.locale); 

  const location = useLocation();
  const params = useParams();
  let navigate = useNavigate();

  /*
    Function: toggleLanguage
    Purpose: Toggle the navBar language between two values

    Since we are only providing two i18n we can toggle these values.
    If we have more translations then this should be a direct setting
  */
  const toggleLanguage = () => {
    if(navbarLang == "en"){
      setNavbarLang("fr");
      context.selectLanguage("fr");
      navigate(location.pathname.replace("en", "fr"));
    }
    else{
      setNavbarLang("en");
      context.selectLanguage("en");
      navigate(location.pathname.replace("fr", "en"));
    }
  }

  const navbarTranslations = {
    title : <FormattedMessage id = "app.navbar.title" />,
    home : <FormattedMessage id = "app.navbar.home" />,
    search : <FormattedMessage id = "app.navbar.search" />,
    about : <FormattedMessage id = "app.navbar.about" />,
    contact : <FormattedMessage id = "app.navbar.contact" />,
    language : <FormattedMessage id = "app.navbar.language" />,
  }

  const ariaTranslations = {
    title : useIntl().formatMessage({id: "app.navbar.title"}),
    home : useIntl().formatMessage({id: "app.navbar.home"}),
    search : useIntl().formatMessage({id: "app.navbar.search"}),
    about : useIntl().formatMessage({id: "app.navbar.about"}),
    contact : useIntl().formatMessage({id: "app.navbar.contact"}),
    language : useIntl().formatMessage({id: "app.navbar.language"}),
    menuHeader : useIntl().formatMessage({id: "app.navbar.menuHeader"}),
    menuOption : useIntl().formatMessage({id: "app.navbar.menuOption"}),
    langToggle : useIntl().formatMessage({id: "app.navbar.langToggle"}),
  }

  return(
    <Navbar bg="primary" variant="dark" className="">
      <Container>
        <Navbar.Brand aria-label={ariaTranslations.title + " " + ariaTranslations.menuOption} href="/">
          <img
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
            <Nav.Link as={Link} aria-label={ariaTranslations.home + " " + ariaTranslations.menuOption} to={"/" + navbarLang + "/"}>{navbarTranslations.home}</Nav.Link>
            <Nav.Link as={Link} aria-label={ariaTranslations.search + " " + ariaTranslations.menuOption} to={"/" + navbarLang + "/search"}>{navbarTranslations.search}</Nav.Link>
            <Nav.Link as={Link} aria-label={ariaTranslations.about + " " + ariaTranslations.menuOption} to={"/" + navbarLang + "/"}>{navbarTranslations.about}</Nav.Link>
            <Nav.Link as={Link} aria-label={ariaTranslations.contact + " " + ariaTranslations.menuOption} to={"/" + navbarLang + "/"}>{navbarTranslations.contact}</Nav.Link>
          </Nav>
        </Navbar.Collapse>
        <Navbar.Collapse className="justify-content-end">
          <Button aria-label={ariaTranslations.language + " " + ariaTranslations.langToggle} className="justify-content-end" variant="light" onClick={() => {toggleLanguage()}}>{navbarTranslations.language}</Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;
