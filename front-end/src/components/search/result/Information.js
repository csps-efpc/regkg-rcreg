import React from "react";
import {FormattedMessage} from 'react-intl';
import Button from "react-bootstrap/Button";
/*
  Pages of Use: Search
  Description: View of the reg info and related regs.
  By default it is a button on its own
  When clicked it sends a query to the search API
  This updates the RegInfo state
  New UI elements to show this info pop up

*/

const Information = (props) =>{

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
        if(object.o["xml:lang"] == props.language){
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
      props.setSparqlData((prevState) => ({...prevState, [id]: data}));
    })
    .catch((error) => {
      console.log(error)
    })

  }

  return(
    <Button variant="light" className="left-button" size="lg" onClick={() => submitSparqlRelated(props.id)}>
      <span className="material-icons inline-icon-large">chevron_right</span><FormattedMessage id = "app.result.related" />,
    </Button>
  );
}

export default Information;