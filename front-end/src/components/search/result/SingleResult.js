import React from "react";
import {FormattedMessage} from 'react-intl';
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import View from "./View";
import Information from "./Information";

/*
  Pages of Use: Search
  Description: Holds an individial Search Result.
  Typically used by a parent component in a list of results

*/

const SingleResult = (props) =>{

  return(
    <Container className="slight-border px-5 py-3 mb-2 rounded-3">
      <Row><h2>{props.doc[`title_${props.language}_txt`]}</h2></Row>
      <Row>
        <Information id={props.doc.id} language={props.language} setSparqlData={props.setSparqlData} />
      </Row>
      {/*<Row><p>{(props.doc[`text_${props.language}_txt`]).toString().slice(0, 150) + "..."}</p></Row>*/}
      <Row>
        <p>{(props.doc[`text_${props.language}_txt`])}</p>
      </Row>
      <Row>
        <View id={props.doc.id} language={props.language}/>
      </Row>
    </Container>
  );
}

export default SingleResult;