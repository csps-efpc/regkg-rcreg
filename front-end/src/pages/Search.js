import React, { useState, useContext, useEffect } from "react";
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
import QueryBox from "../components/search/QueryBox";
import SingleResult from "../components/search/result/SingleResult";

import {Context} from "../components/lang/LanguageWrapper";


const Search = () => {

  const langContext = useContext(Context);
  const currentLang = langContext.locale;

  // String containing what the user has put in the search box
  const [searchQuery, setSearchQuery] = useState("");

  // Array of object from the search API, no extra data
  const [searchResults, setsearchResults] = useState("");

  // Array of more info for each search result that has
  // had the Related Regulations button clicked
  const [sparqlData, setSparqlData] = useState("");

  // Clear the Search Query and Search Results when the language context is updated.
  useEffect(() => {
    setSearchQuery("");
    setsearchResults("");
    setSparqlData("");
  }, [currentLang]);

  const contentTranslations = {
    title : <FormattedMessage id = "app.search.title" />,
    mainButton : <FormattedMessage id = "app.search.mainButton" />,
    introduction : <FormattedMessage id = "app.search.introduction" />,
    advancedQueries : <FormattedMessage id = "app.search.advancedQueries" />,
    referenceGuide : <FormattedMessage id = "app.search.referenceGuide" />,
    searchLabel : <FormattedMessage id = "app.search.searchLabel" />,
    relatedItems : <FormattedMessage id = "app.result.related" />,
    openInNewTab : <FormattedMessage id = "app.result.link" />,
  }

  let searchResultJSX = "";
  let searchResultItems = []

  if (searchResults.docs){
    for (let doc of Object.entries(searchResults.docs)) {
      if(doc[1][`text_${currentLang}_txt`]){
        searchResultItems.push(
          <SingleResult doc={doc[1]} setSparqlData={setSparqlData} language={currentLang}/>
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
          <QueryBox language={currentLang} searchQuery={searchQuery} setSearchQuery={setSearchQuery} searchResults={searchResults} setsearchResults={setsearchResults}/>

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
