import React, { useState } from "react";
import {FormattedMessage} from 'react-intl';
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Alert from "react-bootstrap/Alert";
import "../../style.css";

/*
  Pages of Use: Search
  Description: Search box for new queries.
  Uses and updates the parents SearchQuery state

  Props:
    searchQuery: state from Search which holds the value in the search box
    setSearchQuery: function to update the searchQuery state

    searchResults: state from Search which holds the return value from searching
    setsearchResults: function to update the searchResults state

    language: language code the UI is currently set to, ex: en, fr

*/

const QueryBox = (props) => {

  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState("app.query.errorGeneric");

  const submitQuery = async() => {
    /* Single search term: https://example.com/search?df=text_en_txt&q=fish */
    const API_PREFIX = process.env.REACT_APP_API_PREFIX; // If prefix is set in environment variables, append to the request, otherwise use relative path
    const solrPath = "/search?"
    const langTerms = `text_${props.language}_txt`;
    const searchTerms = `q=${props.searchQuery}`;
    const requestURL = API_PREFIX + solrPath;

    setShow(false);

    fetch(requestURL + new URLSearchParams({
        q:props.searchQuery,
        df:`text_${props.language}_txt`,
        'q.op': "AND"
    }), {
      method: "GET",
      dataType: "JSON",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      }
    })
    .then((resp) => {   //fetch does not return non network errors, check for problems first!
      if(!resp.ok){
        throw Error(resp.statusText);
      }
      return resp;
    })
    .then((resp) => {
      return resp.json()
    }) 
    .then((data) => {
      if(data.response.numFound <= 0){
        throw Error("app.query.errorNoResults");
      }
      props.setsearchResults(data.response);
    })
    .catch((error) => {
      if(error.message == "app.query.errorNoResults"){
        // No results have been found
        setErrorMessage(error.message);
      }
      else if(error.name == "TypeError" && error.message == "Failed to fetch"){
        // Network error (API down, incorrect URL, Accept-Origin, etc.)
        setErrorMessage("app.query.errorFailedToFetch");
      } else {
        // Other error happened, log the results and return generic message
        console.log(error, "Unseen Error Found");
        setErrorMessage("app.query.errorGeneric");
      }
      props.setsearchResults("");
      setShow(true);
    })
  }

  const updateQuery = (e) => {
    props.setSearchQuery(e.target.value);
  }

  return(
    <>
      <InputGroup size="lg">
        <FormControl aria-label="Large" aria-describedby="inputGroup-sizing-lg" onChange={updateQuery} value={props.searchQuery}/>
        <Button variant="primary" id="search-button" onClick={submitQuery}>
          <FormattedMessage id = "app.search.mainButton" />
        </Button>
      </InputGroup>
      {show ? 
      <Alert variant="danger" onClose={() => setShow(false)} dismissible className="mt-2">
        <Alert.Heading><FormattedMessage id = "app.query.errorHeader" /></Alert.Heading>
        <p>
          <FormattedMessage id = {errorMessage} />
        </p>
      </Alert> : ""
      }
    </>
  );
}

export default QueryBox;