import React, { useState, useContext, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import {FormattedMessage} from 'react-intl';
import "../style.css";
import logo from "../img/logo.svg";
import Theme from "../components/Theme"
import { TraversablePredicates } from "../components/TraversablePredicates"
import { useParams, Link } from 'react-router-dom';
import { Context } from "../components/lang/LanguageWrapper";


const Instrument = () => {
  const { instrumentId } = useParams();
  const decodedId = decodeURIComponent(instrumentId);
  const langContext = useContext(Context);
  const currentLang = langContext.locale;
  const [moreInfo, setMoreInfo] = useState();
  const predicates = [ // Declare the set of predicates that we'll be generating programmatically. The justice ones are all made-up.
    //Regex for find: final PropertyImpl .* = new PropertyImpl\(
    "rdf:Type",
    "https://laws-lois.justice.gc.ca/ext/instrument-id",
    "https://schema.org/name",
    "https://schema.org/legislationIdentifier",
    "https://schema.org/legislationDate",
    "https://schema.org/url",
    "https://www.gazette.gc.ca/ext/sponsor",
    "https://www.tpsgc-pwgsc.gc.ca/recgen/ext/org-name",
    "https://www.tpsgc-pwgsc.gc.ca/recgen/ext/department-head",
    "https://www.gazette.gc.ca/ext/consultation-word-count",
    "https://schema.org/wordCount",
    "https://laws-lois.justice.gc.ca/ext/section-count",
    "https://www.gazette.gc.ca/ext/cba-word-count",
    "https://www.gazette.gc.ca/ext/rias-word-count",
    "https://laws-lois.justice.gc.ca/ext/enabling-act",
    "https://schema.org/legislationChanges",
    "https://laws-lois.justice.gc.ca/ext/enables-regulation",
    "https://www.csps-efpc.gc.ca/ext/instrument-references",
    "https://schema.org/legislationConsolidates",
  ]
  const queryStringGenerator = (id) => {
    const querySign = "query=";
    const selectTerms =  encodeURIComponent("SELECT * { <") + id + encodeURIComponent("> ?p ?o FILTER (isURI(?o) || LANG(?o) IN (\""+currentLang+"\" , \"\")) OPTIONAL { ?o <https://schema.org/name> ?n FILTER (LANG(?n) IN (\""+currentLang+"\" , \"\"))}}")
    return querySign + selectTerms;
  }

  const submitSparqlRelated = async(id) => {
    /* Single search term: https://example.com/sparql?query=SELECT%20*%20{%3Chttps://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6%3E%20%3Chttps://schema.org/url%3E%20?o}%20LIMIT%208&Accept=application/sparql-results%2Bjson */
    const API_PREFIX = (process.env.REACT_APP_API_PREFIX ? process.env.REACT_APP_API_PREFIX : "");; // If prefix is set in environment variables, append to the request, otherwise use relative path
    const spaqrlPath = "/sparql?";
    const queryTerms = queryStringGenerator(id);
    const acceptTerms = "&Accept=application/sparql-results%2Bjson";
    const requestURL = API_PREFIX + spaqrlPath +  queryTerms + "&Accept=application/sparql-results%2Bjson";

    fetch(requestURL)
    .then((resp) => {
      return resp.json();
    }) 
    .then((data) => {
      console.log(data);
      return data.results.bindings;
    })
    .then((data) => {
      const dataInCurrentLang = [];
      for(const object of data){
        if(object.o["xml:lang"]){
          if(object.o["xml:lang"] == currentLang){
            dataInCurrentLang.push(object);
          }
        } else {
          dataInCurrentLang.push(object);
        }
      }
      return dataInCurrentLang;
    })
    .then((data) => {
      let convertedObject = {}
      for(const object of data){
        for(const p of predicates){
          if(object.p.value == p) {
              if(!convertedObject.hasOwnProperty(p)) {
                  convertedObject[p] = [];
              }
              var propertyObject = {
                  "value" : object.o.value,
                  "label" : (object.n ? object.n.value : object.o.value)
              };
              convertedObject[p].push(propertyObject);
          }
        }
      }
      return convertedObject;
    })
    .then((data) => {
      setMoreInfo(data);
    })
    .catch((error) => {
      console.log(error)
    })

  }

  useEffect(() => {
    submitSparqlRelated(decodedId);
  }, [instrumentId]);

  let moreInformationPanel = "";

  if(moreInfo){
    
    moreInformationPanel = 
    <span tabIndex="0" className="slight-border px-5 py-1 pt-4 m-2 rounded-3">
      {/*
          Get all the keys for the sparqlData[props.id] object (which are predicates)
          For each predicate return a new <p> tag
          Example <p>Word Count: 32642</p>
      */}
      {Object.keys(moreInfo).map((o, i) => {
        if(moreInfo[o].length == 1) {  
          if(TraversablePredicates.includes(o)) {// Check if o is in the special link array from above
            return  <p key={o}><FormattedMessage id={o}/>: <Link to={`/${currentLang}/instrument/${encodeURIComponent(moreInfo[o][0].value)}`}>{moreInfo[o][0].label}</Link></p>
          }
          if(o == "https://schema.org/url") {// special case, if o is a URL to the full text
            return  <p key={o}><FormattedMessage id={o}/>: <a target="_blank" href={moreInfo[o][0].value}>{moreInfo[o][0].label}</a></p>
          }
          return <p key={o}><FormattedMessage id={o}/>: {moreInfo[o][0].value}</p>
          } else {
              var rows = [];
              for(var i = 0; i < moreInfo[o].length; i++) {
                var oo = moreInfo[o][i];
                if(TraversablePredicates.includes(o)) {
                    rows.push( <li key={oo.value + o}><Link key={oo.value + "-" + o+"-link"} to={`/${currentLang}/instrument/${encodeURIComponent(oo.value)}`}>{oo.label}</Link></li> )
                } else if(o == "https://schema.org/url") {// special case, if o is a URL to the full text
                    rows.push( <li key={oo.value + o}><a target="_blank" href={oo.value}>{oo.value}</a></li> )
                } else {
                    rows.push (<li key={oo.value + o}> {oo.value} </li>)
                }
              }
              return <><p key={o}><FormattedMessage id={o}/>:</p> <ul key={o+"-ul"}>{rows}</ul></>
          }
    })}
    </span>
  }

  return(
    <Theme>
      {/*Content*/}
      <Container className="p-5 mb-4 bg-light rounded-3">

        {/*Header*/}
        <Row className="">
          <Col> 
            <h1 className="header">{(moreInfo && moreInfo.hasOwnProperty("https://schema.org/name")) ? moreInfo["https://schema.org/name"][0].value : ""}</h1>
          </Col>
        </Row>

        {/*Introduction*/}
        <Row>
          {moreInformationPanel ? moreInformationPanel : ""}
        </Row>
      </Container>
    </Theme>
  );
}

export default Instrument;
