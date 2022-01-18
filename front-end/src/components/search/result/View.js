import React from "react";
import {FormattedMessage} from 'react-intl';
import Button from "react-bootstrap/Button";
/*
  Pages of Use: Search
  Description: Button to open the result in a new tab.
  Sends a query to the API to get the required URL
  Sets the state with that URL if the button is pressed again

  props:
    id: 
*/

const View = (props) => {

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
      return data.results.bindings
    })
    .then((data) => {
      if(data[0])
        if(data[0].o["xml:lang"] == props.language)
          return data[0].o.value
      if(data[1])
        if(data[1].o["xml:lang"] == props.language)
          return data[1].o.value
    })
    .then((data) => {
      window.open(data, '_blank').focus();
    })
    .catch((error) => {
      console.log(error)
    })
  }
  
  return(
    <Button variant="light" className="left-button" size="lg" onClick={() => submitSparqlURL(props.id)}>
      <span className="material-icons inline-icon-large">open_in_new</span><FormattedMessage id = "app.result.link" />
    </Button>
  );
}

export default View;