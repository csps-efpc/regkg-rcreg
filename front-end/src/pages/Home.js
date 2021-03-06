import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Image from 'react-bootstrap/Image'
import {Link} from 'react-router-dom'
import {FormattedMessage, useIntl} from 'react-intl';
import "../style.css";
import logo from "../img/logo.svg";
import Theme from "../components/Theme"


const Home = () => {

  const intl = useIntl();


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
      <Row className="justify-content-md-center">
        <Col md="auto" >
          <Image
            src={logo}
            alt={intl.messages["app.logo.alt"]}
            width="120"
            height="120"
            fluid="true"
            className="bg-primary img-rounded border-primary rounded"
            style={{ border: '10px solid' }}
          />
        </Col>
      </Row>
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

        {/*Sub Header
        <Row className="justify-content-md-center">
          <Col md="auto"><h2 className="display-6 bg-primary rounded-3 p-2">{contentTranslations.subtitle}</h2></Col>
        </Row>
        */}
        {/*Further Information*/}
        <Row>
          <p>{contentTranslations.paragraph[2]}</p>
          <p>{contentTranslations.paragraph[3]}</p>
        </Row>

        {/*Call To User Action*/}
        <Row className="justify-content-md-center">
          <Col md="auto"><h2 className="display-4 bg-light border border-primary rounded-3 p-3"><Link to="search/" className="no-underline">{contentTranslations.callToAction}</Link></h2></Col>
        </Row>
      </Container>
    </Theme>
  );
}

export default Home;
