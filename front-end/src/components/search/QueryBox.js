import React, { useState } from "react";
import {FormattedMessage} from 'react-intl';
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
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

  const submitQuery = async() => {
    /* Single search term: https://example.com/search?df=text_en_txt&q=fish */
    const API_PREFIX = process.env.REACT_APP_API_PREFIX; // If prefix is set in environment variables, append to the request, otherwise use relative path
    const solrPath = "/search?"
    const langTerms = `text_${props.language}_txt`;
    const searchTerms = `q=${props.searchQuery}`;
    const requestURL = API_PREFIX + solrPath;

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
      props.setsearchResults(data.response);
    })
    .catch((error) => {
      console.log(error, "catch the blip");
    })
  }

  const updateQuery = (e) => {
    props.setSearchQuery(e.target.value);
  }

  return(
    <InputGroup size="lg">
      <FormControl aria-label="Large" aria-describedby="inputGroup-sizing-lg" onChange={updateQuery} value={props.searchQuery}/>
      <Button variant="primary" id="search-button" onClick={submitQuery}>
        <FormattedMessage id = "app.search.mainButton" />
      </Button>
    </InputGroup>
  );
}

export default QueryBox;
