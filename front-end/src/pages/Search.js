import React, { useState, useContext, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Nav from "react-bootstrap/Nav";
import {FormattedMessage} from 'react-intl';
import "../style.css";
import Theme from "../components/Theme";

import {Context} from "../components/lang/LanguageWrapper";
import QueryBox from "../components/search/QueryBox";


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

  const submitSparqlURL = async(id) => {
    /* Single search term: https://dev.handshape.com/sparql?query=SELECT%20*%20{%3Chttps://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6%3E%20%3Chttps://schema.org/url%3E%20?o}%20LIMIT%208&Accept=application/sparql-results%2Bjson */
    const protocol = "https://";
    //const currentHost = window.location.hostname;
    const currentHost = "dev.handshape.com";
    const spaqrlPath = "/sparql?"
    const selectTerms = encodeURIComponent(`SELECT * {<${id}> <https://schema.org/url> ?o} LIMIT 8`);
    const acceptTerms = encodeURIComponent(`Accept=application/sparql-results+json`);
    const requestURL = protocol + currentHost + spaqrlPath;

    fetch(requestURL + new URLSearchParams({
        query:selectTerms,
        Accept:`application/sparql-results+json`
    }), {
      method: "GET",
      dataType: "JSON",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      mode: 'no-cors'
    })
    .then((resp) => {
      //return resp.json();
      return {
          "head": {
              "vars": [
                  "o"
              ]
          },
          "results": {
              "bindings": [
                  {
                      "o": {
                          "type": "literal",
                          "xml:lang": "en",
                          "value": "http://laws-lois.justice.gc.ca/eng/acts/P-15.6/FullText.html"
                      }
                  },
                  {
                      "o": {
                          "type": "literal",
                          "xml:lang": "fr",
                          "value": "http://laws-lois.justice.gc.ca/fra/lois/P-15.6/TexteComplet.html"
                      }
                  }
              ]
          }
      }
    }) 
    .then((data) => {
      console.log(data.results.bindings);
      return data.results.bindings
    })
    .then((data) => {
      if(data[0])
        if(data[0].o["xml:lang"] == currentLang)
          return data[0].o.value
      if(data[1])
        if(data[1].o["xml:lang"] == currentLang)
          return data[1].o.value
    })
    .then((data) => {
      console.log(data);
      window.open(data, '_blank').focus();
    })
    .catch((error) => {
      console.log(error)
    })

  }

  const submitSparqlRelated = async(id) => {
    /* Single search term: https://dev.handshape.com/sparql?query=SELECT%20*%20{%3Chttps://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6%3E%20%3Chttps://schema.org/url%3E%20?o}%20LIMIT%208&Accept=application/sparql-results%2Bjson */
    const protocol = "https://";
    //const currentHost = window.location.hostname;
    const currentHost = "dev.handshape.com";
    const spaqrlPath = "/sparql?"
    const selectTerms = encodeURIComponent(`SELECT * {<${id}> ?p ?o} LIMIT 8`);
    const acceptTerms = encodeURIComponent(`Accept=application/sparql-results+json`);
    const requestURL = protocol + currentHost + spaqrlPath;

    fetch(requestURL + new URLSearchParams({
        query:selectTerms,
        Accept:`application/sparql-results+json`
    }), {
      method: "GET",
      dataType: "JSON",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      mode: 'no-cors'
    })
    .then((resp) => {
      //return resp.json();
      return {
          "head": {
              "vars": [
                  "p",
                  "o"
              ]
          },
          "results": {
              "bindings": [
                  {
                      "p": {
                          "type": "uri",
                          "value": "https://laws-lois.justice.gc.ca/ext/section-count"
                      },
                      "o": {
                          "type": "literal",
                          "value": "13"
                      }
                  },
                  {
                      "p": {
                          "type": "uri",
                          "value": "https://schema.org/wordCount"
                      },
                      "o": {
                          "type": "literal",
                          "xml:lang": "en",
                          "value": "207"
                      }
                  },
                  {
                      "p": {
                          "type": "uri",
                          "value": "https://schema.org/wordCount"
                      },
                      "o": {
                          "type": "literal",
                          "xml:lang": "fr",
                          "value": "224"
                      }
                  },
                  {
                      "p": {
                          "type": "uri",
                          "value": "https://schema.org/url"
                      },
                      "o": {
                          "type": "literal",
                          "xml:lang": "en",
                          "value": "http://laws-lois.justice.gc.ca/eng/acts/P-15.6/FullText.html"
                      }
                  },
                  {
                      "p": {
                          "type": "uri",
                          "value": "https://schema.org/url"
                      },
                      "o": {
                          "type": "literal",
                          "xml:lang": "fr",
                          "value": "http://laws-lois.justice.gc.ca/fra/lois/P-15.6/TexteComplet.html"
                      }
                  },
                  {
                      "p": {
                          "type": "uri",
                          "value": "https://laws-lois.justice.gc.ca/ext/instrument-id"
                      },
                      "o": {
                          "type": "literal",
                          "xml:lang": "en",
                          "value": "P-15.6"
                      }
                  },
                  {
                      "p": {
                          "type": "uri",
                          "value": "https://laws-lois.justice.gc.ca/ext/instrument-id"
                      },
                      "o": {
                          "type": "literal",
                          "xml:lang": "fr",
                          "value": "P-15.6"
                      }
                  },
                  {
                      "p": {
                          "type": "uri",
                          "value": "https://schema.org/name"
                      },
                      "o": {
                          "type": "literal",
                          "xml:lang": "en",
                          "value": "Postal Services Continuation Act, 1987"
                      }
                  }
              ]
          }
      }
    }) 
    .then((data) => {
      return data.results.bindings
    })
    .then((data) => {
      const dataInCurrentLang = [];
      for(const object of data){
        if(object.o["xml:lang"] == currentLang){
          dataInCurrentLang.push(object);
        }
      }
      return dataInCurrentLang;
    })
    .then((data) => {
      let convertedObject = {}
      for(const object of data){
        if(object.p.value == "https://schema.org/wordCount")
          convertedObject["wordCount"] = object.o.value;
        if(object.p.value == "https://laws-lois.justice.gc.ca/ext/instrument-id")
          convertedObject["instrument-id"] = object.o.value;
        if(object.p.value == "https://schema.org/name")
          convertedObject["name"] = object.o.value;
      }
      return convertedObject;
    })
    .then((data) => {
      console.log(sparqlData);
      setSparqlData((prevState) => ({...prevState, [id]: data}));
    })
    .then((data) => {
      console.log(sparqlData);
    })
    .catch((error) => {
      console.log(error)
    })

  }

  const contentTranslations = {
    title : <FormattedMessage id = "app.search.title" />,
    introduction : <FormattedMessage id = "app.search.introduction" />,
    advancedQueries : <FormattedMessage id = "app.search.advancedQueries" />,
    referenceGuide : <FormattedMessage id = "app.search.referenceGuide" />,
    searchLabel : <FormattedMessage id = "app.search.searchLabel" />,
  }

  let searchResultJSX = "";
  let searchResultItems = []
  let moreInfo = "";

  if (searchResults.docs){
    for (let doc of Object.entries(searchResults.docs)) {
      if(sparqlData["doc[1].id"]){
        moreInfo = `Name: ${sparqlData["doc[1].id"]["name"]} ID: ${sparqlData["doc[1].id"]["instrument-id"]} Word Count: ${sparqlData["doc[1].id"]["wordCount"]}`
      }
      if(doc[1][`text_${currentLang}_txt`]){
        searchResultItems.push(
          <Container className="slight-border px-5 py-3 mb-2 rounded-3">
            <Row><h2>{doc[1][`title_${currentLang}_txt`]}</h2></Row>
            <Row>
              <Button variant="light" className="left-button" size="lg" onClick={() => submitSparqlRelated(doc[1].id)} data-link="{doc[1].id}">
                <span class="material-icons inline-icon-large">chevron_right</span>
                Related Regulations
              </Button>
            </Row>
            <Row>
              <p>{moreInfo}</p>
            </Row>
            {/*<Row><p>{(doc[1][`text_${currentLang}_txt`]).toString().slice(0, 150) + "..."}</p></Row>*/}
            <Row>
              <p>{(doc[1][`text_${currentLang}_txt`])}</p>
            </Row>
            <Row>
              <Button variant="light" className="left-button" size="lg" onClick={() => submitSparqlURL(doc[1].id)} data-link="{doc[1].id}">
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
      <Container className="p-5 pb-3 mb-4 bg-light rounded-3">

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
