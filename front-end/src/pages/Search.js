import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Nav from "react-bootstrap/Nav";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import {FormattedMessage} from 'react-intl';
import "../style.css";
import logo from "../img/logo.svg";
import Theme from "../components/Theme"


const Search = () => {

  const contentTranslations = {
    title : <FormattedMessage id = "app.search.title" />,
    mainButton : <FormattedMessage id = "app.search.mainButton" />,
    introduction : <FormattedMessage id = "app.search.introduction" />,
    advancedQueries : <FormattedMessage id = "app.search.advancedQueries" />,
    referenceGuide : <FormattedMessage id = "app.search.referenceGuide" />,
    searchLabel : <FormattedMessage id = "app.search.searchLabel" />,
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
          <p>{contentTranslations.introduction}</p>

          {/*Search Box*/}
          <InputGroup size="lg">
            <InputGroup.Text id="inputGroup-sizing-lg">{contentTranslations.searchLabel}</InputGroup.Text>
            <FormControl aria-label="Large" aria-describedby="inputGroup-sizing-sm" />
          </InputGroup>

        {/*Reference Guide*/}
          <p></p> 
          <p>{contentTranslations.advancedQueries} <a href="http://www.solrtutorial.com/solr-query-syntax.html"> {contentTranslations.referenceGuide} </a></p>
        </Row>

        {/*Sub Header*/}
        <Row className="justify-content-md-center">
          <Button md="auto"><h2 className="display-6 bg-primary rounded-3 p-2">{contentTranslations.mainButton}</h2></Button>
        </Row>
      </Container>
    </Theme>
  );
}

export default Search;
