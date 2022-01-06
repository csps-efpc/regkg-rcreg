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
import Theme from "../components/Theme";

import {Context} from "../components/lang/LanguageWrapper";


const Search = () => {

  const langContext = useContext(Context);
  const currentLang = langContext.locale;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setsearchResults] = useState("");

  const updateQuery = (e) => {
    setSearchQuery(e.target.value);
  }

  const submitQuery = async() => {
    /* Single search term: https://dev.handshape.com/search?df=text_en_txt&q=fish */
    const protocol = "https://";
    //const currentHost = window.location.hostname;
    const currentHost = "dev.handshape.com";
    const solrPath = "/search?"
    const langTerms = `text_${currentLang}_txt`;
    const searchTerms = `q=${searchQuery}`;
    const requestURL = protocol + currentHost + solrPath;

    fetch(requestURL + new URLSearchParams({
        q:searchQuery,
        df:`text_${currentLang}_txt`
    }), {
      method: "GET",
      dataType: "JSON",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      }
    })
    .then((resp) => {
      return resp.json()
    }) 
    .then((data) => {
      setsearchResults(data.response);
    })
    .then(() => {
      console.log(searchResults);
    })
    .catch((error) => {
      console.log(error, "catch the blip")
    })

  }

  const contentTranslations = {
    title : <FormattedMessage id = "app.search.title" />,
    mainButton : <FormattedMessage id = "app.search.mainButton" />,
    introduction : <FormattedMessage id = "app.search.introduction" />,
    advancedQueries : <FormattedMessage id = "app.search.advancedQueries" />,
    referenceGuide : <FormattedMessage id = "app.search.referenceGuide" />,
    searchLabel : <FormattedMessage id = "app.search.searchLabel" />,
  }

  let searchResultJSX = "";
  let searchResultItems = []

  if (searchResults.docs){
    for (let doc of Object.entries(searchResults.docs)) {
      if(doc[1][`text_${currentLang}_txt`]){
        console.log(doc[1][`text_${currentLang}_txt`][0]);
        searchResultItems.push(
          <Container className="slight-border px-5 py-3 mb-2 rounded-3">
            <Row><h2>{doc[1][`title_${currentLang}_txt`]}</h2></Row>
            <Row>
              <Button variant="light" className="left-button" size="lg" data-link="{doc[1].id}">
                <span class="material-icons inline-icon-large">chevron_right</span>
                Related Regulations
              </Button>
            </Row>
            {/*<Row><p>{(doc[1][`text_${currentLang}_txt`]).toString().slice(0, 150) + "..."}</p></Row>*/}
            <Row>
              <p>{(doc[1][`text_${currentLang}_txt`])}</p>
            </Row>
            <Row>
              <Button variant="light" className="left-button" size="lg" data-link="{doc[1].id}">
                <span class="material-icons inline-icon-large">open_in_new</span> Open Regulation In New Tab
              </Button>
            </Row>
          </Container>
        );
      }
    };
    searchResultJSX = <>
      <hr/>
      <Container className="p-5 mb-4 bg-light rounded-3">
        <Row>
          {searchResultItems}
        </Row>
      </Container>

    </>;
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
            <FormControl aria-label="Large" aria-describedby="inputGroup-sizing-lg" onChange={updateQuery}/>
            <Button variant="primary" id="search-button" onClick={submitQuery}>
              {contentTranslations.mainButton}
            </Button>
          </InputGroup>

        {/*Reference Guide*/}
          <p></p> 
          <p>{contentTranslations.advancedQueries} <a href="http://www.solrtutorial.com/solr-query-syntax.html"> {contentTranslations.referenceGuide} </a></p>
        </Row>
      </Container>
      {searchResultJSX}
    </Theme>
  );
}

export default Search;
