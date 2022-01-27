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


import {Context} from "../components/lang/LanguageWrapper";

const scoresToPercentString = (singleScore, maxScore, decimalCount) => {
  // Given two numbers - a score for one result and a max score for the entire search
  // calculate the percentage of the singleScore out of the max score
  // convert to a string, return the results
  // For more information on how SOLR score results:
  // https://cwiki.apache.org/confluence/display/solr/SolrRelevancyFAQ#SolrRelevancyFAQ-Howaredocumentsscored
  const result = parseFloat(singleScore); //convert from strings
  const max = parseFloat(maxScore);
  return ((result / max) * 100).toFixed(decimalCount) + "%"
}

const Search = () => {

  const langContext = useContext(Context);
  const currentLang = langContext.locale;

  // Array of object from the search API, no extra data
  const [searchResults, setsearchResults] = useState("");

  // Array of more info for each search result that has
  // had the Related Regulations button clicked
  const [sparqlData, setSparqlData] = useState("");

  // Numeric value repsresenting offset for pagination
  const [pageOffset, setPageOffset] = useState(0);

  // Clear the Search Query and Search Results when the language context is updated.
  useEffect(() => {
    setsearchResults("");
    setSparqlData("");
    setPageOffset(0);
  }, [currentLang]);

  // Clear the More Info Sparql Query when the search results are updated.
  useEffect(() => {
    setSparqlData("");
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
        const score = scoresToPercentString(doc[1].score, searchResults.maxScore, 2);
        searchResultItems.push(
          <SingleResult doc={doc[1]} sparqlData={sparqlData} setSparqlData={setSparqlData} language={currentLang} key={doc[1].id} score={score}/>
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
