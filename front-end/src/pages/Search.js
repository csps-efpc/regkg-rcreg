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
import PaginationQuery from "../components/search/PaginationQuery";
import { useParams  } from 'react-router-dom';
import {Context} from "../components/lang/LanguageWrapper";


const Search = () => {

  const langContext = useContext(Context);
  const currentLang = langContext.locale;

  // Array of object from the search API, no extra data
  const [searchResults, setsearchResults] = useState("");

  // Array of more info for each search result that has
  // had the Related Regulations button clicked
  const [sparqlData, setSparqlData] = useState("");

  // Get pagination offset from the URL
  const { paginationOffsetUrl } = useParams();

  // Numeric value repsresenting offset for pagination
  const [pageOffset, setPageOffset] = useState(0);

  // Catch an update to searchParameterUrl
  // Set the correct states (UI view, and what is sent to API)
  const isValidNumeric = (str) =>{
    if (typeof str != "string") return false; // strings only
    if (isNaN(str)) return false; // is not a string value representing number
    return Number.isInteger(parseFloat(str));//    Number.isInteger(+ str);
  }

  useEffect(() => {
    if(paginationOffsetUrl && isValidNumeric(paginationOffsetUrl)){
      setPageOffset((parseInt(paginationOffsetUrl) - 1) * 10);
    } else {
      setPageOffset(0);
    }
  }, [paginationOffsetUrl])

  // Clear the Search Query and Search Results when the language context is updated.
  useEffect(() => {
    setsearchResults("");
    setSparqlData("");
  }, [currentLang]);

  // Clear the More Info Sparql Query when the search results are updated.
  useEffect(() => {
    setSparqlData("");
    if(paginationOffsetUrl && searchResults.numFound){
      if(((paginationOffsetUrl - 1) * 10) > searchResults.numFound){
        setPageOffset(0);
      }
    }
  }, [searchResults]);

  const contentTranslations = {
    title : <FormattedMessage id = "app.search.title" />,
    mainButton : <FormattedMessage id = "app.search.mainButton" />,
    introduction : <FormattedMessage id = "app.search.introduction" />,
    advancedQueries : <FormattedMessage id = "app.search.advancedQueries" />,
    referenceGuide : <FormattedMessage id = "app.search.referenceGuide" />,
    relatedItems : <FormattedMessage id = "app.result.related" />,
    openInNewTab : <FormattedMessage id = "app.result.link" />,
    resultCount : <FormattedMessage id = "app.search.resultCount" />,
  }

  let searchResultJSX = "";
  let searchResultItems = []

  if (searchResults.docs){
    for (let doc of Object.entries(searchResults.docs)) {
      if(doc[1][`text_${currentLang}_txt`]){
        searchResultItems.push(
          <SingleResult doc={doc[1]} sparqlData={sparqlData} setSparqlData={setSparqlData} language={currentLang} key={doc[1].id}/>
        );
      }
    };
    searchResultJSX = <>
      <hr/>
      <Container className="px-5 pb-5 pt-3 mb-4 bg-light rounded-3">
        <Row>
          <p>{searchResults.numFound} {contentTranslations.resultCount}</p>
        </Row>
        <Row>
          {searchResultItems}
        </Row>
        <Row>
          {/*Search Box*/}
          <PaginationQuery pageOffset={pageOffset} setPageOffset={setPageOffset} maxOffset={searchResults.numFound}/>
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
            <h1 className="header" tabIndex="0">{contentTranslations.title}</h1>
          </Col>
        </Row>

        {/*Introduction*/}
        <Row>
          <p tabIndex="0">{contentTranslations.introduction}</p>

          {/*Search Box*/}
          <QueryBox language={currentLang} searchResults={searchResults} setsearchResults={setsearchResults} pageOffset={pageOffset} setPageOffset={setPageOffset}/>

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
