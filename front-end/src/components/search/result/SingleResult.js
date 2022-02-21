import React from "react";
import {FormattedMessage, useIntl} from 'react-intl';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import View from "./View";
import Information from "./Information";
import { Link } from 'react-router-dom';

/*
  Pages of Use: Search
  Description: Holds an individial Search Result.
  Typically used by a parent component in a list of results

*/

const SingleResult = (props) =>{
  // Array of translations for the "Type: {TEXT_HERE}" <span>
  // Each key is meant to match the type_s returned from the /search/ API
  // so that type_s can be used to search this array. Other is a fallback. 
  const informationTranslations = {
    regulation : useIntl().formatMessage({id: "app.result.information.regulation"}),
    other : useIntl().formatMessage({id: "app.result.information.other"}),
    law : useIntl().formatMessage({id: "app.result.information.law"}),
  }

  // if the type is known, set typeValue to it, otherwise set it to Other
  const typeValue = (informationTranslations[props.doc[`type_s`]] ? informationTranslations[props.doc[`type_s`]] : informationTranslations["other"])
  let docId = props.doc.id;
  if(docId.includes("#"))
    docId = docId.split("#")[0]
  return(
    <Container className="slight-border px-5 py-3 mb-2 rounded-3" key={props.doc.id} >
      <Row><h2 tabIndex="0"><Link to={`/${props.language}/instrument/${encodeURIComponent(docId)}`}>{props.doc[`title_${props.language}_txt`]}</Link></h2></Row>
      <Row>
        <Information id={props.doc.id} language={props.language} setSparqlData={props.setSparqlData} sparqlData={props.sparqlData} />
      </Row>
      {/*<Row><p>{(props.doc[`text_${props.language}_txt`]).toString().slice(0, 150) + "..."}</p></Row>*/}
      <Row>
        <p tabIndex="0" dangerouslySetInnerHTML={{__html: props.highlight}}/>
      </Row>
      <Row><span tabIndex="0"><FormattedMessage id="app.result.information.type" />: {typeValue}. <FormattedMessage id="app.result.information.score" />: {props.score}.</span></Row>
      <Row>
        <View id={props.doc.id} language={props.language} linktarget={props.doc[`url_${props.language}_s`]}/>
      </Row>
    </Container>
  );
}

export default SingleResult;