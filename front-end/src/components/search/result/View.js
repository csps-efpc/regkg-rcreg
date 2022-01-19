import React from "react";
import {FormattedMessage} from 'react-intl';
import Button from "react-bootstrap/Button";
/*
  Pages of Use: Search
  Description: Button to open the result in a new tab.
  Sends a query to the API to get the required URL
  Sets the state with that URL if the button is pressed again

  props:
    id: a string identifying the exact regulatory instrument
      example: https://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6
      example 2: https://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6#1423 where the #1423 is the id for the block within the regulation

      if there is a # symbol, be aware to split the string at it and take the text before the hash
      if there is not, do not split
*/

const View = (props) => {

  const queryStringGenerator = (id) => {
    const querySign = "query=";
    const selectTerms = encodeURIComponent("SELECT * {") + "" + encodeURIComponent("<") + id.split("#")[0] + encodeURIComponent("> <") + "https://schema.org/url" + encodeURIComponent("> ") + "?o}" + encodeURIComponent(" LIMIT 8");
    return querySign + selectTerms;
  }

  const submitSparqlURL = async(id) => {
    /* Single search term: https://example.com/sparql?query=SELECT%20*%20{%3Chttps://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6%3E%20%3Chttps://schema.org/url%3E%20?o}%20LIMIT%208&Accept=application/sparql-results%2Bjson */
    const API_PREFIX = process.env.REACT_APP_API_PREFIX; // If prefix is set in environment variables, append to the request, otherwise use relative path
    const spaqrlPath = "/sparql?"
    const selectTerms = queryStringGenerator(id)
    const acceptTerms = `Accept=application/sparql-results+json`;
    const requestURL = API_PREFIX + spaqrlPath + selectTerms + "&Accept=application/sparql-results%2Bjson";

    fetch(requestURL)
    .then((resp) => {
      return resp.json();
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
      if(id.includes("#")){
        window.open(data + "#" + id.split("#")[1], '_blank').focus();
      } else {
        window.open(data, '_blank').focus();
      }
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