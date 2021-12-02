import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import {FormattedMessage} from 'react-intl';
import "../style.css";
import logo from "../img/logo.svg";
import Theme from "../components/Theme"


const Home = () => {

  const contentTranslations = {
    paragraph : [
      <FormattedMessage id = "app.home.paraOne" />,
      <FormattedMessage id = "app.home.paraTwo" />,
      <FormattedMessage id = "app.home.paraThree" />,
      <FormattedMessage id = "app.home.paraFour" />,
    ],
    title : <FormattedMessage id = "app.home.title" />,
    subtitle : <FormattedMessage id = "app.home.subtitle" />,
    callToAction : <FormattedMessage id = "app.home.callToAction" />
  }

  return(
    <Theme>
      {/*Content*/}
      <Container className="p-5 mb-4 bg-light rounded-3">

        {/*Header*/}
        <Row className="">
          <Col>
            <h1 className="header">{contentTranslations.title}</h1>
          </Col>
        </Row>

        {/*Introduction*/}
        <Row>
          <p>{contentTranslations.paragraph[0]}</p>
          <p>{contentTranslations.paragraph[1]}</p>
        </Row>

        {/*Sub Header*/}
        <Row className="justify-content-md-center">
          <Col md="auto"><h2 className="display-6 bg-primary rounded-3 p-2">{contentTranslations.subtitle}</h2></Col>
        </Row>

        {/*Further Information*/}
        <Row>
          <p>{contentTranslations.paragraph[2]}</p>
          <p>{contentTranslations.paragraph[3]}</p>
        </Row>

        {/*Call To User Action*/}
        <Row className="justify-content-md-center">
          <Col md="auto"><h2 className="display-4 bg-light border border-primary rounded-3 p-3"><a href="#call_to_action" className="no-underline">{contentTranslations.callToAction}</a></h2></Col>
        </Row>
      </Container>
    </Theme>
  );
}

export default Home;
