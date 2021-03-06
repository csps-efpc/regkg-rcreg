import React, { useState, useContext, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import {Link} from 'react-router-dom'
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import {FormattedMessage} from 'react-intl';
import "../style.css";
import logo from "../img/logo.svg";
import Theme from "../components/Theme";
import QueryBox from "../components/search/QueryBox";
import SingleResult from "../components/search/result/SingleResult";
import PaginationQuery from "../components/search/PaginationQuery";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
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

  const location = useLocation();
  const langContext = useContext(Context);
  const currentLang = langContext.locale;
  const { userSearchParam } = useParams();
  const navigate = useNavigate();

  // Array of object from the search API, no extra data
  const [searchResults, setsearchResults] = useState("");

  // Array of more info for each search result that has
  // had the Related Regulations button clicked
  const [sparqlData, setSparqlData] = useState("");

  // Get pagination offset from the URL
  const { paginationOffsetUrl } = useParams();

  // Numeric value repsresenting offset for pagination
  const [pageOffset, setPageOffset] = useState(0);

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

  let resultBar = "";
    if(searchResults.response && searchResults.response.numFound > 0) {
        resultBar = (<Navbar bg="light" expand="lg">
  <Container>
    <Navbar.Brand href="#home">{searchResults.response.numFound} {contentTranslations.resultCount}</Navbar.Brand>
    <Navbar.Toggle aria-controls="basic-navbar-nav" />
    <Navbar.Collapse id="basic-navbar-nav">
      <Nav className="me-auto">
        <Nav.Link as={Link} to={"/"+currentLang + "/mesh/" + location.pathname.split("/")[3]}><FormattedMessage id = "app.search.viewAsGraph" /></Nav.Link>
      </Nav>
    </Navbar.Collapse>
  </Container>
</Navbar>)
    
//        resultBar = <>{searchResults.numFound} {contentTranslations.resultCount}<Button variant="Secondary" onClick={routeToGraph}></Button></>
    }

  // Clear the More Info Sparql Query when the search results are updated.
  useEffect(() => {
    setSparqlData("");
    if(paginationOffsetUrl && searchResults.numFound){
      if(((paginationOffsetUrl - 1) * 10) > searchResults.numFound){
        setPageOffset(0);
      }
    }
  }, [searchResults]);


  let searchResultJSX = "";
  let searchResultItems = []

  if (searchResults.response && searchResults.response.docs){
    for (let doc of Object.entries(searchResults.response.docs)) {
      if(doc[1][`text_${currentLang}_txt`]){
        const score = scoresToPercentString(doc[1].score, searchResults.response.maxScore, 2);
        const highlight = searchResults.highlighting[doc[1].id][`text_${currentLang}_txt`];
        searchResultItems.push(
          <SingleResult doc={doc[1]} sparqlData={sparqlData} setSparqlData={setSparqlData} language={currentLang} key={doc[1].id} score={score} highlight={highlight}/>
        );
      }
    };
    searchResultJSX = <>
      <hr/>
      <Container className="px-5 pb-5 pt-3 mb-4 bg-light rounded-3">
        <Row>
          {resultBar}
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
          <p>{contentTranslations.advancedQueries} <Link to="../../help"> {contentTranslations.referenceGuide} </Link></p>
        </Row>
      </Container>
      {searchResultJSX}
    </Theme>
  );
}

export default Search;
