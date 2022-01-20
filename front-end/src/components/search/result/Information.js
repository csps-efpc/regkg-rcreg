import React, { useEffect, useState } from "react";
import {FormattedMessage} from 'react-intl';
import Button from "react-bootstrap/Button";
/*
  Pages of Use: Search
  Description: View of the reg info and related regs.
  By default it is a button on its own
  When clicked it sends a query to the search API
  This updates the RegInfo state
  New UI elements to show this info pop up

  props:
    id: a string identifying the exact regulatory instrument
      example: https://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6
      example 2: https://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6#1423 where the #1423 is the id for the block within the regulation

      if there is a # symbol, be aware to split the string at it and take the text before the hash
      if there is not, do not split

*/

const Information = (props) =>{

  const predicates = [ // Declare the set of predicates that we'll be generating programmatically. The justice ones are all made-up.
    //Regex for find: final PropertyImpl .* = new PropertyImpl\(
    "https://laws-lois.justice.gc.ca/ext/instrument-id",
    "https://www.gazette.gc.ca/ext/sponsor",
    "https://www.gazette.gc.ca/ext/consultation-word-count",
    "https://schema.org/wordCount",
    "https://laws-lois.justice.gc.ca/ext/section-count",
    "https://www.gazette.gc.ca/ext/cba-word-count",
    "https://www.gazette.gc.ca/ext/rias-word-count",
    "https://laws-lois.justice.gc.ca/ext/enabling-act",
    "https://laws-lois.justice.gc.ca/ext/amends-instrument",
    "https://laws-lois.justice.gc.ca/ext/consolidates",
    "https://laws-lois.justice.gc.ca/ext/enables-regulation",
    "https://schema.org/name",
    "https://schema.org/url",
    "https://www.tpsgc-pwgsc.gc.ca/recgen/ext/org-name",
    "https://www.tpsgc-pwgsc.gc.ca/recgen/ext/department-head",
    "https://www.csps-efpc.gc.ca/ext/instrument-references"
  ]

  const [moreInfo, setMoreInfo] = useState();

  const queryStringGenerator = (id) => {
    const querySign = "query=";
    const selectTerms =  encodeURIComponent("SELECT * {<") + id.split("#")[0] + encodeURIComponent("> ?p ?o} LIMIT 8")
    return querySign + selectTerms;
  }

  const submitSparqlRelated = async(id) => {
    /* Single search term: https://example.com/sparql?query=SELECT%20*%20{%3Chttps://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6%3E%20%3Chttps://schema.org/url%3E%20?o}%20LIMIT%208&Accept=application/sparql-results%2Bjson */
    const API_PREFIX = (process.env.REACT_APP_API_PREFIX ? process.env.REACT_APP_API_PREFIX : "");; // If prefix is set in environment variables, append to the request, otherwise use relative path
    const spaqrlPath = "/sparql?"
    const queryTerms = queryStringGenerator(id);
    const acceptTerms = "&Accept=application/sparql-results%2Bjson";
    const requestURL = API_PREFIX + spaqrlPath +  queryTerms + "&Accept=application/sparql-results%2Bjson";

    fetch(requestURL)
    .then((resp) => {
      return resp.json();
    }) 
    .then((data) => {
      return data.results.bindings;

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
        for(const p of predicates){
          if(object.p.value == p)
            convertedObject[p] = object.o.value;
        }
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

  let moreInformationPanel = "";

  if(props.sparqlData[props.id]){
    moreInformationPanel = 
    <span className="slight-border px-5 py-1 pt-4 m-2 rounded-3">
      {/*
          Get all the keys for the sparqlData[props.id] object (which are predicates)
          For each predicate return a new <p> tag
          Example <p>Word Count: 32642</p>
      */}

      {Object.keys(props.sparqlData[props.id]).map((o, i) => {
        return <p key={o}><FormattedMessage id={o}/>: {props.sparqlData[props.id][o]}</p>
      })}
    </span>
  }

  return(
    <>
      <Button variant="light" className="left-button" size="lg" onClick={() => submitSparqlRelated(props.id)}>
        <span className="material-icons inline-icon-large">chevron_right</span><FormattedMessage id = "app.result.information" />
      </Button>
      {moreInformationPanel}
    </>
  );
}

export default Information;