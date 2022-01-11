import React from "react";
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

  const contentTranslations = {
    title : <FormattedMessage id = "app.search.title" />,
    mainButton : <FormattedMessage id = "app.search.mainButton" />,
    introduction : <FormattedMessage id = "app.search.introduction" />,
    advancedQueries : <FormattedMessage id = "app.search.advancedQueries" />,
    referenceGuide : <FormattedMessage id = "app.search.referenceGuide" />,
    searchLabel : <FormattedMessage id = "app.search.searchLabel" />,
  }

const QueryBox = (props) => {

  const submitQuery = async() => {
    /* Single search term: https://dev.handshape.com/search?df=text_en_txt&q=fish */
    const protocol = "https://";
    //const currentHost = window.location.hostname;
    const currentHost = "dev.handshape.com";
    const solrPath = "/search?"
    const langTerms = `text_${props.language}_txt`;
    const searchTerms = `q=${props.searchQuery}`;
    const requestURL = protocol + currentHost + solrPath;

    fetch(requestURL + new URLSearchParams({
        q:props.searchQuery,
        df:`text_${props.language}_txt`
    }), {
      method: "GET",
      dataType: "JSON",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      }
    })
    .then((resp) => {
      return resp.json()
    }) 
    .then((data) => {
      props.setsearchResults(data.response);
    })
    .then(() => {
      console.log(props.searchResults);
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